#!/bin/bash
"""
Manual script to create remaining water and weight logs for nutrivize@gmail.com user
Using individual curl commands to avoid server overload
"""

# API Configuration
API_BASE="http://localhost:8000"
AUTH_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk1MWRkZTkzMmViYWNkODhhZmIwMDM3YmZlZDhmNjJiMDdmMDg2NmIiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGVtbyBVc2VyIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2Zvb2QtdHJhY2tlci02MDk2ZCIsImF1ZCI6ImZvb2QtdHJhY2tlci02MDk2ZCIsImF1dGhfdGltZSI6MTc1MzY2Njc4NCwidXNlcl9pZCI6IjNzZE5qM0hYeGJWVmhHWU9UcE5aWXhTekt5VDIiLCJzdWIiOiIzc2ROajNIWHhiVlZoR1lPVHBOWll4U3pLeVQyIiwiaWF0IjoxNzUzNjY2Nzg0LCJleHAiOjE3NTM2NzAzODQsImVtYWlsIjoibnV0cml2aXplQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJudXRyaXZpemVAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.W8QV2k0h_E_65BtGjsiU4wssOAOJ-z3WDS-54KaksqkeLdP7Xtp_zrSePYsMyRfo4qcU6uLZUh6xXAc8fTdavZqOHN_DcGsnALDTKzHUHn-ERlYkzdnhqrGhlISfZZm_thhXzR14h3uwIyVuI-C_Pkdr1dQOElFc-qeRuAxBprc2iShUt--_78RM1H37ojJdWMi3UwyPcPudpud0CZUZ-ucU7g-tH4sP2jcv_g7_x8hFfUbaaFImxokotmnUPn5RoMqCIDTxC881RIzh1sIdFI59MTujV3QNpU71oIC7Bcl37bSEuidjF__M9lGLsadta2i-WtrvmX-HWIrvmuRNOw"

echo "🚀 Creating remaining water and weight logs manually..."
echo "📅 Adding data for July 13-25, 2025"
echo "============================================================"

# Counter for tracking
water_success=0
weight_success=0

# Function to create water log
create_water_log() {
    local date=$1
    local amount=$2
    
    echo "💧 Creating water log for $date: ${amount} fl oz"
    
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE/water-logs/" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "{\"date\": \"$date\", \"amount\": $amount}")
    
    http_code="${response: -3}"
    if [ "$http_code" -eq 200 ]; then
        echo "  ✓ Success"
        ((water_success++))
    else
        echo "  ✗ Failed (HTTP $http_code)"
    fi
    
    sleep 1  # Wait between requests
}

# Function to create weight log
create_weight_log() {
    local date=$1
    local weight=$2
    
    echo "⚖️ Creating weight log for $date: ${weight}kg"
    
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE/weight-logs/" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "{\"date\": \"$date\", \"weight\": $weight}")
    
    http_code="${response: -3}"
    if [ "$http_code" -eq 200 ]; then
        echo "  ✓ Success"
        ((weight_success++))
    else
        echo "  ✗ Failed (HTTP $http_code)"
    fi
    
    sleep 1  # Wait between requests
}

# Create water and weight logs for July 13-25, 2025
# Using realistic patterns with weekend variations

echo "📅 July 25, 2025 (Thursday)"
create_water_log "2025-07-25" 82
create_weight_log "2025-07-25" 74.7

echo "📅 July 24, 2025 (Wednesday)"
create_water_log "2025-07-24" 78
create_weight_log "2025-07-24" 74.5

echo "📅 July 23, 2025 (Tuesday)"
create_water_log "2025-07-23" 83
create_weight_log "2025-07-23" 74.8

echo "📅 July 22, 2025 (Monday)"
create_water_log "2025-07-22" 74
create_weight_log "2025-07-22" 74.3

echo "📅 July 21, 2025 (Sunday - Weekend)"
create_water_log "2025-07-21" 70
create_weight_log "2025-07-21" 74.8

echo "📅 July 20, 2025 (Saturday - Weekend)"
create_water_log "2025-07-20" 66
create_weight_log "2025-07-20" 74.6

echo "📅 July 19, 2025 (Friday)"
create_water_log "2025-07-19" 79
create_weight_log "2025-07-19" 74.2

echo "📅 July 18, 2025 (Thursday)"
create_water_log "2025-07-18" 76
create_weight_log "2025-07-18" 74.0

echo "📅 July 17, 2025 (Wednesday)"
create_water_log "2025-07-17" 81
create_weight_log "2025-07-17" 74.3

echo "📅 July 16, 2025 (Tuesday)"
create_water_log "2025-07-16" 73
create_weight_log "2025-07-16" 74.1

echo "📅 July 15, 2025 (Monday)"
create_water_log "2025-07-15" 77
create_weight_log "2025-07-15" 73.8

echo "📅 July 14, 2025 (Sunday - Weekend)"
create_water_log "2025-07-14" 68
create_weight_log "2025-07-14" 74.2

echo "📅 July 13, 2025 (Saturday - Weekend)"
create_water_log "2025-07-13" 65
create_weight_log "2025-07-13" 74.0

echo "============================================================"
echo "✅ Manual log creation completed!"
echo "💧 Successfully created $water_success water logs"
echo "⚖️ Successfully created $weight_success weight logs"
echo "🎉 Demo user now has comprehensive tracking data!"
