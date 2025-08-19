# server/services/tradeLogger.py
import csv
import os
import json
import datetime
import logging

# import broker connector to access mt5
from server.services import brokerConnector as broker

LOG = logging.getLogger("tradeLogger")
LOG.setLevel(logging.INFO)

LOG_CSV = "trade_log.csv"
DAILY_FILE = "daily_stats.json"
LOGGED_DEALS_FILE = "logged_deals.json"  # persist dealt tickets we already processed

def ensure_log_csv():
    if not os.path.exists(LOG_CSV):
        with open(LOG_CSV, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["timestamp","date","symbol","direction","lots","sl_pips","tp_pips","pnl","balance_after","trade_count_day","deal_ticket"])

def append_trade(timestamp, symbol, direction, lots, sl, tp, pnl, balance, trade_count_day, deal_ticket=None):
    """
    Append a single trade row (open or closed).
    deal_ticket: optional unique id from MT5 history/deal ticket
    """
    ensure_log_csv()
    with open(LOG_CSV, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            timestamp.isoformat() if isinstance(timestamp, datetime.datetime) else str(timestamp),
            timestamp.date().isoformat() if isinstance(timestamp, datetime.datetime) else "",
            symbol,
            direction,
            lots,
            sl,
            tp,
            float(pnl),
            float(balance),
            trade_count_day,
            deal_ticket if deal_ticket is not None else ""
        ])

# daily stats persistence
def load_daily_stats():
    if not os.path.exists(DAILY_FILE):
        return {"date": None, "trade_count": 0, "daily_pnl": 0.0}
    with open(DAILY_FILE, "r") as f:
        return json.load(f)

def save_daily_stats(stats):
    with open(DAILY_FILE, "w") as f:
        json.dump(stats, f)

def reset_daily_stats_if_needed():
    stats = load_daily_stats()
    today = datetime.date.today().isoformat()
    if stats.get("date") != today:
        stats = {"date": today, "trade_count": 0, "daily_pnl": 0.0}
        save_daily_stats(stats)
    return stats

def update_after_trade_open(pnl, balance):
    """
    Call when a trade is opened (we usually don't know pnl yet).
    Returns (trade_count, daily_pnl)
    """
    stats = reset_daily_stats_if_needed()
    stats["trade_count"] = stats.get("trade_count", 0) + 1
    stats["daily_pnl"] = float(stats.get("daily_pnl", 0.0)) + float(pnl)  # we may pass 0.0 for open
    save_daily_stats(stats)
    return stats["trade_count"], stats["daily_pnl"]

def update_after_trade_close(pnl, balance):
    """
    Call when a trade is closed and pnl known.
    Adds pnl to daily_pnl (can be negative).
    """
    stats = reset_daily_stats_if_needed()
    stats["daily_pnl"] = float(stats.get("daily_pnl", 0.0)) + float(pnl)
    save_daily_stats(stats)
    return stats["trade_count"], stats["daily_pnl"]

# persisted set of already-logged deal tickets
def _load_logged_deals():
    if not os.path.exists(LOGGED_DEALS_FILE):
        return []
    try:
        with open(LOGGED_DEALS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def _save_logged_deals(tickets):
    with open(LOGGED_DEALS_FILE, "w") as f:
        json.dump(list(tickets), f)

_logged_deals = set(_load_logged_deals())

def record_closed_trades(days_back=2):
    """
    Scan MT5 history deals for recent closed trades and log them once.
    - days_back: how many days back to query history (safe default 2)
    This should be called periodically (e.g., at end of each scan cycle).
    """
    if not hasattr(broker, "mt5") or broker.mt5 is None:
        LOG.debug("MT5 not available; skipping record_closed_trades")
        return []

    mt5 = broker.mt5
    to_time = datetime.datetime.utcnow()
    from_time = to_time - datetime.timedelta(days=days_back)

    try:
        deals = mt5.history_deals_get(from_time, to_time)
    except Exception as e:
        LOG.warning("history_deals_get failed: %s", e)
        deals = None

    if not deals:
        return []

    new_logged = []
    for d in deals:
        # deal ticket is unique for each history_deal
        ticket = int(getattr(d, "ticket", getattr(d, "deal", None) or 0))
        if ticket in _logged_deals:
            continue

        # filter: only closed deals with non-zero profit OR orders that were closed
        profit = float(getattr(d, "profit", 0.0))
        symbol = getattr(d, "symbol", None)
        volume = float(getattr(d, "volume", 0.0))
        # type mapping: for MT5, deal.type values indicate buy/sell as ints; we'll attempt to map:
        deal_type = getattr(d, "type", None)
        # best-effort detection of direction
        direction = "buy" if deal_type in (0, 1) and str(deal_type).lower().find("buy") != -1 else "buy"
        # For safety, try mapping using order type constants if available
        try:
            # mt5.ORDER_TYPE_BUY = 0 etc. We fallback to heuristics above
            if deal_type == broker.mt5.ORDER_TYPE_BUY:
                direction = "buy"
            elif deal_type == broker.mt5.ORDER_TYPE_SELL:
                direction = "sell"
        except Exception:
            pass

        # build approximate balance after: we can't rely on exact balance here, put None or compute later
        # timestamp: d.time is seconds since epoch
        try:
            ts = datetime.datetime.utcfromtimestamp(int(getattr(d, "time", datetime.datetime.utcnow().timestamp())))
        except Exception:
            ts = datetime.datetime.utcnow()

        # append closed trade row
        append_trade(
            timestamp=ts,
            symbol=symbol,
            direction=direction,
            lots=volume,
            sl=None,
            tp=None,
            pnl=profit,
            balance=0.0,               # leave 0.0 for now (update if you compute balance after)
            trade_count_day=None,
            deal_ticket=ticket
        )

        _logged_deals.add(ticket)
        new_logged.append(ticket)

        # Update daily stats (add pnl)
        update_after_trade_close(profit, 0.0)

    if new_logged:
        # persist logged tickets
        try:
            _save_logged_deals(_logged_deals)
        except Exception as e:
            LOG.warning("Failed to save logged deals: %s", e)

    LOG.debug("record_closed_trades logged %d new deals", len(new_logged))
    return new_logged
