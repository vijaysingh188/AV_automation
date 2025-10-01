from pymongo import MongoClient

MONGO_URI = "mongodb+srv://avautomation01_db_user:OW72dD6yUynHHCzo@cluster0.s40plbc.mongodb.net/AvDB?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["AvDB"]
building_collection = db["Building"]
collection = db["admin"]

# Ensure unique usernames
collection.create_index("username", unique=True)

data = [
  { "username": "admin", "password": "password", "user_type": "admin" },
  { "username": "user", "password": "password", "user_type": "user" }
]

for user in data:
    if not collection.find_one({"username": user["username"]}):
        collection.insert_one(user)

try:
    print(db.list_collection_names(), "----- collections in AvDB")
except Exception as e:
    print("Error connecting to MongoDB:", e)









