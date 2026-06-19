from bson import ObjectId
from app.db.database import users_collection, tickets_collection
from app.models.ticket import TicketStatus


async def find_best_staff_for_team(team_id: str) -> dict | None:
    """
    Picks the staff member belonging to `team_id` with the fewest
    currently-open (open + in_progress) tickets assigned to them.
    Returns the staff user document, or None if the team has no staff.
    """
    staff_cursor = users_collection.find({"role": "staff", "team_id": ObjectId(team_id)})
    staff_list = await staff_cursor.to_list(length=None)

    if not staff_list:
        return None

    best_staff = None
    lowest_load = None

    for staff in staff_list:
        open_count = await tickets_collection.count_documents(
            {
                "assigned_to": staff["_id"],
                "status": {"$in": [TicketStatus.OPEN.value, TicketStatus.IN_PROGRESS.value]},
            }
        )
        if lowest_load is None or open_count < lowest_load:
            lowest_load = open_count
            best_staff = staff

    return best_staff