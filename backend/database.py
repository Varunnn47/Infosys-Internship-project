from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
from typing import Optional, Dict, List
import pickle
import gridfs
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging

logger = logging.getLogger(__name__)

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL or MONGO_URL == "mongodb+srv://username:password@cluster.mongodb.net/database_name":
    print("Warning: MongoDB URL not configured. Using placeholder connection.")
    MONGO_URL = "mongodb://localhost:27017/research_ai"  # Fallback to local

# Connection with better configuration
try:
    client = MongoClient(
        MONGO_URL, 
        serverSelectionTimeoutMS=3000,  # Reduced timeout
        connectTimeoutMS=3000,
        maxPoolSize=10,  # Reduced pool size
        minPoolSize=1,
        maxIdleTimeMS=30000,
        tlsAllowInvalidCertificates=True
    )
except Exception as e:
    logger.error(f"Failed to create MongoDB client: {e}")
    # Create a dummy client that won't actually connect
    client = None

try:
    if client:
        client.admin.command('ping')
        logger.info("Connected to MongoDB successfully.")
    else:
        logger.warning("MongoDB client not initialized")
except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    print(f"Warning: MongoDB connection failed: {e}")
    print("App will start but database features may not work.")
except Exception as e:
    logger.error(f"Unexpected database error: {e}")
    print(f"Warning: Database error: {e}")

# Initialize collections only if client exists
if client:
    db = client["research_ai"]
    users_collection = db["users"]
    history_collection = db["history"]
    jobs_collection = db["jobs"]
    fs = gridfs.GridFS(db)
else:
    db = None
    users_collection = None
    history_collection = None
    jobs_collection = None
    fs = None

try:
    users_collection.create_index("email", unique=True)
    users_collection.create_index("username", unique=True)
    history_collection.create_index("username")
    history_collection.create_index([("username", 1), ("tags", 1)])
    history_collection.create_index([("username", 1), ("title", "text"), ("summary", "text")])
    jobs_collection.create_index("job_id", unique=True)
except Exception as e:
    print(f"Index creation warning: {e}")

# ── Users ──
def get_user_by_username(username: str) -> Optional[Dict]:
    try:
        if users_collection is None:
            return None
        return users_collection.find_one({"username": username})
    except Exception as e:
        logger.error(f"Error getting user by username: {e}")
        return None

def get_user_by_email(email: str) -> Optional[Dict]:
    try:
        if users_collection is None:
            return None
        return users_collection.find_one({"email": email})
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        return None

def create_user(username: str, email: str, hashed_password: str) -> Dict:
    try:
        if users_collection is None:
            raise Exception("Database not available")
        user = {"username": username, "email": email, "hashed_password": hashed_password}
        result = users_collection.insert_one(user)
        user["id"] = str(result.inserted_id)
        return user
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise Exception(f"Failed to create user: {e}")

# ── History ──
def save_analysis(username: str, title: str, summary: str, insights: list,
                  word_count: int, citations: list, processing_time: float,
                  tags: list = None, folder: str = "") -> str:
    doc = {
        "username": username,
        "title": title,
        "summary": summary,
        "insights": insights,
        "word_count": word_count,
        "citations": citations,
        "processing_time": processing_time,
        "rating": 0,
        "note": "",
        "tags": tags or [],
        "folder": folder,
        "open_count": 1,
        "reading_time": 0,
        "created_at": datetime.now(timezone.utc)
    }
    result = history_collection.insert_one(doc)
    return str(result.inserted_id)

def get_history(username: str, search: str = "", tag: str = "", folder: str = "") -> List[Dict]:
    query = {"username": username}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"summary": {"$regex": search, "$options": "i"}}
        ]
    if tag:
        query["tags"] = tag
    if folder:
        query["folder"] = folder
    docs = history_collection.find(query).sort("created_at", -1)
    results = []
    for doc in docs:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        results.append(doc)
    return results

def get_analysis_by_id(analysis_id: str) -> Optional[Dict]:
    from bson import ObjectId
    try:
        doc = history_collection.find_one({"_id": ObjectId(analysis_id)})
        if doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        return doc
    except Exception:
        return None

def update_rating(analysis_id: str, rating: int):
    from bson import ObjectId
    try:
        history_collection.update_one({"_id": ObjectId(analysis_id)}, {"$set": {"rating": rating}})
    except Exception:
        pass

def update_note(analysis_id: str, note: str):
    from bson import ObjectId
    try:
        history_collection.update_one({"_id": ObjectId(analysis_id)}, {"$set": {"note": note}})
    except Exception:
        pass

def update_tags(analysis_id: str, tags: list):
    from bson import ObjectId
    try:
        history_collection.update_one({"_id": ObjectId(analysis_id)}, {"$set": {"tags": tags}})
    except Exception:
        pass

def update_folder(analysis_id: str, folder: str):
    from bson import ObjectId
    try:
        history_collection.update_one({"_id": ObjectId(analysis_id)}, {"$set": {"folder": folder}})
    except Exception:
        pass

def delete_analysis(analysis_id: str):
    from bson import ObjectId
    try:
        history_collection.delete_one({"_id": ObjectId(analysis_id)})
        # also delete cached FAISS if exists
        for f in fs.find({"filename": f"faiss_{analysis_id}"}):
            fs.delete(f._id)
    except Exception:
        pass

def get_user_tags(username: str) -> List[str]:
    pipeline = [
        {"$match": {"username": username}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags"}},
        {"$sort": {"_id": 1}}
    ]
    return [doc["_id"] for doc in history_collection.aggregate(pipeline)]

def get_user_folders(username: str) -> List[str]:
    folders = history_collection.distinct("folder", {"username": username, "folder": {"$ne": ""}})
    return sorted(folders)

# ── FAISS Cache ──
def save_faiss_cache(analysis_id: str, chunks: list, embeddings) -> None:
    try:
        data = pickle.dumps({"chunks": chunks, "embeddings": embeddings})
        filename = f"faiss_{analysis_id}"
        # delete old if exists
        for f in fs.find({"filename": filename}):
            fs.delete(f._id)
        fs.put(data, filename=filename)
    except Exception as e:
        print(f"FAISS cache save error: {e}")

def load_faiss_cache(analysis_id: str) -> Optional[Dict]:
    try:
        filename = f"faiss_{analysis_id}"
        f = fs.find_one({"filename": filename})
        if f:
            return pickle.loads(f.read())
    except Exception as e:
        print(f"FAISS cache load error: {e}")
    return None

# ── Async Jobs ──
def create_job(job_id: str, username: str, filename: str) -> None:
    jobs_collection.insert_one({
        "job_id": job_id,
        "username": username,
        "filename": filename,
        "status": "processing",
        "result": None,
        "error": None,
        "created_at": datetime.now(timezone.utc)
    })

def update_job(job_id: str, status: str, result=None, error=None) -> None:
    jobs_collection.update_one(
        {"job_id": job_id},
        {"$set": {"status": status, "result": result, "error": error}}
    )

def update_reading_stats(analysis_id: str, reading_time: int, open_count: int):
    from bson import ObjectId
    try:
        history_collection.update_one(
            {"_id": ObjectId(analysis_id)}, 
            {"$set": {"reading_time": reading_time, "open_count": open_count}}
        )
    except Exception:
        pass

def increment_open_count(analysis_id: str):
    from bson import ObjectId
    try:
        history_collection.update_one(
            {"_id": ObjectId(analysis_id)}, 
            {"$inc": {"open_count": 1}}
        )
    except Exception:
        pass

def get_job(job_id: str) -> Optional[Dict]:
    doc = jobs_collection.find_one({"job_id": job_id})
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc
