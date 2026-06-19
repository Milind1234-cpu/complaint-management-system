"""
End-to-end API flow test for the Complaint Management System.
Run from the backend directory:
    python test_api_flow.py

Requires:
  - Backend running at http://127.0.0.1:8000
  - MongoDB running and reachable
  - 'requests' installed (pip install requests)
"""

import sys
import requests

BASE = "http://127.0.0.1:8000"

# ── colour helpers ────────────────────────────────────────────────────────────
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
ADMIN_TOKEN     = ""
STAFF_TOKEN     = ""
STAFF_ID        = ""
CUSTOMER_TOKEN  = ""
CUSTOMER2_TOKEN = ""
TEAM_ID         = ""
PRODUCT_ID      = ""
TICKET_ID       = ""


# =============================================================================
# STEP 1 – Register admin
# =============================================================================
print(f"\n{YELLOW}── STEP 1: Register admin user ──{RESET}")
try:
    r = requests.post(f"{BASE}/api/auth/register", json={
        "name":     "Admin User",
        "email":    "admin@test.com",
        "password": "admin123",
        "role":     "admin",
    })
    if r.status_code == 201:
        data = r.json()
        ADMIN_TOKEN = data["access_token"]
        ok(1, f"Admin registered — user _id: {data['user']['_id']}")
    elif r.status_code == 400 and "already exists" in r.text:
        lr = requests.post(f"{BASE}/api/auth/login", data={
            "username": "admin@test.com",
            "password": "admin123",
        })
        if lr.status_code == 200:
            ADMIN_TOKEN = lr.json()["access_token"]
            ok(1, "Admin already existed — logged in successfully")
        else:
            fail(1, f"Admin exists but login failed: {lr.status_code} {lr.text}")
    else:
        fail(1, f"Expected 201, got {r.status_code}: {r.text}")
except Exception as e:
    fail(1, f"Exception: {e}")


# =============================================================================
# STEP 2 – Create team
# =============================================================================
print(f"\n{YELLOW}── STEP 2: Create team ──{RESET}")
try:
    if not ADMIN_TOKEN:
        fail(2, "Skipped — no ADMIN_TOKEN from step 1")
    else:
        r = requests.post(
            f"{BASE}/api/teams/",
            json={"name": "Electronics Support", "description": "Handles electronics complaints"},
            headers=auth_headers(ADMIN_TOKEN),
        )
        if r.status_code == 201:
            TEAM_ID = r.json()["_id"]
            ok(2, f"Team created — TEAM_ID: {TEAM_ID}")
        elif r.status_code == 400 and "already exists" in r.text:
            lr = requests.get(f"{BASE}/api/teams/")
            teams = lr.json()
            match = next((t for t in teams if t["name"] == "Electronics Support"), None)
            if match:
                TEAM_ID = match["_id"]
                ok(2, f"Team already existed — TEAM_ID: {TEAM_ID}")
            else:
                fail(2, f"Team name clash reported but not found in list: {lr.text}")
        else:
            fail(2, f"Expected 201, got {r.status_code}: {r.text}")
except Exception as e:
    fail(2, f"Exception: {e}")


# =============================================================================
# STEP 3 – Create product
# =============================================================================
print(f"\n{YELLOW}── STEP 3: Create product ──{RESET}")
try:
    if not ADMIN_TOKEN or not TEAM_ID:
        fail(3, f"Skipped — ADMIN_TOKEN={bool(ADMIN_TOKEN)}, TEAM_ID={bool(TEAM_ID)}")
    else:
        r = requests.post(
            f"{BASE}/api/products/",
            json={"name": "Smart TV X200", "description": "55-inch 4K TV", "team_id": TEAM_ID},
            headers=auth_headers(ADMIN_TOKEN),
        )
        if r.status_code == 201:
            PRODUCT_ID = r.json()["_id"]
            ok(3, f"Product created — PRODUCT_ID: {PRODUCT_ID}")
        elif r.status_code == 400 and "already exists" in r.text:
            lr = requests.get(f"{BASE}/api/products/")
            products = lr.json()
            match = next((p for p in products if p["name"] == "Smart TV X200"), None)
            if match:
                PRODUCT_ID = match["_id"]
                ok(3, f"Product already existed — PRODUCT_ID: {PRODUCT_ID}")
            else:
                fail(3, f"Product name clash reported but not found in list: {lr.text}")
        else:
            fail(3, f"Expected 201, got {r.status_code}: {r.text}")
