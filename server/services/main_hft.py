# main_hft.py
import time, os, logging, datetime
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger("main")

from server.services import brokerConnector as broker
from server.services import riskManager as risk
from server.services import tradeLogger as logger
from server.services import news_filter as news

# Config via env (tweak as needed)
SCAN_INTERVAL = float(os.getenv("SCAN_INTERVAL", "10.0"))             # seconds between scan cycles
MAX_ALLOWED_SPREAD_PIPS = float(os.getenv("MAX_ALLOWED_SPREAD_PIPS", "2.0"))
MAX_DAILY_LOSS_PCT = float(os.getenv("MAX_DAILY_LOSS_PCT", "0.20"))   # 20% stop/day
MAX_OPEN_TRADES = int(os.getenv("MAX_OPEN_TRADES", "5"))              # protect tiny accounts
MAX_LAYERS = int(os.getenv("MAX_LAYERS", "3"))                       # max stacking per signal
GOLD_PAIR = os.getenv("GOLD_PAIR", "XAUUSD")

# Basic symbol list (replace or fetch dynamically)
ALL_PAIRS = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","NZDUSD","EURGBP","GBPJPY","AUDJPY"]

def should_trade_symbol(symbol, balance):
    # block gold while balance < 500
    if symbol == GOLD_PAIR and balance < 500.0:
        return False
    return True

def get_open_positions_count():
    # query MT5 positions
    positions = broker.mt5.positions_get() if broker.mt5 else []
    return len(positions) if positions else 0

def max_daily_loss_reached(balance):
    stats = logger.reset_daily_if_needed()
    daily_pnl = stats.get("daily_pnl", 0.0)
    return daily_pnl < - (MAX_DAILY_LOSS_PCT * balance)

def compute_simple_indicators(closes):
    # very simple: ema9/ema21 & rsi via pandas_ta
    import pandas as pd
    import pandas_ta as ta
    s = pd.Series(closes)
    ema9 = s.ewm(span=9, adjust=False).mean().iloc[-1]
    ema21 = s.ewm(span=21, adjust=False).mean().iloc[-1]
    rsi = ta.rsi(s, length=14).iloc[-1]
    atr = ta.atr(high=s, low=s, close=s, length=14).iloc[-1]  # approximation
    return {"ema9": ema9, "ema21": ema21, "rsi": float(rsi), "atr": float(atr)}

def scan_and_trade():
    # ensure mt5 connected
    broker.connect_mt5()
    try:
        while True:
            balance = broker.get_account_balance()
            LOG.info("Balance: %.2f", balance)

            if max_daily_loss_reached(balance):
                LOG.warning("Daily loss limit reached. Pausing trading until next day.")
                time.sleep(60*60)  # pause one hour (or change)
                continue

            for symbol in ALL_PAIRS:
                if not should_trade_symbol(symbol, balance):
                    LOG.debug("Skipping %s (locked due to balance)", symbol)
                    continue

                # spread guard
                spread = broker.spread_in_pips(symbol)
                if spread > MAX_ALLOWED_SPREAD_PIPS:
                    LOG.debug("Skipping %s due to spread %.2f", symbol, spread)
                    continue

                # news guard
                if news.is_near_high_impact_news():
                    LOG.debug("Skipping %s due to news window", symbol)
                    continue

                # get M1 closes
                rates = broker.mt5.copy_rates_from_pos(symbol, broker.mt5.TIMEFRAME_M1, 0, 60)
                if rates is None:
                    continue
                closes = [r.close for r in rates]
                indicators = compute_simple_indicators(closes)
                signal = None
                if indicators["ema9"] > indicators["ema21"]:
                    signal = "buy"
                elif indicators["ema9"] < indicators["ema21"]:
                    signal = "sell"
                else:
                    if indicators["rsi"] < 30:
                        signal = "buy"
                    elif indicators["rsi"] > 70:
                        signal = "sell"

                if not signal:
                    continue

                # calculate sl/tp using ATR
                sl_pips = max(5, int(round(indicators["atr"] * 1.5)))
                tp_pips = int(round(sl_pips * 1.5))

                # risk mode
                risk_value, risk_pct = risk.auto_risk_mode(balance)
                lots = risk.calculate_lot(balance, sl_pips, symbol, risk_value=risk_value, risk_percent=risk_pct)

                # additional safety: avoid too many open trades
                if get_open_positions_count() >= MAX_OPEN_TRADES:
                    LOG.info("Max open trades reached. Skipping new trades.")
                    continue

                # layering: open up to MAX_LAYERS with tiny delay between entries
                for layer in range(1, MAX_LAYERS + 1):
                    res = broker.place_order_mt5(symbol, signal, lots, sl_pips, tp_pips)
                    if res.get("ok"):
                        # record trade with placeholder pnl=0 (update later when closed)
                        ts = datetime.datetime.utcnow()
                        trade_count, daily_pnl = logger.update_after_trade(0.0, balance)
                        logger.append_trade(ts, symbol, signal, lots, sl_pips, tp_pips, 0.0, balance, trade_count)
                        LOG.info("Placed layer %d/%d on %s %s lots", layer, MAX_LAYERS, symbol, lots)
                        # small wait between layers to avoid instant duplicate rejection
                        time.sleep(0.3)
                    else:
                        LOG.warning("Failed to place layer %d on %s: %s", layer, symbol, res.get("error"))
                        break

                # small inter-symbol pause for HFT but avoid spamming
                time.sleep(0.5)

            # scan interval
            time.sleep(SCAN_INTERVAL)
    finally:
        broker.disconnect_mt5()

if __name__ == "__main__":
    scan_and_trade()
