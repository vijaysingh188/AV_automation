from pymongo import MongoClient

# MongoDB connection
# client = MongoClient("mongodb://localhost:27017/")
client = MongoClient("mongodb://mongodb:27017/")
db = client["AvDB"]
building_collection = db["Building"]  # collection for buildings
collection = db["admin"]


data = [
  { "username": "admin", "password": "password", "user_type": "admin" },
  { "username": "user", "password": "password", "user_type": "user" }
]

# Test connection
collection.insert_many(data)
try:
    print(db.list_collection_names(), "----- collections in AvDB")
except Exception as e:
    print("Error connecting to MongoDB:", e)









