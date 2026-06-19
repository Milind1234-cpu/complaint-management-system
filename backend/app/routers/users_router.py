from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.db.database import users_collection
from app.models.user import UserOut, UserRole
from app.auth.dependencies import require_roles, get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: UserOut = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=list[UserOut])
async def list_users(
    role: UserRole | None = None,
    team_id: str | None = None,
    _admin=Depends(require_roles(UserRole.ADMIN)),
):
    query = {}
    if role:
        query["role"] = role.value
    if team_id:
        query["team_id"] = ObjectId(team_id)

    users = await users_collection.find(query).to_list(length=None)
    return [UserOut(**u) for u in users]


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str, _admin=Depends(require_roles(UserRole.ADMIN))):
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(**user)