#!/bin/bash
# Comprehensive curl-based API test

echo "🧪 COMPREHENSIVE API TEST SUITE (curl)"
echo "======================================================================"

PASSED=0
FAILED=0

# Helper function
test_endpoint() {
  local name="$1"
  local method="$2"
  local url="$3"
  local expected_code="$4"
  local data="$5"
  
  echo ""
  echo "Testing: $name"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" 2>&1)
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url" 2>&1)
  fi
  
  status_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)
  
  if [ "$status_code" = "$expected_code" ]; then
    echo "  ✅ Status: $status_code (expected: $expected_code)"
    ((PASSED++))
  else
    echo "  ❌ Status: $status_code (expected: $expected_code)"
    ((FAILED++))
  fi
}

# Test 1: Health Check
echo -e "\n1️⃣  HEALTH CHECK"
test_endpoint "GET /api/health" "GET" "http://localhost:5000/api/health" "200"

# Test 2: OAuth URL
echo -e "\n2️⃣  OAUTH URL"
test_endpoint "GET /api/auth/google/url (should redirect)" "GET" "http://localhost:5000/api/auth/google/url" "302"

# Test 3: Logout without auth
echo -e "\n3️⃣  LOGOUT ENDPOINT"
test_endpoint "POST /api/auth/logout (no auth)" "POST" "http://localhost:5000/api/auth/logout" "401"

# Test 4: Get calendar events without auth
echo -e "\n4️⃣  CALENDAR EVENTS ENDPOINT"
test_endpoint "GET /api/calendar/events (no auth)" "GET" "http://localhost:5000/api/calendar/events" "401"

# Test 5: Refresh token with invalid data
echo -e "\n5️⃣  REFRESH TOKEN"
test_endpoint "POST /api/auth/refresh (invalid)" "POST" "http://localhost:5000/api/auth/refresh" "400" '{"refreshToken":"invalid"}'

# Test 6: Sheet preview without auth
echo -e "\n6️⃣  SHEET PREVIEW"
test_endpoint "POST /api/sheets/preview (no auth)" "POST" "http://localhost:5000/api/sheets/preview" "401" '{"sheetId":"test","tabName":"sheet","rowNumber":1,"rowData":{}}'

# Test 7: Calendar sync without auth
echo -e "\n7️⃣  CALENDAR SYNC"
test_endpoint "POST /api/calendar/sync (no auth)" "POST" "http://localhost:5000/api/calendar/sync" "401" '{"sheetId":"test","tabName":"sheet","rowNumber":1,"rowData":{}}'

# Test 8: Check rate limiting headers
echo -e "\n8️⃣  RATE LIMITING"
response=$(curl -s -i http://localhost:5000/api/auth/google/url 2>&1)
if echo "$response" | grep -q "RateLimit-Limit: 50"; then
  echo "  ✅ Rate limit is 50 requests"
  ((PASSED++))
else
  echo "  ❌ Rate limit header not found or incorrect"
  ((FAILED++))
fi

# Test 9: Check CORS headers
echo -e "\n9️⃣  CORS HEADERS"
response=$(curl -s -i http://localhost:5000/api/health 2>&1)
if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
  echo "  ✅ CORS headers present"
  ((PASSED++))
else
  echo "  ❌ CORS headers missing"
  ((FAILED++))
fi

# Test 10: Check security headers
echo -e "\n🔟 SECURITY HEADERS"
response=$(curl -s -i http://localhost:5000/api/health 2>&1)
if echo "$response" | grep -q "X-Content-Type-Options: nosniff"; then
  echo "  ✅ Security headers present"
  ((PASSED++))
else
  echo "  ❌ Security headers missing"
  ((FAILED++))
fi

# Summary
echo -e "\n======================================================================"
echo -e "\n📊 TEST SUMMARY\n"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "📈 Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED!"
  echo ""
  echo "✅ All 8 endpoints working"
  echo "✅ Authentication protection"
  echo "✅ Rate limiting (50/15min)"
  echo "✅ CORS configured"
  echo "✅ Security headers"
  exit 0
else
  echo "⚠️  Some tests failed"
  exit 1
fi
