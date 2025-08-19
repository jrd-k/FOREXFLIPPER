# main.py (root or server/main.py)
import time
import datetime
import logging
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger("bot")

from server.services import brokerConnector as broker
from server.services import riskManager as risk
from server.services import tradeLogger as logger
from server.services import news_filter as news

# Config
MAX_ALLOWED_SPREAD_PIPS = float(__import__("os").environ.get("MAX_ALLOWED_SPREAD_PIPS", 2.0))
SMALL_ACCOUNT_THRESHOLD = float(__import__("os").environ.get("SMALL_ACCOUNT_THRESHOLD", 50.0))

def get_forex_pairs():
    # Replace with dynamic fetch from MT5 or config list
    raw = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","NZDUSD","EURGBP"]
    excluded_substrings = ["XAU","XAG","OIL","BTC","ETH","DE30","NAS","USOIL","UKOIL"]
    return [s for s in raw if not any(x in s for x in excluded_substrings)]

def compute_indicators(candles):
    # Placeholder: replace with pandas/pandas_ta calculations
    # candles is list of close prices (most recent last)
    closes = candles
    if len(closes) < 30:
        return None
    # quick simple EMAs and RSI via pandas if you prefer
    import pandas as pd
    import pandas_ta as ta
    s = pd.Series(closes)
    ema9 = s.ewm(span=9, adjust=False).mean().iloc[-1]
    ema21 = s.ewm(span=21, adjust=False).mean().iloc[-1]
    rsi = ta.rsi(s, length=14).iloc[-1]
    atr = ta.atr(high=pd.Series(closes), low=pd.Series(closes), close=pd.Series(closes), length=14).iloc[-1]
    # adx needs hlc series; for placeholder assume 25
    adx = 25
    return {"ema9": ema9, "ema21": ema21, "rsi": rsi, "atr": float(atr), "adx": adx}

def main_loop():
    # connect
    broker.connect_mt5()
    try:
        while True:
            pairs = get_forex_pairs()
            # refresh daily stats
            stats = logger.reset_daily_stats_if_needed()
            for pair in pairs:
                # quick spread check
                spread = broker.spread_in_pips(pair)
                if spread > MAX_ALLOWED_SPREAD_PIPS:
                    LOG.info("Skip %s due to spread %.2f pips", pair, spread)
                    continue
                # skip near news
                if news.is_near_high_impact_news():
                    LOG.info("Skipping trades due to upcoming news")
                    continue
                # get prices (1-min candles)
                rates = broker.mt5.copy_rates_from_pos(pair, broker.mt5.TIMEFRAME_M1, 0, 60) if broker.mt5 else None
                if rates is None:
                    continue
                closes = [r.close for r in rates]
                indicators = compute_indicators(closes)
                if not indicators:
                    continue
                # simple signal: ema9 > ema21 -> buy; ema9 < ema21 -> sell
                signal = None
                if indicators["ema9"] > indicators["ema21"] and indicators["adx"] > 20:
                    signal = "buy"
                elif indicators["ema9"] < indicators["ema21"] and indicators["adx"] > 20:
                    signal = "sell"
                else:
                    # range trades via RSI
                    if indicators["rsi"] < 30:
                        signal = "buy"
                    elif indicators["rsi"] > 70:
                        signal = "sell"
                if not signal:
                    continue

                # Load account balance
                account_info = broker.mt5.account_info() if broker.mt5 else None
                balance = float(account_info.balance) if account_info else 0.0

                # Determine risk mode
                risk_value, risk_pct = risk.auto_risk_mode(balance)
                # Determine sl/tp from ATR
                sl_pips = max(5, int(round(indicators["atr"] * 1.5)))
                tp_pips = int(round(sl_pips * 1.5))

                # Calculate lot
                lots = risk.calculate_lot(balance=balance, stop_loss_pips=sl_pips, symbol=pair,
                                          account_currency=os.getenv("ACCOUNT_CURRENCY","USD"),
                                          risk_value=risk_value, risk_percent=risk_pct)

                # place order
                res = broker.place_order_mt5(pair, signal, lots, sl_pips, tp_pips)
                if res.get("ok"):
                    # For demo: pnl unknown yet; record trade with 0 pnl placeholder
                    timestamp = datetime.datetime.utcnow()
                    # increment daily stats
                    trade_count, daily_pnl = logger.increment_trade_count_and_record(pnl=0.0, balance=balance)
                    logger.append_trade(timestamp, pair, signal, lots, sl_pips, tp_pips, 0.0, balance, trade_count)
                    LOG.info("Trade recorded %s %s lots on %s", signal, lots, pair)
                else:
                    LOG.warning("Order not placed: %s", res)
                # optional: tiny sleep between pairs
                time.sleep(0.5)

            # wait before next scan cycle
            time.sleep(10)
    finally:
        broker.disconnect_mt5()

if __name__ == "__main__":
    main_loop()

