from main import Building
from database import MONGO_URI, building_collection  # reuse database.py's client/collections
from pydantic import ValidationError
import options
import os

# example demo data
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
                    "device_driver": "backend/files/Sony_Sensor.py",
                    "functionalities": []
                },
                {
                    "ip_address": "192.168.1.11",
                    "device_category": "Camera",
                    "device_brand": "Samsung",
                    "device_driver": "backend/files/Samsung_Camera.py",
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
                    "device_driver": "backend/files/LG_Light.py",
                    "functionalities": []
                }
            ]
        }
    ]
}

def seed_demo():
    try:
        building = Building(**data)

        # Optional validation against options.py
        for room in building.rooms:
            for device in room.devices:
                if device.device_brand not in options.device_brand:
                    raise ValueError(f"Invalid device brand: {device.device_brand}")
                if device.device_category not in options.device_category:
                    raise ValueError(f"Invalid device category: {device.device_category}")

        building_collection.update_one(
            {"building_name": building.building_name},
            {
                "$setOnInsert": {"building_name": building.building_name},
                "$set": {"rooms": building.dict().get("rooms", [])},
            },
            upsert=True,
        )
        print("Building inserted/verified successfully.")
        print(building_collection.find_one({"building_name": building.building_name}))
    except ValidationError as e:
        print("Validation Error:", e)
    except Exception as e:
        print("Database error:", e)

if __name__ == "__main__":
    print("Using MONGO_URI from database.py:", MONGO_URI)
    seed_demo()
