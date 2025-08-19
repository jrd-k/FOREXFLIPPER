# main.py (updated)
import time
import datetime
import logging
import os
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger("bot")

from server.services import brokerConnector as broker
from server.services import riskManager as risk
from server.services import tradeLogger as logger
from server.services import news_filter as news

# --- Configuration (can be overridden via .env) ---
SCAN_INTERVAL = float(os.getenv("SCAN_INTERVAL", "10.0"))             # seconds between scan cycles
MAX_ALLOWED_SPREAD_PIPS = float(os.getenv("MAX_ALLOWED_SPREAD_PIPS", "2.0"))
SMALL_ACCOUNT_THRESHOLD = float(os.getenv("SMALL_ACCOUNT_THRESHOLD", "50.0"))
MAX_DAILY_LOSS_PCT = float(os.getenv("MAX_DAILY_LOSS_PCT", "0.20"))   # 20% daily stop
MAX_OPEN_TRADES = int(os.getenv("MAX_OPEN_TRADES", "5"))
MAX_LAYERS = int(os.getenv("MAX_LAYERS", "3"))                       # stacking per signal
GOLD_PAIR = os.getenv("GOLD_PAIR", "XAUUSD")
MIN_BALANCE_FOR_GOLD = float(os.getenv("MIN_BALANCE_FOR_GOLD", "500.0"))

# Basic symbol list; NOTE: include XAUUSD here if you want it available (it will be locked until balance threshold).
ALL_PAIRS = [
    "EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","NZDUSD","EURGBP",
    "GBPJPY","AUDJPY","XAUUSD"   # XAUUSD present but gated by balance check
]

def should_trade_symbol(symbol, balance):
    """Block gold until balance reaches threshold."""
    if symbol == GOLD_PAIR and balance < MIN_BALANCE_FOR_GOLD:
        return False
    return True

def get_open_positions_count():
    """Return count of open positions via MT5 (0 if not available)."""
    try:
        positions = broker.mt5.positions_get()
        return len(positions) if positions else 0
    except Exception:
        return 0

def max_daily_loss_reached(balance):
    """Return True if daily PnL < -MAX_DAILY_LOSS_PCT * balance."""
    stats = logger.reset_daily_stats_if_needed()
    daily_pnl = stats.get("daily_pnl", 0.0)
    if daily_pnl < - (MAX_DAILY_LOSS_PCT * balance):
        return True
    return False

def compute_indicators(candles):
    """
    Compute basic indicators using pandas/pandas_ta.
    candles: list of close prices (oldest...newest)
    """
    closes = candles
    if len(closes) < 30:
        return None
    import pandas as pd
    import pandas_ta as ta
    s = pd.Series(closes)
    ema9 = s.ewm(span=9, adjust=False).mean().iloc[-1]
    ema21 = s.ewm(span=21, adjust=False).mean().iloc[-1]
    rsi = ta.rsi(s, length=14).iloc[-1]
    # Use close series as proxy for H/L in ATR; better to pass real H/L/C if available
    atr = float(ta.atr(high=s, low=s, close=s, length=14).iloc[-1])
    adx = 25  # placeholder; compute if you have H/L/C available
    return {"ema9": ema9, "ema21": ema21, "rsi": float(rsi), "atr": atr, "adx": adx}

