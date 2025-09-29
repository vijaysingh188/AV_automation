from pymongo import MongoClient
from pydantic import BaseModel, Field, ValidationError
from typing import List
import options  # Assuming options.py is in the same directory
from main import Building, Room, Device

client = MongoClient("mongodb://localhost:27017/")
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
