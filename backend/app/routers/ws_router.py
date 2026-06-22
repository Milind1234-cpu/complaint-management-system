"""
WebSocket connection manager and endpoint.

The ConnectionManager is a module-level singleton — import `manager` from
this module to send notifications from other routers.

Authentication: the token is passed as a query parameter because the browser
WebSocket API does not support custom headers.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.auth.security import decode_access_token

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages active WebSocket connections grouped by user_id."""

    def __init__(self):
        # user_id (str) → list of open WebSocket connections
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict) -> None:
        """Send a JSON message to all connections for a given user.
        Dead connections are removed silently — never raises.
        """
        if user_id not in self.active_connections:
            return
        dead: list[WebSocket] = []
        for ws in list(self.active_connections[user_id]):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast_to_admins(self, message: dict, users_collection) -> None:
        """Send a JSON message to every connected admin user.
        Never raises — silently ignores send failures.
        """
        try:
            admins = await users_collection.find({"role": "admin"}).to_list(length=None)
            for admin in admins:
                await self.send_to_user(str(admin["_id"]), message)
        except Exception:
            pass


# Module-level singleton — import this from other routers
manager = ConnectionManager()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time notifications.

    URL: ws://host/ws/{user_id}?token=<jwt>

    The client must supply its JWT as a query parameter.
    The server validates that the token's `sub` claim matches user_id.
    """
    # Validate token
    payload = decode_access_token(token)
    if not payload or payload.get("sub") != user_id:
        await websocket.close(code=1008)  # Policy Violation
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive; receive and discard ping/pong messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        # Any other error — clean up silently
        manager.disconnect(websocket, user_id)