def main_loop():
    LOG.info("Starting bot main loop.")
    broker.connect_mt5()  # will raise if not connected
    try:
        while True:
            balance = broker.get_account_balance()
            LOG.info("Balance: %.2f", balance)

            # Safety: stop trading for the day if daily loss limit hit
            if max_daily_loss_reached(balance):
                LOG.warning("Daily loss limit reached (%.2f%%). Pausing until next day.", MAX_DAILY_LOSS_PCT*100)
                time.sleep(60*60)  # pause 1 hour; will be skipped if still over limit
                continue

            # Refresh/reset daily stats
            logger.reset_daily_stats_if_needed()

            for symbol in ALL_PAIRS:
                # Symbol gating (gold locked until balance threshold)
                if not should_trade_symbol(symbol, balance):
                    LOG.debug("Symbol %s locked (balance < %.2f)", symbol, MIN_BALANCE_FOR_GOLD)
                    continue

                # Spread guard
                spread = broker.spread_in_pips(symbol)
                if spread is None or spread > MAX_ALLOWED_SPREAD_PIPS:
                    LOG.debug("Skipping %s due to spread: %.2f pips", symbol, spread if spread is not None else -1)
                    continue

                # News guard hook
                if news.is_near_high_impact_news():
                    LOG.debug("Skipping trades due to upcoming high-impact news.")
                    continue

                # Prevent too many open trades
                open_count = get_open_positions_count()
                if open_count >= MAX_OPEN_TRADES:
                    LOG.info("Max open trades (%d) reached. Skipping new entries.", MAX_OPEN_TRADES)
                    break  # break symbol loop to re-evaluate after interval

                # Get 1-min candles (60 bars)
                try:
                    rates = broker.mt5.copy_rates_from_pos(symbol, broker.mt5.TIMEFRAME_M1, 0, 60)
                except Exception as e:
                    LOG.debug("Failed to fetch rates for %s: %s", symbol, e)
                    continue
                if rates is None:
                    continue
                closes = [r.close for r in rates]
                indicators = compute_indicators(closes)
                if not indicators:
                    continue

                # Signal logic (trend preference + rsi fallback)
                signal = None
                if indicators["ema9"] > indicators["ema21"] and indicators["adx"] > 20:
                    signal = "buy"
                elif indicators["ema9"] < indicators["ema21"] and indicators["adx"] > 20:
                    signal = "sell"
                else:
                    if indicators["rsi"] < 30:
                        signal = "buy"
                    elif indicators["rsi"] > 70:
                        signal = "sell"

                if not signal:
                    continue

                # Stop loss and take profit using ATR (rounded to integer pips)
                sl_pips = max(5, int(round(indicators["atr"] * 1.5)))
                tp_pips = int(round(sl_pips * 1.5))

                # Determine risk mode (fixed-dollar for tiny accounts, percent for larger)
                risk_value, risk_pct = risk.auto_risk_mode(balance)

                # Calculate lot size
                # risk.calculate_lot signature: calculate_lot(balance, stop_loss_pips, symbol, risk_value=..., risk_percent=...)
                lots = risk.calculate_lot(balance=balance, stop_loss_pips=sl_pips, symbol=symbol,
                                          risk_value=risk_value, risk_percent=risk_pct)

                # Layering: open up to MAX_LAYERS entries for the same signal (watch open count)
                for layer in range(1, MAX_LAYERS + 1):
                    # Re-check open count before placing each layer
                    if get_open_positions_count() >= MAX_OPEN_TRADES:
                        LOG.info("Reached max open trades while layering; stopping layering for now.")
                        break

                    res = broker.place_order_mt5(symbol, signal, lots, sl_pips, tp_pips)
                    if res.get("ok"):
                        ts = datetime.datetime.utcnow()
                        # record trade (pnl unknown until closed)
                        # Use your existing logger function names: increment_trade_count_and_record exists in your logger module
                        try:
                            trade_count, daily_pnl = logger.increment_trade_count_and_record(pnl=0.0, balance=balance)
                        except Exception:
                            # fallback if different logger function names exist
                            trade_count, daily_pnl = logger.update_after_trade(0.0, balance) if hasattr(logger, "update_after_trade") else (None, None)
                        logger.append_trade(ts, symbol, signal, lots, sl_pips, tp_pips, 0.0, balance, trade_count)
                        LOG.info("Placed %s layer %d/%d on %s: %.2f lots (SL %dp TP %dp)", signal.upper(), layer, MAX_LAYERS, symbol, lots, sl_pips, tp_pips)
                        # tiny pause between layers
                        time.sleep(0.3)
                    else:
                        LOG.warning("Failed to place order on %s: %s", symbol, res)
                        break  # stop layering if one layer failed

                # tiny per-symbol pause (reduce to increase frequency cautiously)
                time.sleep(0.5)

            # end symbol loop -> wait before next cycle
            time.sleep(SCAN_INTERVAL)
    finally:
        broker.disconnect_mt5()

if __name__ == "__main__":
    main_loop()
