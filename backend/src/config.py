import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{BASE_DIR}/trading_simulator.db"
)

# Financial Data Aggregator Database (for price lookups)
FINANCIAL_DATA_DB_URL = os.getenv(
    "FINANCIAL_DATA_DB_URL",
    "sqlite:////home/archy/Desktop/Server/FinancialData/financial_data_aggregator/financial_data.db"
)

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = LOG_DIR / "trading_simulator.log"

# API
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))

# Feature flags
ENABLE_CORS = os.getenv("ENABLE_CORS", "true").lower() == "true"
