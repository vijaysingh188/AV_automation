from fastapi import FastAPI, Form, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
import uvicorn
import datetime
import subprocess
import json
import yaml
import os
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from database import building_collection, collection  # Import collections
from options import device_brand, device_category, device_driver

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

app = FastAPI()

# Allow React frontend
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
    device_brand: str = Field(..., description="Choose from options.py device_brand")
    device_category: str = Field(..., description="Choose from options.py device_category")
    device_driver: str = Field(..., description="Path to JS driver file, e.g. backend/files/SamsungMDC.js")
    functionalities: List[str] = []

class Room(BaseModel):
    room_number: str
    devices: List[Device]

class Building(BaseModel):
    building_name: str
    rooms: List[Room]

class DeviceUpdate(BaseModel):
    building_id: str
    room_number: str
    device_brand: str
    ip_address: Optional[str] = None
    device_category: Optional[str] = None
    device_driver: Optional[str] = None

class DeviceDelete(BaseModel):
    building_id: str
    room_number: str
    device_brand: str


# Add this class under your Models section
class DeviceAdd(BaseModel):
    building_id: str
    room_number: str
    ip_address: str
    device_brand: str
    device_category: str
    device_driver: str
    functionalities: List[str] = []

class DeviceDriverRequest(BaseModel):
    device_driver: str  # Path to the JS file, e.g., backend/files/Sony_Sensor.js

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
            if not r.get("room_number"):
                continue
            # Filter devices
            r["devices"] = [
                d for d in r.get("devices", [])
                if d.get("device_brand") in device_brand.keys()
                and d.get("device_category") in device_category.keys()
                and d.get("device_driver") in device_driver.values()  # <- fix
            ]
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
    # Build the update fields dynamically (only update provided fields)
    update_fields = {}
    if update.ip_address is not None:
        update_fields["rooms.$[room].devices.$[device].ip_address"] = update.ip_address
    if update.device_category is not None:
        update_fields["rooms.$[room].devices.$[device].device_category"] = update.device_category
    if update.device_driver is not None:
        update_fields["rooms.$[room].devices.$[device].device_driver"] = update.device_driver

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = building_collection.update_one(
        {
            "_id": ObjectId(update.building_id),
            "rooms.room_number": update.room_number,
            "rooms.devices.device_brand": update.device_brand
        },
        {
            "$set": update_fields
        },
        array_filters=[
            {"room.room_number": update.room_number},
            {"device.device_brand": update.device_brand}
        ]
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found or nothing updated")
    return {"message": "Device updated successfully"}

@app.delete("/device/delete")
def delete_device(
    building_id: str = Query(...),
    room_name: str = Query(...),
    device_brand: str = Query(...)
):
    result = building_collection.update_one(
        {"_id": ObjectId(building_id), "rooms.room_number": room_name},
        {"$pull": {"rooms.$.devices": {"device_brand": device_brand}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device deleted successfully"}


@app.post("/device/add")
def add_device(data: DeviceAdd):
    # Validate options
    if data.device_brand not in device_brand:
        raise HTTPException(status_code=400, detail="Invalid device brand")
    if data.device_category not in device_category:
        raise HTTPException(status_code=400, detail="Invalid device category")

    # Compose the key for device_driver mapping
    driver_key = f"{data.device_brand}_{data.device_category}"
    if driver_key not in device_driver:
        raise HTTPException(status_code=400, detail="No driver found for this brand/category")

    # Set the correct device_driver
    data.device_driver = device_driver[driver_key]

    # Update the building collection
    result = building_collection.update_one(
        {"_id": ObjectId(data.building_id), "rooms.room_number": data.room_number},
        {"$push": {"rooms.$.devices": data.dict()}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Room or building not found")

    return {"message": "Device added successfully"}

@app.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    user = collection.find_one({"username": username, "password": password})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_type = user.get("user_type", "user")
    payload = {
        "sub": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        "user_type": user_type
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "user_type": user_type}



@app.post("/device/functions")
def get_device_functions(data: DeviceDriverRequest):
    # Replace .js with .yml to get the YAML file path
    # yaml_path = os.path.splitext(data.device_driver)[0] + ".yml"
    
    yaml_path = os.path.join(os.path.dirname(__file__), "files", os.path.basename(os.path.splitext(data.device_driver)[0]) + ".yml")
    print(yaml_path,'======================yaml_path')
    if not os.path.isfile(yaml_path):
        return {"functions": [], "error": f"YAML file not found: {yaml_path}"}
    try:
        with open(yaml_path, "r") as f:
            print(f,'====f')
            yml = yaml.safe_load(f)
            print(yml,'-------------------yml')
        functions = yml.get("functions", [])
        return {"functions": functions}
    except Exception as e:
        print(e,'==================e')
        return {"functions": [], "error": str(e)}
    

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info")
