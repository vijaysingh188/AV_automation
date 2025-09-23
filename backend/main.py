from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
import uvicorn
import datetime
from database import collection  # Import MongoDB collection


from pydantic import BaseModel, Field
from typing import List
from demo_database import building_collection

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
# Pydantic models
class Device(BaseModel):
    ip_address: str
    device_category: str
    device_name: str
    device_driver: str
    functionalities: List[str] = []  # added field for actions

class Room(BaseModel):
    room_name: str
    devices: List[Device]

class Building(BaseModel):
    building_name: str
    rooms: List[Room]


@app.get("/home")
def homePage():
    return {"message": "Hello, World!"}

@app.get("/homeadmin")
def adminHomepage():
    buildings = list(building_collection.find({}, {"_id": 0}))
    
    # Keep only buildings with a name
    filtered_buildings = []
    for b in buildings:
        if not b.get("building_name"):
            continue  # skip unnamed buildings
        rooms = []
        for r in b.get("rooms", []):
            if not r.get("room_name"):
                continue  # skip unnamed rooms
            # Keep only devices with a name
            devices = [d for d in r.get("devices", []) if d.get("device_name")]
            r["devices"] = devices
            rooms.append(r)
        b["rooms"] = rooms
        filtered_buildings.append(b)
    
    return {"message": "Admin logged!", "buildings": filtered_buildings}


@app.post("/add-building")
def add_building(building: Building):
    # Check if building already exists
    existing = building_collection.find_one({"building_name": building.building_name})
    if existing:
        raise HTTPException(status_code=400, detail="Building already exists")
    
    # Insert building
    building_collection.insert_one(building.dict())
    return {"message": "Building added successfully"}

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
