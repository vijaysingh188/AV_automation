from pymongo import MongoClient
from pydantic import BaseModel, Field, ValidationError
from typing import List
import options  # Assuming options.py is in the same directory
from main import Building, Room, Device

# load .env from project root if available
import os
from pathlib import Path
from urllib.parse import quote_plus

env_path = Path(__file__).resolve().parents[1] / ".env"
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=env_path)
except Exception:
    pass

# Priority:
# 1) use full MONGO_URI if provided via environment
# 2) otherwise build URI from individual parts
full_uri = os.getenv("MONGO_URI")
if full_uri and full_uri.strip():
    MONGO_URI = full_uri.strip()
else:
    user = os.getenv("MONGO_USER", "").strip()
    pwd = os.getenv("MONGO_PASS", "").strip()
    host = os.getenv("MONGO_HOST", "cluster0.s40plbc.mongodb.net").strip()
    db_name = os.getenv("MONGO_DB", "AvDB").strip()
    options_str = os.getenv("MONGO_OPTIONS", "?retryWrites=true&w=majority&appName=Cluster0").strip()

    if user:
        pwd_enc = quote_plus(pwd)
        MONGO_URI = f"mongodb+srv://{user}:{pwd_enc}@{host}/{db_name}{options_str}"
    else:
        MONGO_URI = f"mongodb+srv://{host}/{db_name}{options_str}"

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)

db = client["AvDB"]
building_collection = db["Building"]

# Example building data
data = {
    "building_name": "Main Building",
    "rooms": [
        {
            "room_number": "101",
            "devices": [
                {
                    "ip_address": "192.168.1.10",
                    "device_category": "Sensor",
                    "device_brand": "Sony",
                    "device_driver" : "backend/files/Sony_Sensor.js",
                    "functionalities": []
                },
                {
                    "ip_address": "192.168.1.11",
                    "device_category": "Camera",
                    "device_brand": "Samsung",
                    "device_driver" : "backend/files/Samsung_Camera.js",
                    "functionalities": []
                }
            ]
        },
        {
            "room_number": "102",
            "devices": [
                {
                    "ip_address": "192.168.1.12",
                    "device_category": "Light",
                    "device_brand": "LG",
                    "device_driver" : "backend/files/LG_Light.js",
                    "functionalities": []
                }
            ]
        }
    ]
}

# Validate data with Pydantic models
try:
    building = Building(**data)

    # Optional: validate device options against options.py
    for room in building.rooms:
        for device in room.devices:
            if device.device_brand not in options.device_brand:
                raise ValueError(f"Invalid device brand: {device.device_brand}")
            if device.device_category not in options.device_category:
                raise ValueError(f"Invalid device category: {device.device_category}")
            if device.device_driver not in options.device_driver.values():
                raise ValueError(f"Invalid device driver: {device.device_driver}")

    # Insert or update only if building doesn't exist
    building_collection.update_one(
        {"building_name": building.building_name},
        {"$setOnInsert": building.dict()},
        upsert=True
    )

    print("Building inserted/verified successfully.")
    print(building_collection.find_one({"building_name": building.building_name}))

except ValidationError as e:
    print("Validation Error:", e)
except ValueError as e:
    print("Option Error:", e)
