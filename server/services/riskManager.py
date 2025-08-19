# server/services/riskManager.py
import os
import logging
from dotenv import load_dotenv

try:
    import MetaTrader5 as mt5
except Exception:
    mt5 = None

load_dotenv()
LOG = logging.getLogger("riskManager")

# Configurable via .env
SMALL_ACCOUNT_THRESHOLD = float(os.getenv("SMALL_ACCOUNT_THRESHOLD", "50.0"))  # USD
SMALL_ACCOUNT_RISK_PCT = float(os.getenv("SMALL_ACCOUNT_RISK_PCT", "0.03"))     # 3%
SMALL_ACCOUNT_MIN_RISK = float(os.getenv("SMALL_ACCOUNT_MIN_RISK", "0.20"))     # $0.20
DEFAULT_RISK_PCT = float(os.getenv("DEFAULT_RISK_PCT", "0.02"))                 # 2%
MIN_LOT = float(os.getenv("MIN_LOT", "0.01"))

def _get_quote_currency(symbol):
    # expects symbol like EURUSD, USDJPY, GBPUSD
    return symbol[3:]

def _get_base_currency(symbol):
    return symbol[:3]

def get_conversion_rate_to_account(quote_currency, account_currency="USD"):
    """
    Returns conversion factor (quote_currency -> account_currency).
    If quote_currency == account_currency => return 1.0
    Else tries to find symbol quote_account or account_quote on MT5 and build conversion.
    """
    if quote_currency == account_currency:
        return 1.0
    # Try QUOTE+ACC pair
    pair1 = quote_currency + account_currency
    pair2 = account_currency + quote_currency
    for pair, invert in ((pair1, False), (pair2, True)):
        try:
            info = mt5.symbol_info(pair)
            if info is None:
                continue
            tick = mt5.symbol_info_tick(pair)
            price = (tick.ask + tick.bid) / 2.0
            return 1.0 / price if invert else price
        except Exception:
            continue
    LOG.warning("Couldn't find conversion pair for %s -> %s. Defaulting to 1.0", quote_currency, account_currency)
    return 1.0

def pip_value_per_lot(symbol, account_currency="USD"):
    """
    Approximate pip value for 1 standard lot (100,000 units) denominated in account currency.
    Uses MT5 symbol info and current ticks to estimate conversion.
    """
    if mt5 is None:
        # fall back to typical values
        if symbol.endswith("JPY"):
            return 9.0  # rough estimate in USD
        return 10.0

    info = mt5.symbol_info(symbol)
    if info is None:
        return 10.0
    point = info.point
    digits = info.digits
    # define a pip size: for many pairs pip = 10 * point (accounts with 5-digit brokers)
    pip_size = point * 10
    lot_units = 100000.0
    # pip value in quote currency:
    pip_value_in_quote = lot_units * pip_size
    quote_currency = _get_quote_currency(symbol)
    # convert quote currency to account currency (USD default)
    conv = get_conversion_rate_to_account(quote_currency, account_currency)
    # pip value in account currency:
    pip_value_account = pip_value_in_quote * conv
    return pip_value_account

def calculate_lot(balance, stop_loss_pips, symbol, account_currency="USD", risk_value=None, risk_percent=None, min_lot=MIN_LOT):
    """
    Calculates lot size to risk either a fixed $ amount (risk_value) or a percent of balance (risk_percent).
    If both specified, risk_value takes precedence.
    """
    if risk_value is None and risk_percent is None:
        raise ValueError("Provide risk_value or risk_percent")

    pip_value = pip_value_per_lot(symbol, account_currency=account_currency)
    if pip_value <= 0:
        raise ValueError("Invalid pip value calculation")

    risk_amount = risk_value if risk_value is not None else balance * (risk_percent if risk_percent is not None else DEFAULT_RISK_PCT)
    lots = risk_amount / (stop_loss_pips * pip_value)
    # make sure we honor broker minimum
    lots = max(min_lot, float("{:.2f}".format(lots)))
    return lots

def auto_risk_mode(balance):
    """
    Returns (risk_value, risk_percent) pair based on balance.
    For very small accounts we prefer a fixed-dollar risk amount for practicality.
    """
    if balance < SMALL_ACCOUNT_THRESHOLD:
        # fixed-dollar risk for tiny accounts (cent accounts)
        risk_value = max(SMALL_ACCOUNT_MIN_RISK, balance * SMALL_ACCOUNT_RISK_PCT)
        return risk_value, None
    else:
        return None, DEFAULT_RISK_PCT
