# server/services/tradeLogger.py
import csv
import os
import datetime
import json

LOG_CSV = "trade_log.csv"
DAILY_STATS_FILE = "daily_stats.json"

def ensure_log():
    if not os.path.exists(LOG_CSV):
        with open(LOG_CSV, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["timestamp","date","symbol","direction","lots","sl_pips","tp_pips","pnl","balance_after","trade_count_day"])

def append_trade(timestamp, symbol, direction, lots, sl, tp, pnl, balance, trade_count_day):
    ensure_log()
    with open(LOG_CSV, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([timestamp.isoformat(), timestamp.date().isoformat(), symbol, direction, lots, sl, tp, pnl, balance, trade_count_day])

def load_daily_stats():
    if not os.path.exists(DAILY_STATS_FILE):
        return {"date": None, "trade_count": 0, "daily_pnl": 0.0}
    with open(DAILY_STATS_FILE, "r") as f:
        return json.load(f)

def save_daily_stats(stats):
    with open(DAILY_STATS_FILE, "w") as f:
        json.dump(stats, f)

def reset_daily_stats_if_needed():
    stats = load_daily_stats()
    today = datetime.date.today().isoformat()
    if stats.get("date") != today:
        stats = {"date": today, "trade_count": 0, "daily_pnl": 0.0}
        save_daily_stats(stats)
    return stats

def increment_trade_count_and_record(pnl, balance):
    stats = reset_daily_stats_if_needed()
    stats["trade_count"] = stats.get("trade_count", 0) + 1
    stats["daily_pnl"] = float(stats.get("daily_pnl", 0.0)) + float(pnl)
    save_daily_stats(stats)
    return stats["trade_count"], stats["daily_pnl"]
