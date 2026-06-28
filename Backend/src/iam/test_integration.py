#!/usr/bin/env python3
"""
Phase 4-6 Integration Test
Tests the full evaluation sequence from the assessment.
Run: python3 test_integration.py
Requires: server running on localhost:3000
"""

import http.client
import json
import sys
import time

TS = str(int(time.time()))[-6:]  # Unique suffix for policy names in this test run

BASE = "localhost"
PORT = 3000
passed = 0
failed = 0

def request(method, path, body=None, token=None):
    conn = http.client.HTTPConnection(BASE, PORT, timeout=5)
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = json.dumps(body) if body else None
    conn.request(method, path, payload, headers)
    resp = conn.getresponse()
    data = resp.read()
    conn.close()
    try:
        return resp.status, json.loads(data)
    except:
        return resp.status, {}

def login(email, password):
    status, data = request("POST", "/api/auth/login", {"email": email, "password": password})
    if status == 200 and data.get("success"):
        return data["data"]["accessToken"]
    print(f"  ❌ Login failed for {email}: {status} {data}")
    sys.exit(1)

def check(description, method, path, token, expected_status, body=None):
    global passed, failed
    status, data = request(method, path, body, token)
    if status == expected_status:
        print(f"  ✅ {description} → {status}")
        passed += 1
    else:
        print(f"  ❌ {description} → {status} (expected {expected_status}) | {data.get('message','')}")
        failed += 1

# ─────────────────────────────────────────────────────────────────────────────
print("\n🔐 Logging in all users...")
root_token = login("root@org.local", "root1234")
alice_token = login("alice@org.local", "alice1234")
bob_token   = login("bob@org.local",  "bob1234")
print("  All tokens obtained.")

# ─────────────────────────────────────────────────────────────────────────────
print("\n🧹 Cleanup: detach all non-seeded policies from Bob and Alice...")
# Get all users to find Bob's and Alice's IDs
_, users_resp = request("GET", "/api/iam/users", None, root_token)
bob_id   = next((u["id"] for u in users_resp.get("data", []) if u["email"] == "bob@org.local"), None)
alice_id = next((u["id"] for u in users_resp.get("data", []) if u["email"] == "alice@org.local"), None)

SEEDED_POLICY_NAMES = {"ReadOnlyAccess"}  # Only keep this on Alice's group — don't keep on Bob

# Detach ALL non-seed policies from Bob (Bob should start with zero policies)
BOB_KEPT_POLICIES: set = set()  # Bob has no seeded direct policies
if bob_id:
    _, bob_data = request("GET", f"/api/iam/users/{bob_id}", None, root_token)
    for att in bob_data.get("data", {}).get("policyAttachments", []):
        pid = att["policy"]["id"]
        pname = att["policy"]["name"]
        # Bob should have NO direct policies at test start
        request("DELETE", f"/api/iam/users/{bob_id}/policies/{pid}", None, root_token)
        print(f"  Detached '{pname}' from Bob")

# Ensure Alice has no boundary
if alice_id:
    request("DELETE", f"/api/iam/users/{alice_id}/boundary", None, root_token)
    print("  Cleared Alice's boundary (if any)")

print("  Cleanup complete.")


# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 1 — Root: access all resource + IAM routes (all → 200)")
check("Root: GET /api/reports",         "GET",    "/api/reports",    root_token, 200)
check("Root: POST /api/reports",        "POST",   "/api/reports",    root_token, 200)
check("Root: DELETE /api/reports/x",    "DELETE", "/api/reports/x",  root_token, 200)
check("Root: GET /api/alerts",          "GET",    "/api/alerts",     root_token, 200)
check("Root: POST /api/alerts",         "POST",   "/api/alerts",     root_token, 200)
check("Root: GET /api/settings",        "GET",    "/api/settings",   root_token, 200)
check("Root: PUT /api/settings",        "PUT",    "/api/settings",   root_token, 200)
check("Root: GET /api/audit",           "GET",    "/api/audit",      root_token, 200)
check("Root: GET /api/iam/policies",    "GET",    "/api/iam/policies", root_token, 200)
TS = str(int(time.time()))[-6:]  # 6-digit suffix for uniqueness

