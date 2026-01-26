#!/bin/bash

# Configuration
BASE_URL="http://localhost:4001"
EMAIL="testuser@example.com"
PASSWORD="testpassword123"
NAME="Test User"

echo "=== Social Media API Test Script ==="

# 1. Signup
echo -e "\n1. Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
     -H "Content-Type: application/json" \
     -d "{\"name\":\"$NAME\", \"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")
echo "$SIGNUP_RESPONSE"

# 2. Login
echo -e "\n2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")
echo "$LOGIN_RESPONSE"

# Extract Access Token (requires jq if installed, otherwise uses simple grep)
if command -v jq >/dev/null 2>&1; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.result.accessToken')
else
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -oP '"accessToken":"\K[^"]+')
fi

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" == "null" ]; then
    echo "Error: Failed to obtain access token. Is the server running and db connected?"
    exit 1
fi

echo "Access Token obtained: ${ACCESS_TOKEN:0:20}..."

# 3. Get My Info
echo -e "\n3. Testing Get My Info..."
INFO_RESPONSE=$(curl -s -X GET "$BASE_URL/user/getMyInfo" \
     -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$INFO_RESPONSE"

# 4. Create a Post (Note: requires a base64 image or similar if using cloudinary, 
# but we'll try a simple caption first to see if it catches the missing image error)
echo -e "\n4. Testing Create Post (Expect failure if postImg is missing)..."
POST_RESPONSE=$(curl -s -X POST "$BASE_URL/posts/" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"caption\":\"Hello World from API test!\"}")
echo "$POST_RESPONSE"

echo -e "\n=== API Tests Completed ==="
