"""
Satisfaction rating flow test for the Complaint Management System.
Run from the backend directory with the server running:
    python test_satisfaction_flow.py

Tests:
  1. Create ticket as customer, resolve as staff
  2. Staff attempts to rate → expects 403
  3. Customer rates (rating=5, comment="Great service") → expects 200
  4. GET /api/analytics/satisfaction-overview → verify rating reflected
  5. Customer attempts second rating → expects 400
  6. Admin attempts to rate → expects 403
"""

import sys
import requests

BASE = "http://127.0.0.1:8000"

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
RESET  = "\033[0m"

passed = 0
failed = 0


def ok(n: int, msg: str) -> None:
    global passed
    passed += 1
    print(f"{GREEN}✅ STEP {n} PASSED:{RESET} {msg}")


def fail(n: int, msg: str) -> None:
    global failed
    failed += 1
    print(f"{RED}❌ STEP {n} FAILED:{RESET} {msg}")


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── shared state ──────────────────────────────────────────────────────────────
ADMIN_TOKEN    = ""
STAFF_TOKEN    = ""
STAFF_ID       = ""
CUSTOMER_TOKEN = ""
TEAM_ID        = ""
PRODUCT_ID     = ""
TICKET_ID      = ""


# =============================================================================
# STEP 1 – Obtain tokens (reuse existing test users from test_api_flow.py)
# =============================================================================
print(f"\n{YELLOW}── STEP 1: Obtain tokens for admin, staff, customer ──{RESET}")
try:
    # Admin login
    r = requests.post(f"{BASE}/api/auth/login", data={"username": "admin@test.com", "password": "admin123"})
    if r.status_code == 200:
        ADMIN_TOKEN = r.json()["access_token"]
    else:
        # Try register
        r2 = requests.post(f"{BASE}/api/auth/register", json={"name": "Admin User", "email": "admin@test.com", "password": "admin123", "role": "admin"})
        if r2.status_code == 201:
            ADMIN_TOKEN = r2.json()["access_token"]

    # Customer login / register
    r = requests.post(f"{BASE}/api/auth/login", data={"username": "satcust@test.com", "password": "sat123"})
    if r.status_code == 200:
        CUSTOMER_TOKEN = r.json()["access_token"]
    else:
        r2 = requests.post(f"{BASE}/api/auth/register", json={"name": "Sat Customer", "email": "satcust@test.com", "password": "sat123", "role": "customer"})
        if r2.status_code == 201:
            CUSTOMER_TOKEN = r2.json()["access_token"]

    if ADMIN_TOKEN and CUSTOMER_TOKEN:
        ok(1, "Obtained admin and customer tokens")
    else:
        fail(1, f"Could not obtain tokens — ADMIN={bool(ADMIN_TOKEN)}, CUSTOMER={bool(CUSTOMER_TOKEN)}")
except Exception as e:
    fail(1, f"Exception: {e}")


# =============================================================================
# STEP 2 – Get or create team, product, staff
# =============================================================================
print(f"\n{YELLOW}── STEP 2: Setup team, product, staff ──{RESET}")
try:
    if not ADMIN_TOKEN:
        fail(2, "Skipped — no ADMIN_TOKEN")
    else:
        # Get team
        teams_r = requests.get(f"{BASE}/api/teams/")
        teams = teams_r.json() if teams_r.status_code == 200 else []
        if teams:
            TEAM_ID = teams[0]["_id"]
        else:
            tr = requests.post(f"{BASE}/api/teams/", json={"name": "Sat Team", "description": "Satisfaction test team"}, headers=auth_headers(ADMIN_TOKEN))
            TEAM_ID = tr.json()["_id"] if tr.status_code == 201 else ""

        # Get product
        prods_r = requests.get(f"{BASE}/api/products/")
        prods = prods_r.json() if prods_r.status_code == 200 else []
        if prods:
            PRODUCT_ID = prods[0]["_id"]
        else:
            pr = requests.post(f"{BASE}/api/products/", json={"name": "Sat Product", "description": "Test product", "team_id": TEAM_ID}, headers=auth_headers(ADMIN_TOKEN))
            PRODUCT_ID = pr.json()["_id"] if pr.status_code == 201 else ""

        # Get staff
        staff_r = requests.post(f"{BASE}/api/auth/login", data={"username": "staff1@test.com", "password": "staff123"})
        if staff_r.status_code == 200:
            STAFF_TOKEN = staff_r.json()["access_token"]
            STAFF_ID = staff_r.json()["user"]["_id"]
        else:
            # Create staff
            sr2 = requests.post(f"{BASE}/api/auth/register", json={"name": "Sat Staff", "email": "satstaff@test.com", "password": "satstaff123", "role": "staff", "team_id": TEAM_ID})
            if sr2.status_code == 201:
                STAFF_TOKEN = sr2.json()["access_token"]
                STAFF_ID = sr2.json()["user"]["_id"]

        if TEAM_ID and PRODUCT_ID and STAFF_TOKEN:
            ok(2, f"Setup complete — TEAM_ID={TEAM_ID[:8]}…, PRODUCT_ID={PRODUCT_ID[:8]}…, STAFF_ID={STAFF_ID[:8]}…")
        else:
            fail(2, f"Incomplete setup — TEAM={bool(TEAM_ID)}, PRODUCT={bool(PRODUCT_ID)}, STAFF={bool(STAFF_TOKEN)}")
