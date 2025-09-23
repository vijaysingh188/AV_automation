from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["AvDB"]
collection = db["admin"]

data = [
    { "username": "admin", "password": "password", "user_type": "admin" },
    { "username": "user", "password": "password", "user_type": "user" }
]

for user in data:
    collection.update_one(
        {"username": user["username"]},  # filter
        {"$setOnInsert": user},          # only insert if not exists
        upsert=True
    )

print(db.list_collection_names(), "----- collections in AvDB")
