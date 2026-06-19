from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from app.auth.security import decode_access_token
from app.db.database import users_collection
from app.models.user import UserOut, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserOut:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception

    return UserOut(**user)


def require_roles(*allowed_roles: UserRole):
    """Dependency factory: restricts a route to specific roles."""

    async def role_checker(current_user: UserOut = Depends(get_current_user)) -> UserOut:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker