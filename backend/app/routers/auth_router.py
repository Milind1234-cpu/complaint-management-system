from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.db.database import users_collection, teams_collection
from app.models.user import UserCreate, UserOut, TokenResponse, UserRole
from app.models.common import utc_now
from app.auth.security import hash_password, verify_password, create_access_token
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    existing = await users_collection.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    if payload.role == UserRole.STAFF:
        if not payload.team_id:
            raise HTTPException(status_code=422, detail="team_id is required when role is 'staff'")
        team = await teams_collection.find_one({"_id": ObjectId(payload.team_id)})
        if not team:
            raise HTTPException(status_code=404, detail="team_id does not match any existing team")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "role": payload.role.value,
        "team_id": ObjectId(payload.team_id) if payload.team_id else None,
        "created_at": utc_now(),
    }
    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id), "role": payload.role.value})
    return TokenResponse(access_token=token, user=UserOut(**user_doc))


@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # form_data.username holds the email (OAuth2 spec calls it "username")
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    return TokenResponse(access_token=token, user=UserOut(**user))