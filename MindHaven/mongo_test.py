import pymongo
import certifi

url = "mongodb+srv://mbakry484:MindHaven123@cluster0.avclj.mongodb.net/mindhaven?retryWrites=true&w=majority&appName=Cluster0"
try:
    client = pymongo.MongoClient(url, tls=True, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
    print(client.admin.command('ping'))
except Exception as e:
    print("Error:", e)