check("Root: POST /api/iam/policies → 201",   "POST",   "/api/iam/policies", root_token, 201,
      {"name":f"RootTestP{TS}","type":"MANAGED","statements":[{"Effect":"Allow","Action":["reports:List"],"Resource":["*"]}]})
check("Root: GET /api/iam/groups",      "GET",    "/api/iam/groups", root_token, 200)
check("Root: GET /api/iam/users",       "GET",    "/api/iam/users",  root_token, 200)

# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 2 — Alice (Viewers/ReadOnlyAccess): correct 200/403 split")
check("Alice: GET /api/reports (List) → 200",          "GET",    "/api/reports",      alice_token, 200)
check("Alice: GET /api/reports/x (Read) → 200",        "GET",    "/api/reports/x",    alice_token, 200)
check("Alice: GET /api/alerts → 200",                  "GET",    "/api/alerts",       alice_token, 200)
check("Alice: GET /api/alerts/x → 200",                "GET",    "/api/alerts/x",     alice_token, 200)
check("Alice: GET /api/audit → 200",                   "GET",    "/api/audit",        alice_token, 200)
check("Alice: GET /api/audit/x → 200",                 "GET",    "/api/audit/x",      alice_token, 200)
check("Alice: POST /api/reports (Create) → 403",       "POST",   "/api/reports",      alice_token, 403)
check("Alice: DELETE /api/reports/x (Delete) → 403",   "DELETE", "/api/reports/x",    alice_token, 403)
check("Alice: POST /api/alerts (Create) → 403",        "POST",   "/api/alerts",       alice_token, 403)
check("Alice: PUT /api/settings (Update) → 403",       "PUT",    "/api/settings",     alice_token, 403)
check("Alice: GET /api/iam/policies → 403",            "GET",    "/api/iam/policies", alice_token, 403)
check("Alice: GET /api/iam/groups → 403",              "GET",    "/api/iam/groups",   alice_token, 403)
check("Alice: GET /api/iam/users → 403",               "GET",    "/api/iam/users",    alice_token, 403)

# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 3 — Root creates IAM list policy and attaches to Bob")
status, policy_data = request("POST", "/api/iam/policies", {
    "name": f"IAMListOnlyPolicy{TS}",
    "type": "MANAGED",
    "statements": [{
        "Effect": "Allow",
        "Action": ["iam:ListPolicies", "iam:ListGroups", "iam:ListUsers"],
        "Resource": ["*"]
    }]
}, root_token)
print(f"  Create IAMListOnly policy → {status}")
if status != 201:
    print(f"  SKIP: Policy creation failed: {policy_data}")
else:
    iam_policy_id = policy_data["data"]["id"]
    # Get Bob's ID
    _, users_data = request("GET", "/api/iam/users", None, root_token)
    bob_id = next((u["id"] for u in users_data.get("data", []) if u["email"] == "bob@org.local"), None)
    if bob_id:
        status2, _ = request("POST", f"/api/iam/users/{bob_id}/policies", {"policyId": iam_policy_id}, root_token)
        print(f"  Attach IAMListOnly to Bob → {status2}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 4 — Bob with IAM list permissions")
check("Bob: GET /api/iam/policies (ListPolicies) → 200",  "GET", "/api/iam/policies", bob_token, 200)
check("Bob: GET /api/iam/groups (ListGroups) → 200",      "GET", "/api/iam/groups",   bob_token, 200)
check("Bob: GET /api/iam/users (ListUsers) → 200",        "GET", "/api/iam/users",    bob_token, 200)
check("Bob: POST /api/iam/policies (Create) → 403",       "POST","/api/iam/policies", bob_token, 403,
      {"name":f"TestPol{TS}","type":"MANAGED","statements":[{"Effect":"Allow","Action":["reports:List"],"Resource":["*"]}]})
