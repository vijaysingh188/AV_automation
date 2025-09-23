from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
import uvicorn
import datetime
from database import collection  # Import MongoDB collection

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

@app.get("/home")
def homePage():
    return {"message": "Hello, World!"}

@app.get("/homeadmin")
def adminHomepage():
    return {"message": "Admin logged!"}

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
