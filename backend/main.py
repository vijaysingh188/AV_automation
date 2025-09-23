from fastapi import FastAPI, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
import uvicorn
import datetime
from database import collection  # Import MongoDB collection
from typing import Optional, List
from pydantic import BaseModel
from demo_database import building_collection
from bson import ObjectId   # ✅ required for _id lookups
from options import device_brand, device_category, device_driver

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

app = FastAPI()

# Allow React frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- Models -------------------
class Device(BaseModel):
    ip_address: str
    device_category: str
    device_brand: str
    device_driver: str
    functionalities: List[str] = []  

class Room(BaseModel):
    room_name: str
    devices: List[Device]

class Building(BaseModel):
    building_name: str
    rooms: List[Room]

class DeviceUpdate(BaseModel):
    building_id: str
    room_name: str
    device_brand: str
    ip_address: Optional[str] = None
    device_category: Optional[str] = None
    device_driver: Optional[str] = None

class DeviceDelete(BaseModel):
    building_id: str
    room_name: str
    device_brand: str

# ------------------- APIs -------------------

@app.get("/home")
def homePage():
    return {"message": "Hello, World!"}

@app.get("/homeadmin")
def adminHomepage():
    buildings = list(building_collection.find({}, {"_id": 1, "building_name": 1, "rooms": 1}))
    filtered = []
    for b in buildings:
        if not b.get("building_name"):
            continue
        rooms = []
        for r in b.get("rooms", []):
            if not r.get("room_name"):
                continue
            r["devices"] = [d for d in r.get("devices", []) if d.get("device_brand")]
            rooms.append(r)
        b["_id"] = str(b["_id"])  # stringify ObjectId for frontend
        b["rooms"] = rooms
        filtered.append(b)
    return {"message": "Admin logged!", "buildings": filtered}

@app.post("/add-building")
def add_building(building: Building):
    existing = building_collection.find_one({"building_name": building.building_name})
    if existing:
        raise HTTPException(status_code=400, detail="Building already exists")
    building_collection.insert_one(building.dict())
    return {"message": "Building added successfully"}

@app.put("/device/edit")
def edit_device(update: DeviceUpdate):
    result = building_collection.update_one(
        {
            "_id": ObjectId(update.building_id),
            "rooms.room_name": update.room_name,
            "rooms.devices.device_brand": update.device_brand
        },
        {
            "$set": {
                "rooms.$[room].devices.$[device].ip_address": update.ip_address,
                "rooms.$[room].devices.$[device].device_category": update.device_category,
                "rooms.$[room].devices.$[device].device_driver": update.device_driver
            }
        },
        array_filters=[
            {"room.room_name": update.room_name},
            {"device.device_brand": update.device_brand}
        ]
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found or nothing updated")
    return {"message": "Device updated successfully"}

@app.delete("/device/delete")
def delete_device(data: DeviceDelete):
    result = building_collection.update_one(
        {"_id": ObjectId(data.building_id), "rooms.room_name": data.room_name},
        {"$pull": {"rooms.$.devices": {"device_brand": data.device_brand}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device deleted successfully"}


@app.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    # Look up user in MongoDB
    user = collection.find_one({"username": username, "password": password})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_type = user.get("user_type", "user")  # default to 'user'

    payload = {
        "sub": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        "user_type": user_type
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "user_type": user_type}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info")
