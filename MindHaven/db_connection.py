import pymongo
import ssl
import certifi

# Use the same MongoDB URL as in settings.py with additional SSL parameters
url = "mongodb+srv://mbakry484:MindHaven123@cluster0.avclj.mongodb.net/mindhaven?retryWrites=true&w=majority&appName=Cluster0&ssl=true&ssl_cert_reqs=CERT_NONE"

# Add SSL configuration to fix handshake issues
try:
    client = pymongo.MongoClient(
        url,
        tls=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        retryWrites=True
    )
    # Test the connection
    client.admin.command('ping')
    print("MongoDB connection successful!")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    # Fallback connection without SSL verification
    client = pymongo.MongoClient(
        "mongodb+srv://mbakry484:MindHaven123@cluster0.avclj.mongodb.net/mindhaven?retryWrites=true&w=majority&appName=Cluster0",
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        serverSelectionTimeoutMS=30000
    )

db = client["mindhaven"]
