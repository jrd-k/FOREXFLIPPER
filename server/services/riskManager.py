# server/services/riskManager.py
import os
import logging
from dotenv import load_dotenv

try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None

load_dotenv()
LOG = logging.getLogger("riskManager")

# === ENV CONFIG ===
SMALL_ACCOUNT_THRESHOLD = float(os.getenv("SMALL_ACCOUNT_THRESHOLD", "50.0"))   # USD
SMALL_ACCOUNT_MIN_RISK = float(os.getenv("SMALL_ACCOUNT_MIN_RISK", "0.20"))      # $ fixed risk min
SMALL_ACCOUNT_RISK_PCT = float(os.getenv("SMALL_ACCOUNT_RISK_PCT", "0.03"))      # 3%
DEFAULT_RISK_PCT = float(os.getenv("DEFAULT_RISK_PCT", "0.02"))                  # 2%
MIN_LOT = float(os.getenv("MIN_LOT", "0.01"))
MAX_LOT = float(os.getenv("MAX_LOT", "10.0"))                                    # hard safety cap
ACCOUNT_CURRENCY = os.getenv("ACCOUNT_CURRENCY", "USD")

# Approximate pip values (fallback if no MT5)
DEFAULT_PIP_VALUE = 10.0   # USD/pip per 1 lot
JPY_PIP_VALUE = 9.0        # USD/pip per 1 lot
GOLD_PIP_VALUE = 1.0       # ~1 USD per pip per lot (XAUUSD) → highly broker-dependent

# === HELPERS ===
def pip_value_per_lot(symbol: str, account_currency=ACCOUNT_CURRENCY):
    """
    Get pip value per 1.0 lot in account currency.
    Falls back to rough estimates if MT5 not available.
    """
    if mt5:
        try:
            info = mt5.symbol_info(symbol)
            if not info:
                LOG.warning("No MT5 symbol info for %s, using fallback pip value", symbol)
            else:
                point = info.point
                pip_size = point * 10  # assume broker with fractional pips
                lot_units = 100000.0 if symbol != "XAUUSD" else 100.0  # gold contracts are smaller
                pip_value_quote = lot_units * pip_size
                # crude: assume account = quote currency
                return pip_value_quote
        except Exception as e:
            LOG.error("MT5 pip value error: %s", e)

    # === FALLBACKS ===
    if symbol.endswith("JPY"):
        return JPY_PIP_VALUE
    if symbol.startswith("XAU"):  # gold
        return GOLD_PIP_VALUE
    return DEFAULT_PIP_VALUE

def auto_risk_mode(balance: float):
    """
    For small accounts (< threshold) → return fixed USD risk.
    Otherwise → return % risk.
    """
    if balance < SMALL_ACCOUNT_THRESHOLD:
        fixed = max(SMALL_ACCOUNT_MIN_RISK, balance * SMALL_ACCOUNT_RISK_PCT)
        return fixed, None
    return None, DEFAULT_RISK_PCT

def calculate_lot(balance: float, stop_loss_pips: float, symbol: str, 
                  risk_value=None, risk_percent=None, 
                  min_lot=MIN_LOT, max_lot=MAX_LOT):
    """
    Calculates lot size based on risk.
    - risk_value takes priority over risk_percent.
    - clamps between min_lot and max_lot.
    """
    pip_value = pip_value_per_lot(symbol)
    if pip_value <= 0:
        raise ValueError(f"Invalid pip value for {symbol}")

    # Default: use auto risk mode if none provided
    if risk_value is None and risk_percent is None:
        risk_value, risk_percent = auto_risk_mode(balance)

    risk_amount = risk_value if risk_value is not None else balance * risk_percent
    lots = risk_amount / (stop_loss_pips * pip_value)

    # Enforce broker min + safety max
    lots = max(min_lot, min(round(lots, 2), max_lot))

    LOG.info("[RiskManager] balance=%.2f sl_pips=%s symbol=%s risk_amount=%.2f lots=%.2f",
             balance, stop_loss_pips, symbol, risk_amount, lots)

    return lots
