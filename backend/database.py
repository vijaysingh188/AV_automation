import os
import sys
import re
import logging
from pathlib import Path
from urllib.parse import quote_plus
from pymongo import MongoClient
from pymongo.errors import PyMongoError

# load .env from project root if available
env_path = Path(__file__).resolve().parents[1] / ".env"
try:
    from dotenv import load_dotenv

    load_dotenv(dotenv_path=env_path)
except Exception:
    pass

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def _is_placeholder_uri(uri: str) -> bool:
    lower = uri.lower()
    return any(p in lower for p in ("user:pass@", "@host", "<password>", "replace", "username"))


def build_mongo_uri() -> str:
    full_uri = os.getenv("MONGO_URI", "").strip()
    if full_uri and not _is_placeholder_uri(full_uri):
        return full_uri

    user = os.getenv("MONGO_USER", "").strip()
    pwd = os.getenv("MONGO_PASS", "").strip()
    host = os.getenv("MONGO_HOST", "cluster0.s40plbc.mongodb.net").strip()
    db_name = os.getenv("MONGO_DB", "AvDB").strip()
    options = os.getenv("MONGO_OPTIONS", "?retryWrites=true&w=majority&appName=Cluster0").strip()

    if not user or not pwd:
        # Fail fast with clear guidance — prevents silent use of unauthenticated client
        msg = (
            "MONGO credentials missing. Set either a valid MONGO_URI or MONGO_USER and MONGO_PASS in your .env.\n"
            "Example (do NOT commit credentials):\n"
            "MONGO_USER=avautomation01_db_user\n"
            "MONGO_PASS=OW72dD6yUynHHCzo\n"
            "MONGO_HOST=cluster0.s40plbc.mongodb.net\n"
            "MONGO_DB=AvDB\n"
        )
        logger.error(msg)
        raise SystemExit(1)

    # URL-encode password
    pwd_enc = quote_plus(pwd)

    # If host looks like a DNS hostname (contains a dot, no commas/ports) use +srv
    looks_like_hostname = bool(re.search(r"\.", host)) and not bool(re.search(r"[:/,]", host))
    if looks_like_hostname:
        return f"mongodb+srv://{user}:{pwd_enc}@{host}/{db_name}{options}"
    else:
        return f"mongodb://{user}:{pwd_enc}@{host}/{db_name}{options}"


# build URI and client
MONGO_URI = build_mongo_uri()
logger.info("Using MONGO_URI: %s", MONGO_URI if "@" in MONGO_URI else "<hidden>")

# create client (small timeout to fail fast when used in scripts)
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
db = client[os.getenv("MONGO_DB", "AvDB")]
building_collection = db["Building"]
collection = db["admin"]


def ensure_indexes_and_seed(seed_users: bool = True):
    """
    Create index and seed admin users.
    This is NOT called automatically on import to avoid permission errors at app startup.
    Run with: `RUN_DB_MAINTENANCE=1 python database.py` or call this function from a privileged script.
    """
    # Ensure unique usernames
    try:
        collection.create_index("username", unique=True)
        logger.info("Ensured index on admin.username")
    except PyMongoError as e:
        logger.warning(
            "Could not create index on admin.username (insufficient privileges or other error): %s", e
        )

    if seed_users:
        data = [
            {"username": "admin", "password": "password", "user_type": "admin"},
            {"username": "user", "password": "password", "user_type": "user"},
        ]
        for u in data:
            try:
                found = collection.find_one({"username": u["username"]})
                if not found:
                    collection.insert_one(u)
                    logger.info("Inserted user %s", u["username"])
            except PyMongoError as e:
                logger.warning(
                    "Cannot read/modify 'admin' collection (insufficient DB user privileges): %s", e
                )
                logger.info(
                    "Skipping user seeding. Grant 'readWrite' on AvDB or run the seed script with an admin user to populate users."
                )
                break


if __name__ == "__main__":
    # Allow running maintenance from the server with higher-privilege credentials
    run = os.getenv("RUN_DB_MAINTENANCE", "0") == "1"
    if not run:
        print(
            "Database module executed directly. To run index/seed operations set RUN_DB_MAINTENANCE=1 in env and re-run."
        )
        sys.exit(0)

    try:
        ensure_indexes_and_seed(seed_users=True)
        print("Maintenance complete.")
    except Exception as e:
        logger.exception("Maintenance failed: %s", e)
        sys.exit(1)