except Exception as e:
    fail(3, f"Exception: {e}")


# =============================================================================
# STEP 4 – Register staff user (role: "staff" requires team_id)
# =============================================================================
print(f"\n{YELLOW}── STEP 4: Register staff user ──{RESET}")
try:
    if not TEAM_ID:
        fail(4, "Skipped — no TEAM_ID from step 2")
    else:
        r = requests.post(f"{BASE}/api/auth/register", json={
            "name":     "Staff One",
            "email":    "staff1@test.com",
            "password": "staff123",
            "role":     "staff",
            "team_id":  TEAM_ID,
        })
        if r.status_code == 201:
            data = r.json()
            STAFF_TOKEN = data["access_token"]
            STAFF_ID    = data["user"]["_id"]
            ok(4, f"Staff registered — STAFF_ID: {STAFF_ID}")
        elif r.status_code == 400 and "already exists" in r.text:
            lr = requests.post(f"{BASE}/api/auth/login", data={
                "username": "staff1@test.com",
                "password": "staff123",
            })
            if lr.status_code == 200:
                ld = lr.json()
                STAFF_TOKEN = ld["access_token"]
                STAFF_ID    = ld["user"]["_id"]
                ok(4, f"Staff already existed — STAFF_ID: {STAFF_ID}")
            else:
                fail(4, f"Staff exists but login failed: {lr.status_code} {lr.text}")
        else:
            fail(4, f"Expected 201, got {r.status_code}: {r.text}")
except Exception as e:
    fail(4, f"Exception: {e}")


# =============================================================================
# STEP 5 – Register customer
# =============================================================================
print(f"\n{YELLOW}── STEP 5: Register customer ──{RESET}")
try:
    r = requests.post(f"{BASE}/api/auth/register", json={
        "name":     "Customer One",
        "email":    "customer1@test.com",
        "password": "cust123",
        "role":     "customer",
    })
    if r.status_code == 201:
        CUSTOMER_TOKEN = r.json()["access_token"]
        ok(5, "Customer registered — token acquired")
    elif r.status_code == 400 and "already exists" in r.text:
        lr = requests.post(f"{BASE}/api/auth/login", data={
            "username": "customer1@test.com",
            "password": "cust123",
        })
        if lr.status_code == 200:
            CUSTOMER_TOKEN = lr.json()["access_token"]
            ok(5, "Customer already existed — logged in successfully")
        else:
            fail(5, f"Customer exists but login failed: {lr.status_code} {lr.text}")
    else:
        fail(5, f"Expected 201, got {r.status_code}: {r.text}")
except Exception as e:
    fail(5, f"Exception: {e}")


# =============================================================================
# STEP 6 – Create ticket + verify auto-assignment to STAFF_ID
# =============================================================================
print(f"\n{YELLOW}── STEP 6: Create ticket & verify auto-assignment ──{RESET}")
try:
    missing = [k for k, v in [("CUSTOMER_TOKEN", CUSTOMER_TOKEN), ("PRODUCT_ID", PRODUCT_ID), ("STAFF_ID", STAFF_ID)] if not v]
    if missing:
        fail(6, f"Skipped — missing: {', '.join(missing)}")
    else:
        r = requests.post(
            f"{BASE}/api/tickets/",
            json={
                "title":       "TV screen flickering",
                "description": "Screen flickers randomly after 10 minutes of use",
                "product_id":  PRODUCT_ID,
                "priority":    "high",
            },
            headers=auth_headers(CUSTOMER_TOKEN),
        )
        if r.status_code == 201:
            ticket    = r.json()
            TICKET_ID = ticket["_id"]
            assigned  = str(ticket.get("assigned_to") or "")
            if assigned == STAFF_ID:
                ok(6, f"Ticket created & auto-assigned to Staff One ✓ — TICKET_ID: {TICKET_ID}")
            else:
                fail(6, f"Auto-assignment mismatch — expected assigned_to={STAFF_ID!r}, "
                        f"got {assigned!r}. Full response: {ticket}")
        else:
            fail(6, f"Expected 201, got {r.status_code}: {r.text}")
