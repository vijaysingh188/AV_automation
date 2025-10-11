import os
from pathlib import Path
from urllib.parse import quote_plus
from pymongo import MongoClient
import re

# load .env from project root if available
env_path = Path(__file__).resolve().parents[1] / ".env"
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=env_path)
except Exception:
    pass

# Priority:
# 1) If a full MONGO_URI is provided use it.
# 2) Otherwise build URI from individual parts: MONGO_USER, MONGO_PASS, MONGO_HOST, MONGO_DB, MONGO_OPTIONS
full_uri = os.getenv("MONGO_URI")
# treat obvious placeholders as empty
if full_uri:
    full_uri = full_uri.strip()
    if any(p in full_uri.lower() for p in ("user:pass@", "@host", "username", "<password>", "replace")):
        full_uri = None

if full_uri and full_uri.strip():
    MONGO_URI = full_uri.strip()
else:
    user = os.getenv("MONGO_USER", "").strip()
    pwd = os.getenv("MONGO_PASS", "").strip()
    host = os.getenv("MONGO_HOST", "cluster0.s40plbc.mongodb.net").strip()
    db_name = os.getenv("MONGO_DB", "AvDB").strip()
    options = os.getenv("MONGO_OPTIONS", "?retryWrites=true&w=majority&appName=Cluster0").strip()

    # Basic validation: host must look like a hostname (contain a dot) for +srv
    looks_like_hostname = bool(re.search(r"\.", host)) and not bool(re.search(r"[:/,]", host))

    # URL-encode password if provided
    pwd_enc = quote_plus(pwd)

    if user:
        if looks_like_hostname:
            MONGO_URI = f"mongodb+srv://{user}:{pwd_enc}@{host}/{db_name}{options}"
        else:
            # host likely contains ports, comma-separated hosts or IPs -> use standard mongodb://
            MONGO_URI = f"mongodb://{user}:{pwd_enc}@{host}/{db_name}{options}"
    else:
        if looks_like_hostname:
            MONGO_URI = f"mongodb+srv://{host}/{db_name}{options}"
        else:
            MONGO_URI = f"mongodb://{host}/{db_name}{options}"

# Print the resolved URI host info for debugging (only when run interactively)
if __name__ == "__main__":
    try:
        print("Using MONGO_URI:", MONGO_URI)
    except Exception:
        pass

# create client (small timeout to fail fast when used in scripts)
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
db = client[os.getenv("MONGO_DB", "AvDB")]
building_collection = db["Building"]
collection = db["admin"]

# Ensure unique usernames
collection.create_index("username", unique=True)

data = [
    {"username": "admin", "password": "password", "user_type": "admin"},
    {"username": "user", "password": "password", "user_type": "user"},
]

for user in data:
    if not collection.find_one({"username": user["username"]}):
        collection.insert_one(user)

try:
    print(db.list_collection_names(), "----- collections in AvDB")
except Exception as e:
    print("Error connecting to MongoDB:", e)









