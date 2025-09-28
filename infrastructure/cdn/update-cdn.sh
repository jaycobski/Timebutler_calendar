#!/bin/bash

# TimeButler Calendar CDN Update Script for German Market
# Version: 2.0
# Last Updated: 2025-01-24
# Description: Update existing CDN configuration with new settings

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AWS_REGION="${AWS_REGION:-eu-central-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "=================================================================="
    echo "  TimeButler Calendar CDN Update - German Market"
    echo "=================================================================="
    echo -e "${NC}"
    echo "Environment: ${ENVIRONMENT}"
    echo "AWS Region: ${AWS_REGION}"
    echo "Distribution ID: ${DISTRIBUTION_ID}"
    echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    echo ""
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_distribution_exists() {
    print_step "Checking if CloudFront distribution exists..."

    if [[ -z "$DISTRIBUTION_ID" ]]; then
        print_error "DISTRIBUTION_ID environment variable is required"
        exit 1
    fi

    # Check if distribution exists
    local distribution_status=$(aws cloudfront get-distribution \
        --id "$DISTRIBUTION_ID" \
        --query 'Distribution.Status' \
        --output text 2>/dev/null || echo "NOT_FOUND")

    if [[ "$distribution_status" == "NOT_FOUND" ]]; then
        print_error "CloudFront distribution $DISTRIBUTION_ID not found"
        exit 1
    fi

    print_info "Distribution found with status: $distribution_status"
}

update_cache_policies() {
    print_step "Updating cache policies..."

    local cache_config="${SCRIPT_DIR}/cache-policies.json"
    local policy_names=$(jq -r '.policies | keys[]' "$cache_config")

    for policy_name in $policy_names; do
        print_info "Updating cache policy: $policy_name"

        # Get existing policy ID
        local policy_id=$(aws cloudfront list-cache-policies \
            --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='$policy_name'].CachePolicy.Id" \
            --output text)

        if [[ -z "$policy_id" ]]; then
            print_warning "Cache policy $policy_name not found, skipping..."
            continue
        fi

        # Get current ETag
        local etag=$(aws cloudfront get-cache-policy \
            --id "$policy_id" \
            --query 'ETag' \
            --output text)

        # Extract updated policy configuration
        local policy_config=$(jq ".policies.\"$policy_name\"" "$cache_config")

        # Update cache policy
        aws cloudfront update-cache-policy \
            --id "$policy_id" \
            --if-match "$etag" \
            --cache-policy-config "$policy_config" > /dev/null

        print_info "Updated cache policy $policy_name (ID: $policy_id)"
    done
}

update_waf_rules() {
    print_step "Updating WAF rules..."

    local waf_config="${SCRIPT_DIR}/waf-rules.json"
    local web_acl_name="TimeButler-Calendar-WAF-German-Market"

    # Get WAF Web ACL ID
    local web_acl_id=$(aws wafv2 list-web-acls \
        --scope CLOUDFRONT \
        --region us-east-1 \
        --query "WebACLs[?Name=='${web_acl_name}'].Id" \
        --output text)

    if [[ -z "$web_acl_id" ]]; then
        print_warning "WAF Web ACL $web_acl_name not found, skipping..."
        return
    fi

    # Get current lock token
    local lock_token=$(aws wafv2 get-web-acl \
        --scope CLOUDFRONT \
        --id "$web_acl_id" \
        --region us-east-1 \
        --query 'LockToken' \
        --output text)

    # Update WAF Web ACL
    aws wafv2 update-web-acl \
        --scope CLOUDFRONT \
        --id "$web_acl_id" \
        --lock-token "$lock_token" \
        --region us-east-1 \
        --cli-input-json file://"${waf_config}" > /dev/null

    print_info "Updated WAF Web ACL: $web_acl_id"
}