except Exception as e:
    fail(6, f"Exception: {e}")


# =============================================================================
# STEP 7 – Customer lists their tickets — TICKET_ID must appear
# =============================================================================
print(f"\n{YELLOW}── STEP 7: Customer lists tickets ──{RESET}")
try:
    if not CUSTOMER_TOKEN or not TICKET_ID:
        fail(7, "Skipped — missing CUSTOMER_TOKEN or TICKET_ID")
    else:
        r = requests.get(f"{BASE}/api/tickets/", headers=auth_headers(CUSTOMER_TOKEN))
        if r.status_code == 200:
            tickets = r.json()
            ids = [t["_id"] for t in tickets]
            if TICKET_ID in ids:
                ok(7, f"Ticket {TICKET_ID} found in customer list ({len(tickets)} ticket(s) total)")
            else:
                fail(7, f"TICKET_ID {TICKET_ID} not found in list: {ids}")
        else:
            fail(7, f"Expected 200, got {r.status_code}: {r.text}")
except Exception as e:
    fail(7, f"Exception: {e}")


# =============================================================================
# STEP 8 – Staff views their assigned ticket
# =============================================================================
print(f"\n{YELLOW}── STEP 8: Staff views assigned ticket ──{RESET}")
try:
    if not STAFF_TOKEN or not TICKET_ID:
        fail(8, "Skipped — missing STAFF_TOKEN or TICKET_ID")
    else:
        r = requests.get(f"{BASE}/api/tickets/{TICKET_ID}", headers=auth_headers(STAFF_TOKEN))
        if r.status_code == 200:
            ok(8, f"Staff can view ticket — title: \"{r.json().get('title')}\"")
        else:
            fail(8, f"Expected 200, got {r.status_code}: {r.text}")
except Exception as e:
    fail(8, f"Exception: {e}")


# =============================================================================
# STEP 9 – A second customer gets 403 trying to view the first customer's ticket
# =============================================================================
print(f"\n{YELLOW}── STEP 9: Unauthorized customer gets 403 ──{RESET}")
try:
    if not TICKET_ID:
        fail(9, "Skipped — no TICKET_ID")
    else:
        # Register (or log in) second customer
        r2 = requests.post(f"{BASE}/api/auth/register", json={
            "name":     "Customer Two",
            "email":    "customer2@test.com",
            "password": "cust456",
            "role":     "customer",
        })
        if r2.status_code == 201:
            CUSTOMER2_TOKEN = r2.json()["access_token"]
        elif r2.status_code == 400 and "already exists" in r2.text:
            lr = requests.post(f"{BASE}/api/auth/login", data={
                "username": "customer2@test.com",
                "password": "cust456",
            })
            CUSTOMER2_TOKEN = lr.json()["access_token"] if lr.status_code == 200 else ""

        if not CUSTOMER2_TOKEN:
            fail(9, "Could not obtain a second customer token")
        else:
            r = requests.get(
                f"{BASE}/api/tickets/{TICKET_ID}",
                headers=auth_headers(CUSTOMER2_TOKEN),
            )
            if r.status_code == 403:
                ok(9, "Second customer correctly received 403 Forbidden")
            else:
                fail(9, f"Expected 403, got {r.status_code}: {r.text}")
except Exception as e:
    fail(9, f"Exception: {e}")


