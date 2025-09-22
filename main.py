from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
import uvicorn
import datetime

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

app = FastAPI()

# Allow React frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/home")
def read_root():
    print('-----------------\n-------------------')
    return {"message": "Hello, World!"}

@app.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    # Replace with your user validation logic
    if username == "admin" and password == "password":
        payload = {
            "sub": username,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": token}
    raise HTTPException(status_code=401, detail="Invalid credentials")

if __name__ == "__main__":    
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info")