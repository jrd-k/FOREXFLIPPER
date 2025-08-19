# server/services/brokerConnector.py
import os
import time
import logging
from dotenv import load_dotenv

# MetaTrader5 import is lazy so the module can be imported even if MT5 isn't installed during static analysis
try:
    import MetaTrader5 as mt5
except Exception as e:
    mt5 = None

load_dotenv()

LOG = logging.getLogger("brokerConnector")
LOG.setLevel(logging.INFO)

MT5_LOGIN = int(os.getenv("MT5_LOGIN", "0"))
MT5_PASSWORD = os.getenv("MT5_PASSWORD", "")
MT5_SERVER = os.getenv("MT5_SERVER", "")

def connect_mt5(retries=3, wait=2):
    """Initialize MT5 connection (returns True on success)."""
    if mt5 is None:
        raise RuntimeError("MetaTrader5 package not installed. pip install MetaTrader5")
    for i in range(retries):
        ok = mt5.initialize(login=MT5_LOGIN, password=MT5_PASSWORD, server=MT5_SERVER)
        if ok:
            LOG.info("MT5 initialized")
            return True
        LOG.warning("MT5 initialize attempt %s failed: %s", i+1, mt5.last_error())
        time.sleep(wait)
    raise RuntimeError("MT5 initialize failed after retries: " + str(mt5.last_error()))

def disconnect_mt5():
    if mt5:
        mt5.shutdown()
        LOG.info("MT5 shutdown")

def ensure_symbol(symbol):
    """Make sure symbol is known and visible to MT5."""
    info = mt5.symbol_info(symbol)
    if info is None:
        return False
    if not info.visible:
        mt5.symbol_select(symbol, True)
    return True

def get_tick(symbol):
    return mt5.symbol_info_tick(symbol)

def spread_in_pips(symbol):
    """Return current spread in pips (float)."""
    tick = get_tick(symbol)
    if not tick:
        return float("inf")
    info = mt5.symbol_info(symbol)
    if not info:
        return float("inf")
    point = info.point
    spread_pips = (tick.ask - tick.bid) / point
    return spread_pips

def place_order_mt5(symbol, direction, volume, sl_pips, tp_pips, deviation=10, magic=123456):
    """
    Place a market order safely. Returns a dict describing result.
    direction: "buy" or "sell"
    volume: lots (float)
    sl_pips/tp_pips: pip distances
    """
    if not ensure_symbol(symbol):
        return {"ok": False, "error": "symbol not available"}

    tick = get_tick(symbol)
    if tick is None:
        return {"ok": False, "error": "no tick"}

    info = mt5.symbol_info(symbol)
    if info is None:
        return {"ok": False, "error": "symbol_info missing"}
    point = info.point
    digits = info.digits

    price = tick.ask if direction == "buy" else tick.bid
    sl = price - sl_pips * point if direction == "buy" else price + sl_pips * point
    tp = price + tp_pips * point if direction == "buy" else price - tp_pips * point

    # Build request
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": max(0.01, float("{:.2f}".format(volume))),  # keep safe rounding
        "type": mt5.ORDER_TYPE_BUY if direction == "buy" else mt5.ORDER_TYPE_SELL,
        "price": price,
        "sl": float("{:.{}f}".format(sl, digits)),
        "tp": float("{:.{}f}".format(tp, digits)),
        "deviation": deviation,
        "magic": magic,
        "comment": "AutoBot",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    # Send and handle response
    result = mt5.order_send(request)
    if result is None:
        return {"ok": False, "error": "order_send returned None", "last_error": mt5.last_error()}
    result_dict = result._asdict()
    if result_dict.get("retcode") != mt5.TRADE_RETCODE_DONE:
        LOG.error("Order failed: %s", result_dict)
        return {"ok": False, "error": "order failed", "result": result_dict, "last_error": mt5.last_error()}
    LOG.info("Order placed: %s", result_dict)
    return {"ok": True, "result": result_dict}

