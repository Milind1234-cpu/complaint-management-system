"""
Full manual smoke test for the Complaint Management System.
Covers all checklist items from the brief.
Run: python smoke_test_full.py
Requires: backend on :8000, requests installed.
"""
import sys
import requests
import csv
import io

BASE = "http://127.0.0.1:8000"
GREEN = "\033[92m"; RED = "\033[91m"; YELLOW = "\033[93m"; RESET = "\033[0m"
passed = 0; failed = 0

def ok(n, msg):
    global passed; passed += 1
    print(f"{GREEN}PASS [{n}]{RESET} {msg}")

def fail(n, msg):
    global failed; failed += 1
    print(f"{RED}FAIL [{n}]{RESET} {msg}")

def warn(n, msg):
    print(f"{YELLOW}WARN [{n}]{RESET} {msg}")

def h(token): return {"Authorization": f"Bearer {token}"}

# ── shared state ──────────────────────────────────────────────────────────────
ADMIN_TOKEN = STAFF_TOKEN = STAFF_ID = ""
CUST_TOKEN = CUST_ID = CUST2_TOKEN = ""
TEAM_ID = PRODUCT_ID = TICKET_ID = RATED_TICKET_ID = ""

# ═══════════════════════════════════════════════════════════════
# SETUP — Steps 1 & 2: servers
# ═══════════════════════════════════════════════════════════════
print(f"\n{YELLOW}── SETUP: Backend health ──{RESET}")
try:
    r = requests.get(f"{BASE}/health", timeout=5)
    if r.status_code == 200 and r.json().get("status") == "healthy":
        ok("1a", f"Backend responds at :8000, status=healthy")
    else:
        fail("1a", f"Backend health unexpected: {r.status_code} {r.text}")
except Exception as e:
    fail("1a", f"Backend unreachable: {e}")

print(f"\n{YELLOW}── SETUP: Frontend health ──{RESET}")
try:
    r = requests.get("http://localhost:5174/", timeout=5)
    if r.status_code == 200 and "<!doctype html>" in r.text.lower():
        ok("2a", "Frontend serves HTML at localhost:5174")
    else:
        fail("2a", f"Frontend unexpected: {r.status_code}")
except Exception as e:
    fail("2a", f"Frontend unreachable: {e}")

# ═══════════════════════════════════════════════════════════════
# AUTH & ROLES — Step 3: Login all three roles
# ═══════════════════════════════════════════════════════════════
print(f"\n{YELLOW}── AUTH: Admin login ──{RESET}")
try:
    r = requests.post(f"{BASE}/api/auth/login",
        data={"username": "admin@test.com", "password": "admin123"})
    if r.status_code == 200:
        ADMIN_TOKEN = r.json()["access_token"]
        ok("3a", f"Admin login OK, role={r.json()['user']['role']}")
    else:
        fail("3a", f"Admin login failed: {r.status_code} {r.text[:120]}")
except Exception as e:
    fail("3a", f"Exception: {e}")

print(f"\n{YELLOW}── AUTH: Staff login ──{RESET}")
try:
    r = requests.post(f"{BASE}/api/auth/login",
        data={"username": "staff1@test.com", "password": "staff123"})
    if r.status_code == 200:
        STAFF_TOKEN = r.json()["access_token"]
        STAFF_ID = r.json()["user"]["_id"]
        ok("3b", f"Staff login OK, role={r.json()['user']['role']}, id={STAFF_ID[:8]}…")
    else:
        fail("3b", f"Staff login failed: {r.status_code} {r.text[:120]}")
except Exception as e:
    fail("3b", f"Exception: {e}")

print(f"\n{YELLOW}── AUTH: Customer login ──{RESET}")
try:
    r = requests.post(f"{BASE}/api/auth/login",
        data={"username": "customer1@test.com", "password": "cust123"})
    if r.status_code == 200:
        CUST_TOKEN = r.json()["access_token"]
        CUST_ID = r.json()["user"]["_id"]
        ok("3c", f"Customer login OK, role={r.json()['user']['role']}, id={CUST_ID[:8]}…")
    else:
        fail("3c", f"Customer login failed: {r.status_code} {r.text[:120]}")
except Exception as e:
    fail("3c", f"Exception: {e}")

# ═══════════════════════════════════════════════════════════════
# ROLE ENFORCEMENT — Step 4
# ═══════════════════════════════════════════════════════════════
print(f"\n{YELLOW}── ROLES: Staff/Customer blocked from analytics ──{RESET}")
for label, tok in [("Staff", STAFF_TOKEN), ("Customer", CUST_TOKEN)]:
    try:
        r = requests.get(f"{BASE}/api/analytics/overview", headers=h(tok))
        if r.status_code == 403:
            ok("4a", f"{label} → GET /analytics/overview → 403 (blocked correctly)")
        else:
            fail("4a", f"{label} got {r.status_code} accessing analytics (expected 403)")
    except Exception as e:
        fail("4a", f"{label} exception: {e}")

# Customer cannot update status (staff/admin only)
try:
    # Pick any ticket the customer owns
    tickets_r = requests.get(f"{BASE}/api/tickets/", headers=h(CUST_TOKEN))
    if tickets_r.status_code == 200 and tickets_r.json():
        tid = tickets_r.json()[0]["_id"]
        r = requests.patch(f"{BASE}/api/tickets/{tid}/status",
            json={"status": "closed"}, headers=h(CUST_TOKEN))
        if r.status_code == 403:
            ok("4b", "Customer → PATCH /status → 403 (blocked correctly)")
        else:
            fail("4b", f"Customer patched status, got {r.status_code}: {r.text[:120]}")
    else:
        warn("4b", "No customer tickets found to test status-update block")
except Exception as e:
    fail("4b", f"Exception: {e}")

# Staff cannot reassign
try:
    r = requests.patch(f"{BASE}/api/tickets/000000000000000000000001/reassign",
        json={"assigned_to": STAFF_ID}, headers=h(STAFF_TOKEN))
    if r.status_code in (400, 403):
        ok("4c", f"Staff → PATCH /reassign → {r.status_code} (blocked correctly)")
    else:
        fail("4c", f"Staff reassigned, got {r.status_code}: {r.text[:120]}")
except Exception as e:
    fail("4c", f"Exception: {e}")

# Admin CAN see products
try:
    r = requests.get(f"{BASE}/api/products/", headers=h(ADMIN_TOKEN))
    if r.status_code == 200:
        ok("4d", f"Admin → GET /products → 200 ({len(r.json())} products)")
    else:
        fail("4d", f"Admin can't get products: {r.status_code}")
except Exception as e:
    fail("4d", f"Exception: {e}")
