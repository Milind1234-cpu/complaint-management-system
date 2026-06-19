from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from app.db.database import teams_collection
from app.models.team import TeamCreate, TeamOut
from app.models.common import utc_now
from app.models.user import UserRole
from app.auth.dependencies import require_roles

router = APIRouter(prefix="/api/teams", tags=["Teams"])


@router.post("/", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
async def create_team(payload: TeamCreate, _admin=Depends(require_roles(UserRole.ADMIN))):
    existing = await teams_collection.find_one({"name": payload.name})
    if existing:
        raise HTTPException(status_code=400, detail="A team with this name already exists")

    team_doc = {
        "name": payload.name,
        "description": payload.description,
        "created_at": utc_now(),
    }
    result = await teams_collection.insert_one(team_doc)
    team_doc["_id"] = result.inserted_id
    return TeamOut(**team_doc)


@router.get("/", response_model=list[TeamOut])
async def list_teams():
    teams = await teams_collection.find().to_list(length=None)
    return [TeamOut(**team) for team in teams]


@router.get("/{team_id}", response_model=TeamOut)
async def get_team(team_id: str):
    team = await teams_collection.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return TeamOut(**team)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(team_id: str, _admin=Depends(require_roles(UserRole.ADMIN))):
    result = await teams_collection.delete_one({"_id": ObjectId(team_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")