
from pymongo.mongo_client import MongoClient

# uri = "mongodb+srv://avautomation01_db_user:OW72dD6yUynHHCzo@cluster0.s40plbc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
# password="OW72dD6yUynHHCzo"
uri="mongodb+srv://avautomation01_db_user:OW72dD6yUynHHCzo@cluster0.s40plbc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"





# Create a new client and connect to the server
client = MongoClient(uri)

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)