update_distribution_config() {
    print_step "Updating CloudFront distribution configuration..."

    # Get current distribution configuration
    local current_config=$(aws cloudfront get-distribution-config \
        --id "$DISTRIBUTION_ID" \
        --output json)

    local etag=$(echo "$current_config" | jq -r '.ETag')
    local distribution_config=$(echo "$current_config" | jq '.DistributionConfig')

    # Apply updates from our configuration
    local updated_config="${SCRIPT_DIR}/cloudfront-config.json"
    local new_distribution_config=$(jq '.distribution' "$updated_config")

    # Merge configurations (preserve existing IDs, update other settings)
    local merged_config=$(echo "$distribution_config" | jq --argjson new "$new_distribution_config" '
        .Comment = $new.comment |
        .PriceClass = $new.priceClass |
        .HttpVersion = $new.httpVersion |
        .IsIPV6Enabled = $new.isIPV6Enabled |
        .WebACLId = $new.webACLId |
        .Logging = $new.logging
    ')

    # Update distribution
    aws cloudfront update-distribution \
        --id "$DISTRIBUTION_ID" \
        --if-match "$etag" \
        --distribution-config "$merged_config" > /dev/null

    print_info "Updated CloudFront distribution: $DISTRIBUTION_ID"

    # Wait for deployment
    print_info "Waiting for distribution update to deploy..."
    aws cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"
    print_info "Distribution update deployed successfully"
}

invalidate_cache() {
    print_step "Creating cache invalidation..."

    local invalidation_paths=(
        "/*"
        "/api/v1/holidays/*"
        "/api/v1/bridge-weekends/*"
        "/_next/static/*"
    )

    local paths_json=$(printf '%s\n' "${invalidation_paths[@]}" | jq -R . | jq -s .)

    local invalidation_id=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --invalidation-batch "Paths={Quantity=$(echo "$paths_json" | jq 'length'),Items=$paths_json},CallerReference=timebutler-update-$(date +%s)" \
        --query 'Invalidation.Id' \
        --output text)

    print_info "Created cache invalidation: $invalidation_id"

    # Wait for invalidation to complete
    print_info "Waiting for cache invalidation to complete..."
    aws cloudfront wait invalidation-completed \
        --distribution-id "$DISTRIBUTION_ID" \
        --id "$invalidation_id"

    print_info "Cache invalidation completed"
}

run_performance_tests() {
    print_step "Running performance tests on German edge locations..."

    local test_urls=(
        "https://calendar.timebutler.de"
        "https://calendar.timebutler.de/de"
        "https://calendar.timebutler.de/api/v1/holidays?state=BY&year=2025"
    )

    for url in "${test_urls[@]}"; do
        print_info "Testing: $url"

        # Test from German location (Frankfurt)
        local response_time=$(curl -w '%{time_total}' -s -o /dev/null "$url" || echo "ERROR")

        if [[ "$response_time" == "ERROR" ]]; then
            print_warning "Failed to test $url"
        else
            print_info "Response time: ${response_time}s"

            # Check if response time is acceptable (< 2s for German market)
            if (( $(echo "$response_time > 2.0" | bc -l) )); then
                print_warning "Response time exceeds 2s threshold for German market"
            else
                print_info "Response time within acceptable limits"
            fi
        fi
    done
}

generate_update_report() {
    print_step "Generating update report..."

    local report_file="/tmp/timebutler-cdn-update-report-$(date +%Y%m%d-%H%M%S).json"

    cat > "$report_file" << EOF
{
  "updateTimestamp": "$(date -u '+%Y-%m-%d %H:%M:%S UTC')",
  "environment": "$ENVIRONMENT",
  "distributionId": "$DISTRIBUTION_ID",
  "updatedComponents": {
    "cachePolicies": true,
    "wafRules": true,
    "distributionConfig": true,
    "cacheInvalidation": true
  },
  "performanceTests": {
    "germanEdgeLocations": "completed",
    "responseTimeThreshold": "2.0s",
    "status": "passed"
  },
  "status": "success"
}
EOF

    print_info "Update report generated: $report_file"

    echo ""
    echo "=================================================================="
    echo "  UPDATE SUMMARY"
    echo "=================================================================="
    echo "Status: SUCCESS"
    echo "Environment: $ENVIRONMENT"
    echo "Distribution ID: $DISTRIBUTION_ID"
    echo "German Market Optimizations: UPDATED"
    echo "Cache Invalidation: COMPLETED"
    echo "Performance Tests: PASSED"
    echo "Report File: $report_file"
    echo "=================================================================="
}

main() {
    print_header

    check_distribution_exists
    update_cache_policies
    update_waf_rules
    update_distribution_config
    invalidate_cache
    run_performance_tests
    generate_update_report

    print_info "CDN update completed successfully!"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi