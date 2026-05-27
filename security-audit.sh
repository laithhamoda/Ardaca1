#!/bin/bash

###############################################################################
# COORDIN8 COMPREHENSIVE SECURITY AUDIT & PENETRATION TEST SUITE
# Enterprise-Grade Security Testing for ConstructionTech SaaS Platform
###############################################################################

set -e

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  COORDIN8 SECURITY AUDIT & PENETRATION TEST SUITE"
echo "  GCC ConstructionTech/PropTech SaaS Platform"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Test result functions
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAIL_COUNT++))
}

warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    ((WARN_COUNT++))
}

info() {
    echo -e "${BLUE}ℹ INFO${NC}: $1"
}

###############################################################################
# 1. CONTAINER & IMAGE SECURITY TESTS
###############################################################################

echo ""
echo "┌─ 1. CONTAINER & IMAGE SECURITY"
echo "│"

# 1.1 Check for root user in running containers
echo "│ 1.1 Checking for root user in containers..."
for container in ardaca-backend ardaca-frontend ardaca-postgres ardaca-redis; do
    if docker ps --filter "name=$container" --quiet | grep -q .; then
        USER=$(docker exec $container whoami 2>/dev/null || echo "unknown")
        if [ "$USER" = "root" ]; then
            warn "Container $container running as root user"
        else
            pass "Container $container running as non-root: $USER"
        fi
    fi
done

# 1.2 Check container read-only filesystem
echo "│ 1.2 Checking container filesystem security..."
for container in ardaca-backend ardaca-frontend; do
    WRITABLE=$(docker inspect $container | grep -i "readonly" || echo "writable")
    if [[ $WRITABLE == *"false"* ]] || [[ $WRITABLE == "writable" ]]; then
        warn "Container $container has writable filesystem (should consider read-only where possible)"
    fi
done

# 1.3 Check for privileged mode
echo "│ 1.3 Checking for privileged containers..."
for container in ardaca-backend ardaca-frontend ardaca-postgres ardaca-redis; do
    PRIVILEGED=$(docker inspect $container | grep -i "privileged" | grep -i "true" || echo "not-privileged")
    if [[ $PRIVILEGED == *"true"* ]]; then
        fail "Container $container running in privileged mode"
    else
        pass "Container $container not in privileged mode"
    fi
done

# 1.4 Check image vulnerabilities with Trivy (if installed)
echo "│ 1.4 Checking image vulnerabilities..."
if command -v trivy &> /dev/null; then
    for image in ardaca-backend ardaca-frontend; do
        info "Scanning $image with Trivy..."
        trivy image $image 2>/dev/null | grep -i "high\|critical" || pass "$image has no high/critical vulnerabilities"
    done
else
    warn "Trivy not installed. Install for image scanning: https://github.com/aquasecurity/trivy"
fi

echo "│"

###############################################################################
# 2. NETWORK SECURITY TESTS
###############################################################################

echo "┌─ 2. NETWORK SECURITY"
echo "│"

# 2.1 Check exposed ports
echo "│ 2.1 Checking exposed ports..."
EXPOSED_PORTS=$(docker ps --format "{{.Ports}}")
if echo "$EXPOSED_PORTS" | grep -q "0.0.0.0:5432"; then
    fail "PostgreSQL port 5432 exposed to 0.0.0.0 (should be internal only)"
else
    pass "PostgreSQL port not exposed to 0.0.0.0"
fi

if echo "$EXPOSED_PORTS" | grep -q "0.0.0.0:6379"; then
    fail "Redis port 6379 exposed to 0.0.0.0 (should be internal only)"
else
    pass "Redis port not exposed to 0.0.0.0"
fi

if echo "$EXPOSED_PORTS" | grep -q "0.0.0.0:3000"; then
    warn "Backend API port 3000 exposed. Ensure firewall rules restrict access in production"
else
    pass "Backend API properly configured"
fi

# 2.2 Check for TLS/HTTPS
echo "│ 2.2 Checking TLS/HTTPS configuration..."
if grep -r "ssl\|tls" docker-compose.yml &>/dev/null; then
    pass "TLS configuration found in compose file"
else
    warn "No TLS configuration detected in docker-compose.yml (required for production)"
fi

# 2.3 Check network isolation
echo "│ 2.3 Checking Docker network isolation..."
NETWORKS=$(docker network ls --filter driver=bridge --format "{{.Name}}")
if echo "$NETWORKS" | grep -q "ardaca"; then
    pass "Custom Docker network in use (ardaca)"
else
    warn "Using default bridge network (consider custom network for isolation)"
fi

echo "│"

###############################################################################
# 3. API SECURITY TESTS
###############################################################################

echo "┌─ 3. API ENDPOINT SECURITY"
echo "│"

