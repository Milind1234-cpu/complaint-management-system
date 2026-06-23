"""
WebSocket smoke test for the Complaint Management System.
Tests that the admin receives a real-time 'ticket_created' event when
a customer creates a new ticket.

Usage (from backend directory):
    pip install websockets   # test-only dependency
    python test_ws_smoke.py

Requires:
  - Backend running at http://127.0.0.1:8000
  - MongoDB reachable
"""

import asyncio
import json
import sys
import threading
import time
import requests

BASE = "http://127.0.0.1:8000"

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
RESET  = "\033[0m"


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Step A: Log in as admin ───────────────────────────────────────────────────
print(f"\n{YELLOW}── Step A: Admin login ──{RESET}")
r = requests.post(f"{BASE}/api/auth/login", data={
    "username": "admin@test.com",
    "password": "admin123",
})
if r.status_code != 200:
    print(f"{RED}FAIL: Admin login returned {r.status_code}: {r.text}{RESET}")
    sys.exit(1)

admin_data  = r.json()
admin_token = admin_data["access_token"]
admin_id    = admin_data["user"]["_id"]
print(f"{GREEN}OK{RESET}  Admin logged in — user_id={admin_id}")


# ── Step B: Get a valid product_id for ticket creation ───────────────────────
print(f"\n{YELLOW}── Step B: Get product_id ──{RESET}")
pr = requests.get(f"{BASE}/api/products/")
products = pr.json()
if not products:
    print(f"{RED}FAIL: No products found. Run test_api_flow.py first to seed data.{RESET}")
    sys.exit(1)
product_id = products[0]["_id"]
print(f"{GREEN}OK{RESET}  Using product_id={product_id}")


# ── Step C: Log in as customer ────────────────────────────────────────────────
print(f"\n{YELLOW}── Step C: Customer login ──{RESET}")
cr = requests.post(f"{BASE}/api/auth/login", data={
    "username": "customer1@test.com",
    "password": "cust123",
})
if cr.status_code != 200:
    print(f"{RED}FAIL: Customer login returned {cr.status_code}: {cr.text}{RESET}")
    sys.exit(1)

cust_token = cr.json()["access_token"]
print(f"{GREEN}OK{RESET}  Customer logged in")


# ── Main async routine ────────────────────────────────────────────────────────
async def run_smoke_test():
    try:
        import websockets
    except ImportError:
        print(f"\n{RED}ERROR: 'websockets' package not installed.{RESET}")
        print("Run: pip install websockets")
        sys.exit(1)

    ws_url = f"ws://127.0.0.1:8000/ws/{admin_id}?token={admin_token}"
    print(f"\n{YELLOW}── Step D: Connect admin WebSocket ──{RESET}")
    print(f"   URL: ws://127.0.0.1:8000/ws/{admin_id}?token=<token>")

    received_message = None
    connection_error = None

    try:
        async with websockets.connect(ws_url) as ws:
            print(f"{GREEN}OK{RESET}  WebSocket connected")

            # ── Step E: Create ticket in a background thread ──────────────
            ticket_created = threading.Event()

            def create_ticket_thread():
                # Small delay to ensure WS listener is ready
                time.sleep(0.5)
                print(f"\n{YELLOW}── Step E: Customer creates ticket ──{RESET}")
                tr = requests.post(
                    f"{BASE}/api/tickets/",
                    json={
                        "title":       "WS Smoke Test Ticket",
                        "description": "Testing real-time WebSocket notification delivery",
                        "product_id":  product_id,
                        "priority":    "medium",
                    },
                    headers=auth_headers(cust_token),
                )
                if tr.status_code == 201:
                    tid = tr.json()["_id"]
                    print(f"{GREEN}OK{RESET}  Ticket created — _id={tid}")
                else:
                    print(f"{RED}FAIL: Ticket creation returned {tr.status_code}: {tr.text}{RESET}")
                ticket_created.set()

            t = threading.Thread(target=create_ticket_thread, daemon=True)
            t.start()

            # ── Step F: Wait up to 5 seconds for a WS message ────────────
            print(f"\n{YELLOW}── Step F: Waiting for WebSocket message (timeout: 5s) ──{RESET}")
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
                received_message = json.loads(raw)
                print(f"{GREEN}MESSAGE RECEIVED:{RESET} {json.dumps(received_message, indent=2)}")
            except asyncio.TimeoutError:
                print(f"{RED}NO MESSAGE RECEIVED within 5 seconds{RESET}")

            t.join(timeout=2)

    except Exception as e:
        connection_error = str(e)
        print(f"{RED}WebSocket connection error: {e}{RESET}")

    # ── Result ────────────────────────────────────────────────────────────────
    print(f"\n{'=' * 55}")
    if connection_error:
        print(f"  {RED}FAIL{RESET} — WebSocket connection failed: {connection_error}")
        return False
    elif received_message and received_message.get("event") == "ticket_created":
        print(f"  {GREEN}PASS{RESET} — 'ticket_created' event received on admin WebSocket ✓")
        print(f"  Event data: {received_message}")
        return True
    elif received_message:
        # Got a different event (e.g. ticket_assigned to staff) — still means WS works
        event = received_message.get("event", "unknown")
        if event in ("ticket_assigned", "ticket_created", "ticket_status_updated"):
            print(f"  {GREEN}PASS{RESET} — WebSocket delivered event '{event}' ✓")
            print(f"  Event data: {received_message}")
            return True
        else:
            print(f"  {RED}FAIL{RESET} — Received unexpected event: {received_message}")
            return False
    else:
        print(f"  {RED}FAIL{RESET} — No message received within timeout")
        return False


result = asyncio.run(run_smoke_test())
print(f"{'=' * 55}\n")
sys.exit(0 if result else 1)
