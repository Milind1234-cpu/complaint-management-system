from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from app.db.database import products_collection, teams_collection
from app.models.product import ProductCreate, ProductUpdate, ProductOut
from app.models.common import utc_now
from app.models.user import UserRole
from app.auth.dependencies import require_roles

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, _admin=Depends(require_roles(UserRole.ADMIN))):
    team = await teams_collection.find_one({"_id": ObjectId(payload.team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="team_id does not match any existing team")

    existing = await products_collection.find_one({"name": payload.name})
    if existing:
        raise HTTPException(status_code=400, detail="A product with this name already exists")

    product_doc = {
        "name": payload.name,
        "description": payload.description,
        "team_id": ObjectId(payload.team_id),
        "is_active": True,
        "created_at": utc_now(),
    }
    result = await products_collection.insert_one(product_doc)
    product_doc["_id"] = result.inserted_id
    return ProductOut(**product_doc)


@router.get("/", response_model=list[ProductOut])
async def list_products(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    products = await products_collection.find(query).to_list(length=None)
    return [ProductOut(**p) for p in products]


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str):
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductOut(**product)


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str, payload: ProductUpdate, _admin=Depends(require_roles(UserRole.ADMIN))
):
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "team_id" in update_data:
        team = await teams_collection.find_one({"_id": ObjectId(update_data["team_id"])})
        if not team:
            raise HTTPException(status_code=404, detail="team_id does not match any existing team")
        update_data["team_id"] = ObjectId(update_data["team_id"])

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = await products_collection.find_one_and_update(
        {"_id": ObjectId(product_id)}, {"$set": update_data}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductOut(**result)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str, _admin=Depends(require_roles(UserRole.ADMIN))):
    result = await products_collection.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")