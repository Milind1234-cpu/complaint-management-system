from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.mongodb_uri)
db = client[settings.database_name]

# Collections
users_collection = db["users"]
products_collection = db["products"]
teams_collection = db["teams"]
tickets_collection = db["tickets"]


async def init_indexes():
    """Create indexes used by search/filter and dashboard queries."""
    await users_collection.create_index("email", unique=True)
    await products_collection.create_index("name")
    await tickets_collection.create_index("status")
    await tickets_collection.create_index("product_id")
    await tickets_collection.create_index("assigned_to")
    await tickets_collection.create_index("created_by")
    await tickets_collection.create_index("created_at")
    await tickets_collection.create_index(
        [("title", "text"), ("description", "text")]
    )