check("Bob: POST /api/iam/groups (Create) → 403",         "POST","/api/iam/groups",   bob_token, 403,
      {"name":"X"})
check("Bob: DELETE /api/reports/x (no resource perms) → 403", "DELETE", "/api/reports/x", bob_token, 403)

# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 5 — Root sets boundary on Alice")
_, users_data = request("GET", "/api/iam/users", None, root_token)
alice_id = next((u["id"] for u in users_data.get("data", []) if u["email"] == "alice@org.local"), None)
# Get ReadOnlyAccess policy ID
_, policies_data = request("GET", "/api/iam/policies", None, root_token)
readonly_id = next((p["id"] for p in policies_data.get("data", []) if p["name"] == "ReadOnlyAccess"), None)

if alice_id and readonly_id:
    status3, _ = request("PUT", f"/api/iam/users/{alice_id}/boundary", {"policyId": readonly_id}, root_token)
    print(f"  Set ReadOnlyAccess as Alice's boundary → {status3} (expected 200)")
    # Alice should still be able to do her allowed actions (boundary = same as her group perms)
    check("Alice with boundary: GET /api/reports → 200", "GET", "/api/reports", alice_token, 200)
    check("Alice with boundary: POST /api/reports → 403", "POST", "/api/reports", alice_token, 403)
    
    # Set a narrower boundary (only reports:List) — Alice should lose reports:Read
    # First create narrow policy as root
    status4, narrow_data = request("POST", "/api/iam/policies", {
        "name": f"NarrowBoundary{TS}",
        "type": "MANAGED",
        "statements": [{"Effect": "Allow", "Action": ["reports:List"], "Resource": ["*"]}]
    }, root_token)
    if status4 == 201:
        narrow_id = narrow_data["data"]["id"]
        status5, _ = request("PUT", f"/api/iam/users/{alice_id}/boundary", {"policyId": narrow_id}, root_token)
        print(f"  Set NarrowBoundary on Alice → {status5}")
        check("Alice with narrow boundary: GET /api/reports (List) → 200", "GET", "/api/reports", alice_token, 200)
        check("Alice with narrow boundary: GET /api/reports/x (Read) → 403 (boundary blocks)", "GET", "/api/reports/x", alice_token, 403)

# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 6 — Root creates iam:CreatePolicy+UpdatePolicy policy and attaches to Bob")
_, users_data2 = request("GET", "/api/iam/users", None, root_token)
bob_id = next((u["id"] for u in users_data2.get("data", []) if u["email"] == "bob@org.local"), None)
status6, iam_create_data = request("POST", "/api/iam/policies", {
    "name": f"IAMCreateUpdatePolicy{TS}",
    "type": "MANAGED",
    "statements": [{"Effect": "Allow", "Action": ["iam:CreatePolicy", "iam:UpdatePolicy"], "Resource": ["*"]}]
}, root_token)
print(f"  Create IAMCreateUpdatePolicy → {status6}")
if status6 == 201 and bob_id:
    create_policy_id = iam_create_data["data"]["id"]
    status7, _ = request("POST", f"/api/iam/users/{bob_id}/policies", {"policyId": create_policy_id}, root_token)
    print(f"  Attach IAMCreateUpdatePolicy to Bob → {status7}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 7 — Bob delegation bypass: cannot create policy with reports:Delete")
status8, resp8 = request("POST", "/api/iam/policies", {
    "name": f"BobEscalationAttempt{TS}",
    "type": "MANAGED",
    "statements": [{"Effect": "Allow", "Action": ["reports:Delete"], "Resource": ["*"]}]
}, bob_token)
if status8 == 403:
    print(f"  ✅ PASS — Bob cannot create policy granting reports:Delete → 403")
    passed += 1