# =============================================================================
# STEP 10 – Staff updates status → in_progress; activity_log must grow
# =============================================================================
print(f"\n{YELLOW}── STEP 10: Staff sets status → in_progress ──{RESET}")
try:
    if not STAFF_TOKEN or not TICKET_ID:
        fail(10, "Skipped — missing STAFF_TOKEN or TICKET_ID")
    else:
        before_r = requests.get(
            f"{BASE}/api/tickets/{TICKET_ID}", headers=auth_headers(STAFF_TOKEN)
        )
        log_before = len(before_r.json().get("activity_log", []))

        r = requests.patch(
            f"{BASE}/api/tickets/{TICKET_ID}/status",
            json={"status": "in_progress", "comment": "Investigating the issue"},
            headers=auth_headers(STAFF_TOKEN),
        )
        if r.status_code == 200:
            ticket     = r.json()
            new_status = ticket.get("status")
            log_after  = len(ticket.get("activity_log", []))
            if new_status == "in_progress" and log_after > log_before:
                ok(10, f"Status → in_progress ✓  activity_log grew {log_before} → {log_after}")
            else:
                issues = []
                if new_status != "in_progress":
                    issues.append(f"status={new_status!r} (expected 'in_progress')")
                if log_after <= log_before:
                    issues.append(f"activity_log didn't grow (still {log_after})")
                fail(10, "  |  ".join(issues))
        else:
            fail(10, f"Expected 200, got {r.status_code}: {r.text}")
except Exception as e:
    fail(10, f"Exception: {e}")


# =============================================================================
# STEP 11 – Staff updates status → resolved; resolved_at must be populated
# =============================================================================
print(f"\n{YELLOW}── STEP 11: Staff sets status → resolved ──{RESET}")
try:
    if not STAFF_TOKEN or not TICKET_ID:
        fail(11, "Skipped — missing STAFF_TOKEN or TICKET_ID")
    else:
        r = requests.patch(
            f"{BASE}/api/tickets/{TICKET_ID}/status",
            json={"status": "resolved"},
            headers=auth_headers(STAFF_TOKEN),
        )
        if r.status_code == 200:
            ticket      = r.json()
            new_status  = ticket.get("status")
            resolved_at = ticket.get("resolved_at")
            if new_status == "resolved" and resolved_at:
                ok(11, f"Status → resolved ✓  resolved_at: {resolved_at}")
            else:
                issues = []
                if new_status != "resolved":
                    issues.append(f"status={new_status!r} (expected 'resolved')")
                if not resolved_at:
                    issues.append("resolved_at is null/missing in response")
                fail(11, "  |  ".join(issues))
        else:
            fail(11, f"Expected 200, got {r.status_code}: {r.text}")
except Exception as e:
    fail(11, f"Exception: {e}")


# =============================================================================
# STEP 12 – Admin hits GET /api/analytics/overview
# =============================================================================
print(f"\n{YELLOW}── STEP 12: Analytics overview ──{RESET}")
try:
    if not ADMIN_TOKEN:
        fail(12, "Skipped — no ADMIN_TOKEN")
    else:
        r = requests.get(f"{BASE}/api/analytics/overview", headers=auth_headers(ADMIN_TOKEN))
        if r.status_code == 200:
            data = r.json()
            # Expect keys: total_tickets, open, in_progress, resolved, closed, average_resolution_time_hours
            expected_keys = {"total_tickets", "open", "in_progress", "resolved", "closed"}
            missing_keys  = expected_keys - set(data.keys())
            if not missing_keys:
                ok(12, f"Analytics overview returned — total_tickets={data['total_tickets']}, "
                       f"open={data['open']}, in_progress={data['in_progress']}, "
                       f"resolved={data['resolved']}, closed={data['closed']}")
            else:
                fail(12, f"Response missing keys {missing_keys}: {data}")
        else:
            fail(12, f"Expected 200, got {r.status_code}: {r.text}")
except Exception as e:
    fail(12, f"Exception: {e}")


