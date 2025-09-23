from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["AvDB"]
building_collection = db["Building"]

# Example structure


data = {
    "building_name": "Main Building",
    "rooms": [
        {
            "room_name": "Room 101",
            "devices": [
                {
                    "ip_address": "192.168.1.10",
                    "device_category": "Sensor",
                    "device_name": "TempSensor",
                    "device_driver": "v1.0",
                    
                },
                {
                    "ip_address": "192.168.1.11",
                    "device_category": "Camera",
                    "device_name": "SecurityCam",
                    "device_driver": "v2.1"
                }
            ]
        },
        {
            "room_name": "Room 102",
            "devices": [
                {
                    "ip_address": "192.168.1.12",
                    "device_category": "Sensor",
                    "device_name": "HumiditySensor",
                    "device_driver": "v1.0"
                }
            ]
        }
    ]
}

# Insert only if building doesn't exist
building_collection.update_one(
    {"building_name": data["building_name"]},
    {"$setOnInsert": data},
    upsert=True
)

print(building_collection.find_one())