else:
    print(f"  ❌ FAIL — Expected 403, got {status8}: {resp8.get('message','')}")
    failed += 1

# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 8 — Root attaches ReportsFullAccess to Bob, Bob can now create reports:Delete policy")
_, policies_data2 = request("GET", "/api/iam/policies", None, root_token)
full_id = next((p["id"] for p in policies_data2.get("data", []) if p["name"] == "ReportsFullAccess"), None)
if full_id and bob_id:
    status9, _ = request("POST", f"/api/iam/users/{bob_id}/policies", {"policyId": full_id}, root_token)
    print(f"  Attach ReportsFullAccess to Bob → {status9}")
    
    # Bob should now be able to create a policy granting reports:Delete
    status10, resp10 = request("POST", "/api/iam/policies", {
        "name": f"BobLegitPolicy{TS}",
        "type": "MANAGED",
        "statements": [{"Effect": "Allow", "Action": ["reports:Delete"], "Resource": ["*"]}]
    }, bob_token)
    if status10 == 201:
        print(f"  ✅ PASS — Bob can now create reports:Delete policy (holds it via ReportsFullAccess) → 201")
        passed += 1
    else:
        print(f"  ❌ FAIL — Expected 201, got {status10}: {resp10.get('message','')}")
        failed += 1

# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 9 — Root removes boundary from Alice")
if alice_id:
    status11, _ = request("DELETE", f"/api/iam/users/{alice_id}/boundary", None, root_token)
    print(f"  Remove boundary from Alice → {status11}")
    check("Alice without boundary: GET /api/reports/x (Read) → 200", "GET", "/api/reports/x", alice_token, 200)

# ─────────────────────────────────────────────────────────────────────────────
print("\n📋 STEP 10 — Additional edge cases")
# Unauthenticated request → 401
check("No token: GET /api/reports → 401", "GET", "/api/reports", None, 401)

# Non-root cannot set boundary
check("Alice: set boundary on self → 403", "PUT", f"/api/iam/users/{alice_id}/boundary",
      alice_token, 403, {"policyId": readonly_id})

# Bob cannot set boundary
check("Bob: set boundary → 403", "PUT", f"/api/iam/users/{alice_id}/boundary",
      bob_token, 403, {"policyId": readonly_id})

# Root cannot have boundary set on them
if alice_id:
    _, root_users = request("GET", "/api/iam/users", None, root_token)
    root_id = next((u["id"] for u in root_users.get("data", []) if u["isRoot"]), None)
    if root_id and readonly_id:
        status12, resp12 = request("PUT", f"/api/iam/users/{root_id}/boundary", {"policyId": readonly_id}, root_token)
        if status12 == 400:
            print(f"  ✅ PASS — Cannot set boundary on root user → 400")
            passed += 1
        else:
            print(f"  ❌ FAIL — Expected 400, got {status12}: {resp12.get('message','')}")
            failed += 1

# Effective permissions endpoint
if alice_id:
    status13, perm_data = request("GET", f"/api/iam/users/{alice_id}/effective-permissions", None, root_token)
    if status13 == 200 and perm_data.get("success"):
        ep = perm_data["data"]["effectivePermissions"]
        print(f"  ✅ PASS — Effective permissions endpoint works → 200")
        print(f"     Alice reports:List = {ep.get('reports',{}).get('reports:List','?')}")
        print(f"     Alice reports:Delete = {ep.get('reports',{}).get('reports:Delete','?')}")
        passed += 1
    else:
        print(f"  ❌ FAIL — Effective permissions → {status13}")
        failed += 1

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{'─'*60}")
print(f"Integration Test Results: {passed} passed, {failed} failed")
if failed == 0:
    print("✅ ALL INTEGRATION TESTS PASS")
else:
    print(f"❌ {failed} TEST(S) FAILED")
    sys.exit(1)