# =============================================================================
# STEP 13 – GET /api/analytics/staff-performance — Staff One has total_assigned≥1, completed≥1
# =============================================================================
print(f"\n{YELLOW}── STEP 13: Analytics staff-performance — Staff One ──{RESET}")
try:
    if not ADMIN_TOKEN or not STAFF_ID:
        fail(13, "Skipped — missing ADMIN_TOKEN or STAFF_ID")
    else:
        r = requests.get(
            f"{BASE}/api/analytics/staff-performance", headers=auth_headers(ADMIN_TOKEN)
        )
        if r.status_code == 200:
            rows = r.json()
            # Each row: {staff_id, staff_name, total_assigned, completed, pending, average_resolution_time_hours}
            staff_row = next((row for row in rows if row.get("staff_id") == STAFF_ID), None)
            if staff_row is None:
                fail(13, f"Staff ID {STAFF_ID} not found in staff-performance rows: {rows}")
            elif staff_row["total_assigned"] >= 1 and staff_row["completed"] >= 1:
                ok(13, f"Staff One shows total_assigned={staff_row['total_assigned']}, "
                       f"completed={staff_row['completed']} ✓")
            else:
                fail(13, f"Expected total_assigned≥1 and completed≥1, "
                         f"got: total_assigned={staff_row.get('total_assigned')}, "
                         f"completed={staff_row.get('completed')}")
        else:
            fail(13, f"Expected 200, got {r.status_code}: {r.text}")
except Exception as e:
    fail(13, f"Exception: {e}")


# =============================================================================
# STEP 14 – GET /api/analytics/product-wise — Smart TV X200 has total_complaints≥1, resolved≥1
# =============================================================================
print(f"\n{YELLOW}── STEP 14: Analytics product-wise — Smart TV X200 ──{RESET}")
try:
    if not ADMIN_TOKEN or not PRODUCT_ID:
        fail(14, "Skipped — missing ADMIN_TOKEN or PRODUCT_ID")
    else:
        r = requests.get(
            f"{BASE}/api/analytics/product-wise", headers=auth_headers(ADMIN_TOKEN)
        )
        if r.status_code == 200:
            rows = r.json()
            # Each row: {product_id, product_name, total_complaints, open, in_progress, resolved, closed}
            product_row = next((row for row in rows if row.get("product_id") == PRODUCT_ID), None)
            if product_row is None:
                fail(14, f"PRODUCT_ID {PRODUCT_ID} not found in product-wise rows: {rows}")
            elif product_row["total_complaints"] >= 1 and product_row["resolved"] >= 1:
                ok(14, f"Smart TV X200 shows total_complaints={product_row['total_complaints']}, "
                       f"resolved={product_row['resolved']} ✓")
            else:
                fail(14, f"Expected total_complaints≥1 and resolved≥1, "
                         f"got: total_complaints={product_row.get('total_complaints')}, "
                         f"resolved={product_row.get('resolved')}")
        else:
            fail(14, f"Expected 200, got {r.status_code}: {r.text}")
except Exception as e:
    fail(14, f"Exception: {e}")


# =============================================================================
# STEP 15 – Invalid ObjectId returns 400, not 500
# =============================================================================
print(f"\n{YELLOW}── STEP 15: Invalid ticket ID returns 400 (not 500) ──{RESET}")
try:
    # Use any valid token — admin is most permissive so it won't 403 before checking the ID
    token = ADMIN_TOKEN or STAFF_TOKEN or CUSTOMER_TOKEN
    if not token:
        fail(15, "Skipped — no token available")
    else:
        r = requests.get(
            f"{BASE}/api/tickets/invalid-id-123",
            headers=auth_headers(token),
        )
        if r.status_code == 400:
            ok(15, f"Invalid ID → 400 ✓  detail: {r.json().get('detail', r.text)}")
        elif r.status_code == 422:
            # FastAPI validation layer caught it before handler — also acceptable
            ok(15, f"Invalid ID → 422 (caught at validation layer — acceptable): {r.text[:120]}")
        elif r.status_code == 500:
            fail(15, "Got 500 — unguarded ObjectId conversion in the handler (add a try/except or global InvalidId handler)")
        else:
            fail(15, f"Expected 400 (or 422), got {r.status_code}: {r.text[:200]}")
except Exception as e:
    fail(15, f"Exception: {e}")


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