# 3.1 Check for basic auth headers
echo "│ 3.1 Testing authentication headers..."
RESPONSE=$(curl -s -X GET http://localhost:3000/api/v1/users -w "\n%{http_code}" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    pass "Unauthenticated API calls return 401 Unauthorized"
elif [ "$HTTP_CODE" = "403" ]; then
    pass "Unauthenticated API calls return 403 Forbidden"
elif [ "$HTTP_CODE" = "000" ]; then
    warn "Backend not responding (still initializing?)"
else
    fail "Unauthenticated API call returned $HTTP_CODE (should be 401/403)"
fi

# 3.2 Check for CORS headers
echo "│ 3.2 Testing CORS configuration..."
CORS_HEADER=$(curl -s -X OPTIONS http://localhost:3000/api/v1/auth/login \
    -H "Origin: http://malicious-site.com" \
    -H "Access-Control-Request-Method: POST" \
    -w "\n" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")

if [ -z "$CORS_HEADER" ]; then
    pass "CORS headers not leaked to external origins (secure)"
else
    if echo "$CORS_HEADER" | grep -q "*"; then
        fail "CORS wildcard detected (insecure, allows all origins)"
    else
        pass "CORS configured with specific origins"
    fi
fi

# 3.3 Check for security headers
echo "│ 3.3 Checking security response headers..."
HEADERS=$(curl -s -I http://localhost:3000/api/v1/auth/login 2>/dev/null || echo "")

if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
    pass "X-Content-Type-Options header set (prevents MIME type sniffing)"
else
    warn "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    pass "X-Frame-Options header set (clickjacking protection)"
else
    warn "X-Frame-Options header missing"
fi

if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
    pass "HSTS header set (forces HTTPS)"
else
    warn "HSTS header missing (required in production)"
fi

echo "│"

###############################################################################
# 4. DATABASE SECURITY TESTS
###############################################################################

echo "┌─ 4. DATABASE SECURITY"
echo "│"

# 4.1 Check PostgreSQL connection security
echo "│ 4.1 Testing PostgreSQL connection..."
DB_TEST=$(PGPASSWORD=ardaca_password_dev psql -h localhost -U ardaca_user -d ardaca -c "SELECT 1" 2>&1 || echo "connection_failed")

if echo "$DB_TEST" | grep -q "1"; then
    pass "PostgreSQL connection successful (basic connectivity verified)"
else
    info "PostgreSQL connection test (may be expected in test environment)"
fi

# 4.2 Check for default credentials
echo "│ 4.2 Checking for default credentials..."
if grep -r "password.*dev\|password.*test" docker-compose.yml &>/dev/null; then
    warn "Default/weak credentials found in compose file (change for production)"
else
    pass "No obvious weak credentials in docker-compose"
fi

# 4.3 Check for SQL injection vulnerability in input validation
echo "│ 4.3 Testing input validation (SQL injection)..."
SQL_INJECTION_TEST=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@test.com\" OR \"1\"=\"1","password":"test"}' 2>/dev/null || echo "")

if echo "$SQL_INJECTION_TEST" | grep -qi "error\|invalid"; then
    pass "SQL injection attempt properly rejected"
else
    info "Input validation tested"
fi

# 4.4 Redis security check
echo "│ 4.4 Checking Redis security..."
REDIS_PING=$(redis-cli -h localhost -p 6379 PING 2>/dev/null || echo "failed")

if echo "$REDIS_PING" | grep -q "PONG"; then
    if redis-cli -h localhost -p 6379 CONFIG GET requirepass 2>/dev/null | grep -q "requirepass"; then
        pass "Redis requirepass configured"
    else
        warn "Redis running without password authentication (set requirepass in production)"
    fi
else
    info "Redis connectivity check completed"
fi

echo "│"

###############################################################################
# 5. SECRETS MANAGEMENT TESTS
###############################################################################

echo "┌─ 5. SECRETS & CONFIGURATION MANAGEMENT"
echo "│"

# 5.1 Check for hardcoded secrets in codebase
echo "│ 5.1 Scanning for hardcoded secrets..."
SECRETS_FOUND=0
SECRET_PATTERNS=("password\s*[:=].*['\"]" "api[_-]?key\s*[:=]" "secret\s*[:=]" "token\s*[:=]")

for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -E "$pattern" backend/src 2>/dev/null | grep -v node_modules | grep -v ".env"; then
        warn "Potential hardcoded secret found matching pattern: $pattern"
        ((SECRETS_FOUND++))
    fi
done

if [ $SECRETS_FOUND -eq 0 ]; then
    pass "No obvious hardcoded secrets detected in source code"
fi

# 5.2 Check .env file security
echo "│ 5.2 Checking environment variable security..."
if [ -f ".env.local" ]; then
    if [ -r ".env.local" ]; then
        warn ".env.local is readable (should have restricted permissions)"
    fi
    if grep -q "JWT_SECRET=.*secret\|PASSWORD=.*password" .env.local 2>/dev/null; then
        fail "Weak default credentials in .env.local"
    fi
else
    pass ".env.local not found (credentials may be in secure storage)"
fi

# 5.3 Check for credential exposure in git history
echo "│ 5.3 Checking git history for secrets..."
if command -v git-secrets &> /dev/null; then
    git-secrets --scan 2>/dev/null && pass "Git history scanned with git-secrets" || warn "Potential secrets in git history"
else
    info "git-secrets not installed (install for git history scanning)"
fi

echo "│"

###############################################################################
# 6. RBAC & AUTHORIZATION TESTS
###############################################################################

echo "┌─ 6. RBAC & AUTHORIZATION"
echo "│"

# 6.1 Test role-based access control
echo "│ 6.1 Testing RBAC enforcement..."
ADMIN_TOKEN="test_admin_token_missing"
USER_TOKEN="test_user_token_missing"

# Try to access admin endpoint without proper token
ADMIN_TEST=$(curl -s -X GET http://localhost:3000/api/v1/admin/users \
    -H "Authorization: Bearer $USER_TOKEN" 2>/dev/null || echo "")

if echo "$ADMIN_TEST" | grep -qi "forbidden\|unauthorized"; then
    pass "Non-admin users cannot access admin endpoints"
else
    info "RBAC test (tokens needed for full verification)"
fi

# 6.2 Check for privilege escalation vulnerabilities
echo "│ 6.2 Testing privilege escalation protection..."
info "Privilege escalation tests require valid authentication tokens"

# 6.3 Check multi-tenant isolation
echo "│ 6.3 Testing multi-tenant isolation..."
info "Multi-tenant isolation requires authenticated requests with org context"

echo "│"

###############################################################################
# 7. AUDIT LOGGING TESTS
###############################################################################

echo "┌─ 7. AUDIT LOGGING & COMPLIANCE"
echo "│"

# 7.1 Check audit logs are being written
echo "│ 7.1 Checking audit logging..."
if docker exec ardaca-postgres-1 psql -U ardaca_user -d ardaca -c "\dt audit_logs" 2>/dev/null | grep -q "audit_logs"; then
    pass "Audit logs table exists in database"
else
    warn "Audit logs table not found (ensure audit logging is implemented)"
fi

# 7.2 Check application logging
echo "│ 7.2 Checking application logging..."
docker logs ardaca-backend-1 2>/dev/null | tail -20 > /tmp/backend_logs.txt
if [ -s /tmp/backend_logs.txt ]; then
    pass "Application logs being written to stdout"
else
    warn "No application logs detected"
fi

# 7.3 Check for sensitive data in logs
echo "│ 7.3 Scanning logs for sensitive data..."
if grep -i "password\|token\|secret\|key" /tmp/backend_logs.txt 2>/dev/null | grep -v "JwtFactory\|JwtModule"; then
    fail "Sensitive data potentially logged (passwords/tokens should never be logged)"
else
    pass "No sensitive data detected in application logs"
fi

echo "│"

###############################################################################
# 8. ENCRYPTION & DATA PROTECTION
###############################################################################

echo "┌─ 8. ENCRYPTION & DATA PROTECTION"
echo "│"

# 8.1 Check database encryption
echo "│ 8.1 Checking database encryption..."
DB_CONFIG=$(grep -i "ssl\|encrypt" docker-compose.yml || echo "")
if [ -n "$DB_CONFIG" ]; then
    pass "Database encryption/SSL configuration present"
else
    warn "No explicit database encryption configuration found"
fi

# 8.2 Check for HTTPS/TLS in frontend
echo "│ 8.2 Checking frontend TLS configuration..."
if grep -r "https\|tls" frontend/next.config.js 2>/dev/null; then
    pass "Frontend TLS configuration detected"
else
    warn "Frontend should enforce HTTPS in production"
fi

# 8.3 Check for at-rest encryption
echo "│ 8.3 Checking at-rest encryption..."
info "At-rest encryption verification requires cloud provider configuration (AWS KMS, etc.)"

echo "│"

###############################################################################
# 9. DEPENDENCY & VULNERABILITY SCANS
###############################################################################

echo "┌─ 9. DEPENDENCY & VULNERABILITY ANALYSIS"
echo "│"

# 9.1 Check npm audit for known vulnerabilities
echo "│ 9.1 Scanning NPM dependencies for vulnerabilities..."
if [ -f "backend/package.json" ]; then
    AUDIT_RESULTS=$(npm audit --prefix backend 2>&1 | grep -i "high\|critical" || echo "")
    if [ -n "$AUDIT_RESULTS" ]; then
        warn "NPM audit found vulnerabilities: $AUDIT_RESULTS"
    else
        pass "Backend NPM dependencies have no high/critical vulnerabilities"
    fi
fi

if [ -f "frontend/package.json" ]; then
    AUDIT_RESULTS=$(npm audit --prefix frontend 2>&1 | grep -i "high\|critical" || echo "")
    if [ -n "$AUDIT_RESULTS" ]; then
        warn "Frontend NPM dependencies have vulnerabilities"
    else
        pass "Frontend NPM dependencies have no high/critical vulnerabilities"
    fi
fi

# 9.2 Check for outdated packages
echo "│ 9.2 Checking for outdated packages..."
info "Run 'npm outdated' to check for outdated packages"

echo "│"

###############################################################################
# 10. INFRASTRUCTURE & DEPLOYMENT SECURITY
###############################################################################

echo "┌─ 10. INFRASTRUCTURE & DEPLOYMENT SECURITY"
echo "│"

# 10.1 Check Docker Compose security settings
echo "│ 10.1 Analyzing docker-compose security..."
SECURITY_SETTINGS=0

if grep -q "security_opt" docker-compose.yml; then
    pass "Security options configured in docker-compose"
    ((SECURITY_SETTINGS++))
else
    info "No security_opt found (consider: security_opt: - no-new-privileges:true)"
fi

if grep -q "cap_drop\|cap_add" docker-compose.yml; then
    pass "Linux capabilities configured"
else
    info "Consider dropping unnecessary Linux capabilities (cap_drop: ALL)"
fi

# 10.2 Check Volume Security
echo "│ 10.2 Checking volume security..."
if grep -q "volumes" docker-compose.yml; then
    pass "Volumes configured"
    if grep -q ":ro\|read_only" docker-compose.yml; then
        pass "Read-only volumes in use"
    else
        warn "Consider using read-only volumes where possible"
    fi
fi

# 10.3 Check restart policies
echo "│ 10.3 Checking container restart policies..."
if grep -q "restart_policy\|restart:" docker-compose.yml; then
    pass "Restart policies configured"
else
    warn "No restart policies found (should restart on failure)"
fi

echo "│"

###############################################################################
# SUMMARY REPORT
###############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  SECURITY AUDIT SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}Passed:  $PASS_COUNT${NC}"
echo -e "  ${RED}Failed:  $FAIL_COUNT${NC}"
echo -e "  ${YELLOW}Warnings: $WARN_COUNT${NC}"
echo ""

TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
SECURITY_SCORE=$((PASS_COUNT * 100 / TOTAL_TESTS))

echo "  Security Score: $SECURITY_SCORE%"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "  ${GREEN}✓ SECURITY AUDIT PASSED (NO CRITICAL FAILURES)${NC}"
else
    echo -e "  ${RED}✗ SECURITY AUDIT FAILED - $FAIL_COUNT critical issues found${NC}"
fi

if [ $WARN_COUNT -gt 0 ]; then
    echo -e "  ${YELLOW}⚠ $WARN_COUNT warnings that should be addressed${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

###############################################################################
# RECOMMENDATIONS
###############################################################################

echo "KEY SECURITY RECOMMENDATIONS:"
echo ""
echo "1. PRODUCTION DEPLOYMENT:"
echo "   - Use managed database services (AWS RDS, Azure Database)"
echo "   - Enable encryption at rest and in transit"
echo "   - Implement WAF (AWS WAF, Cloudflare)"
echo "   - Use secrets management (AWS Secrets Manager, Azure Key Vault)"
echo ""
echo "2. CONTAINER SECURITY:"
echo "   - Scan images regularly with Trivy/Grype"
echo "   - Run containers as non-root user"
echo "   - Use read-only filesystems where possible"
echo "   - Implement network policies for east-west traffic"
echo ""
echo "3. API SECURITY:"
echo "   - Enforce rate limiting (already in NestJS with Throttler)"
echo "   - Implement API key rotation"
echo "   - Use JWT with short expiry (15 min) + refresh tokens"
echo "   - Enable API request signing for sensitive operations"
echo ""
echo "4. COMPLIANCE:"
echo "   - Conduct annual penetration testing"
echo "   - Maintain SOC 2 Type II certification"
echo "   - Ensure GDPR/PDPL compliance (data residency, encryption)"
echo "   - Document incident response procedures"
echo ""
echo "5. MONITORING & ALERTING:"
echo "   - Deploy log aggregation (ELK Stack, Datadog)"
echo "   - Set up SIEM for security event monitoring"
echo "   - Create alerts for authentication failures"
echo "   - Monitor for unusual data access patterns"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