except Exception as e:
    fail(2, f"Exception: {e}")


# =============================================================================
# STEP 3 – Create ticket as customer, then resolve as staff/admin
# =============================================================================
print(f"\n{YELLOW}── STEP 3: Create and resolve ticket ──{RESET}")
try:
    if not (CUSTOMER_TOKEN and PRODUCT_ID and STAFF_TOKEN):
        fail(3, "Skipped — missing prerequisites")
    else:
        # Create ticket as customer
        r = requests.post(f"{BASE}/api/tickets/", json={"title": "Satisfaction test ticket", "description": "Testing satisfaction rating flow end to end", "product_id": PRODUCT_ID, "priority": "medium"}, headers=auth_headers(CUSTOMER_TOKEN))
        if r.status_code != 201:
            fail(3, f"Ticket creation failed: {r.status_code} {r.text}")
        else:
            TICKET_ID = r.json()["_id"]
            assigned_to = r.json().get("assigned_to")

            # Resolve using staff token if assigned, else admin
            resolve_token = STAFF_TOKEN if assigned_to and str(assigned_to) == STAFF_ID else ADMIN_TOKEN
            rr = requests.patch(f"{BASE}/api/tickets/{TICKET_ID}/status", json={"status": "resolved"}, headers=auth_headers(resolve_token))
            if rr.status_code == 200 and rr.json()["status"] == "resolved":
                ok(3, f"Ticket created and resolved — TICKET_ID={TICKET_ID[:8]}…")
            else:
                fail(3, f"Resolution failed: {rr.status_code} {rr.text}")
except Exception as e:
    fail(3, f"Exception: {e}")


# =============================================================================
# STEP 4 – Staff attempts to rate → expects 403
# =============================================================================
print(f"\n{YELLOW}── STEP 4: Staff attempts to rate → expects 403 ──{RESET}")
try:
    if not (STAFF_TOKEN and TICKET_ID):
        fail(4, "Skipped — missing STAFF_TOKEN or TICKET_ID")
    else:
        r = requests.post(f"{BASE}/api/tickets/{TICKET_ID}/rate", json={"rating": 4}, headers=auth_headers(STAFF_TOKEN))
        if r.status_code == 403:
            ok(4, f"Staff correctly received 403 — {r.json().get('detail', '')}")
        else:
            fail(4, f"Expected 403, got {r.status_code}: {r.text}")
except Exception as e:
    fail(4, f"Exception: {e}")


# =============================================================================
# STEP 5 – Admin attempts to rate → expects 403
# =============================================================================
print(f"\n{YELLOW}── STEP 5: Admin attempts to rate → expects 403 ──{RESET}")
try:
    if not (ADMIN_TOKEN and TICKET_ID):
        fail(5, "Skipped — missing ADMIN_TOKEN or TICKET_ID")
    else:
        r = requests.post(f"{BASE}/api/tickets/{TICKET_ID}/rate", json={"rating": 3}, headers=auth_headers(ADMIN_TOKEN))
        if r.status_code == 403:
            ok(5, f"Admin correctly received 403 — {r.json().get('detail', '')}")
        else:
            fail(5, f"Expected 403, got {r.status_code}: {r.text}")
except Exception as e:
    fail(5, f"Exception: {e}")


# =============================================================================
# STEP 6 – Customer rates ticket (rating=5, comment="Great service") → expects 200
# =============================================================================
print(f"\n{YELLOW}── STEP 6: Customer rates ticket → expects 200 ──{RESET}")
try:
    if not (CUSTOMER_TOKEN and TICKET_ID):
        fail(6, "Skipped — missing CUSTOMER_TOKEN or TICKET_ID")
    else:
        r = requests.post(f"{BASE}/api/tickets/{TICKET_ID}/rate", json={"rating": 5, "comment": "Great service"}, headers=auth_headers(CUSTOMER_TOKEN))
        if r.status_code == 200:
            ticket = r.json()
            if ticket.get("satisfaction_rating") == 5 and ticket.get("satisfaction_comment") == "Great service" and ticket.get("rated_at"):
                ok(6, f"Rating submitted — satisfaction_rating=5, comment='Great service', rated_at set ✓")
            else:
                fail(6, f"Rating fields incorrect: {ticket.get('satisfaction_rating')}, {ticket.get('satisfaction_comment')}, {ticket.get('rated_at')}")
        else:
            fail(6, f"Expected 200, got {r.status_code}: {r.text}")
except Exception as e:
    fail(6, f"Exception: {e}")


# =============================================================================
# STEP 7 – Customer attempts second rating → expects 400
# =============================================================================
print(f"\n{YELLOW}── STEP 7: Customer double-rates → expects 400 ──{RESET}")
try:
    if not (CUSTOMER_TOKEN and TICKET_ID):
        fail(7, "Skipped — missing CUSTOMER_TOKEN or TICKET_ID")
    else:
        r = requests.post(f"{BASE}/api/tickets/{TICKET_ID}/rate", json={"rating": 1}, headers=auth_headers(CUSTOMER_TOKEN))
        if r.status_code == 400:
            ok(7, f"Double-rating correctly blocked with 400 — {r.json().get('detail', '')}")
        else:
            fail(7, f"Expected 400, got {r.status_code}: {r.text}")
except Exception as e:
    fail(7, f"Exception: {e}")


# =============================================================================
# STEP 8 – GET /api/analytics/satisfaction-overview → verify data
# =============================================================================
print(f"\n{YELLOW}── STEP 8: Satisfaction overview reflects the rating ──{RESET}")
try:
    if not ADMIN_TOKEN:
        fail(8, "Skipped — no ADMIN_TOKEN")
    else:
        r = requests.get(f"{BASE}/api/analytics/satisfaction-overview", headers=auth_headers(ADMIN_TOKEN))
        if r.status_code == 200:
            data = r.json()
            expected_keys = {"average_rating", "total_ratings", "rating_distribution", "per_staff_satisfaction"}
            missing = expected_keys - set(data.keys())
            if missing:
                fail(8, f"Missing keys: {missing} in response: {data}")
            elif data["total_ratings"] >= 1 and data["rating_distribution"].get("5", 0) >= 1:
                ok(8, f"Satisfaction overview: avg={data['average_rating']}, total={data['total_ratings']}, 5-star count={data['rating_distribution']['5']} ✓")
            else:
                fail(8, f"Rating not reflected — total_ratings={data['total_ratings']}, distribution={data['rating_distribution']}")
        else:
            fail(8, f"Expected 200, got {r.status_code}: {r.text}")
except Exception as e:
    fail(8, f"Exception: {e}")


# =============================================================================
# STEP 9 – Rating below minimum (0) → expects 422 validation error
# =============================================================================
print(f"\n{YELLOW}── STEP 9: Invalid rating (0) → expects 422 ──{RESET}")
try:
    # Create a new ticket for this test
    if not (CUSTOMER_TOKEN and PRODUCT_ID):
        fail(9, "Skipped — missing prerequisites")
    else:
        r = requests.post(f"{BASE}/api/tickets/{TICKET_ID}/rate", json={"rating": 0}, headers=auth_headers(CUSTOMER_TOKEN))
        if r.status_code in (400, 422):
            ok(9, f"Rating 0 correctly rejected with {r.status_code}")
        else:
            fail(9, f"Expected 400/422 for rating=0, got {r.status_code}: {r.text}")
except Exception as e:
    fail(9, f"Exception: {e}")


# =============================================================================
# SUMMARY
# =============================================================================
total = passed + failed
print(f"\n{'=' * 55}")
print(
    f"  {GREEN}{passed}{RESET}/{total} steps passed"
    + (f"  {RED}({failed} failed){RESET}" if failed else f"  {GREEN}🎉 All passed!{RESET}")
)
print(f"{'=' * 55}\n")

sys.exit(0 if failed == 0 else 1)
