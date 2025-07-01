#!/bin/bash
#
# Enhanced health check script for CI/CD pipelines
# This script provides robust health checking with detailed diagnostics
# and improved error handling for Docker containers.
#

set -e # Exit immediately if a command exits with a non-zero status.
set -o pipefail # Return the exit status of the last command in the pipe that failed.

# Configuration
readonly CONTAINER_NAME="promptlab"
readonly MAX_ATTEMPTS=40
readonly INITIAL_WAIT=5
readonly ATTEMPT_INTERVAL=2
readonly ENDPOINT_TIMEOUT=5

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Health check functions
check_container_exists() {
    if ! docker ps -a --filter "name=${CONTAINER_NAME}" --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container '${CONTAINER_NAME}' not found"
        return 1
    fi
    return 0
}

check_container_running() {
    local status=$(docker ps --filter "name=${CONTAINER_NAME}" --format '{{.Status}}' 2>/dev/null || echo "not found")
    if [[ ! "$status" =~ "Up" ]]; then
        log_error "Container not running (status: $status)"
        return 1
    fi
    log_info "Container is running (status: $status)"
    return 0
}

check_docker_health() {
    local health_status=$(docker inspect --format='{{.State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo "unknown")
    case "$health_status" in
        "healthy")
            log_success "Docker health check reports: healthy"
            return 0
            ;;
        "unhealthy")
            log_error "Docker health check reports: unhealthy"
            return 1
            ;;
        "starting")
            log_info "Docker health check reports: starting"
            return 2
            ;;
        *)
            log_warning "Docker health check reports: $health_status"
            return 2
            ;;
    esac
}

check_endpoint() {
    local endpoint="$1"
    local timeout="${2:-$ENDPOINT_TIMEOUT}"
    
    if curl -sf -m "$timeout" "http://localhost:3000${endpoint}" >/dev/null 2>&1; then
        log_success "Endpoint '${endpoint}' is responding"
        return 0
    else
        log_warning "Endpoint '${endpoint}' is not responding"
        return 1
    fi
}

show_container_logs() {
    local lines="${1:-20}"
    log_info "Recent container logs (last $lines lines):"
    echo "----------------------------------------"
    docker logs --tail "$lines" "${CONTAINER_NAME}" 2>&1 || log_warning "Could not retrieve logs"
    echo "----------------------------------------"
}

show_container_stats() {
    log_info "Container resource usage:"
    docker stats "${CONTAINER_NAME}" --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || log_warning "Could not retrieve stats"
}

show_port_status() {
    log_info "Port 3000 status:"
    netstat -tlnp 2>/dev/null | grep :3000 || log_warning "Port 3000 not in use"
}

# Main health check logic
main() {
    log_info "Starting enhanced health check for container '${CONTAINER_NAME}'..."
    
    # Initial checks
    if ! check_container_exists; then
        exit 1
    fi
    
    log_info "Waiting ${INITIAL_WAIT} seconds for container initialization..."
    sleep "$INITIAL_WAIT"
    
    # Main health check loop
    for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
        log_info "Health check attempt $attempt/$MAX_ATTEMPTS..."
        
        # Check if container is still running
        if ! check_container_running; then
            show_container_logs 50
            exit 1
        fi
        
        # Check Docker's built-in health status
        health_result=$(check_docker_health; echo $?)
        if [ "$health_result" -eq 0 ]; then
            log_success "Docker health check passed!"
            break
        elif [ "$health_result" -eq 1 ]; then
            log_error "Docker health check failed!"
            show_container_logs 30
            exit 1
        fi
        # health_result == 2 means "starting" or "unknown", continue checking
        
        # Manual endpoint verification
        if check_endpoint "/health/ready" 3; then
            log_success "Ready endpoint is responding!"
            
            # Verify other critical endpoints
            if check_endpoint "/health" 3; then
                log_success "Main health endpoint is also responding!"
            else
                log_warning "Main health endpoint not responding, but ready endpoint works"
            fi
            
            # Test basic API functionality
            if check_endpoint "/jobs" 3; then
                log_success "Jobs API endpoint is responding!"
            else
                log_warning "Jobs API endpoint not responding"
            fi
            
            log_success "All critical health checks passed!"
            show_container_stats
            exit 0
        fi
        
        # Show diagnostic information periodically
        if [ $((attempt % 5)) -eq 0 ]; then
            show_container_logs 10
            show_port_status
        fi
        
        # Don't sleep on the last attempt
        if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
            sleep "$ATTEMPT_INTERVAL"
        fi
    done
    
    # Health check failed
    log_error "Health check failed after $MAX_ATTEMPTS attempts (${MAX_ATTEMPTS}0 seconds)"
    log_error "Performing final diagnostics..."
    
    show_container_logs 50
    show_container_stats
    show_port_status
    
    log_info "Container inspection:"
    docker inspect "${CONTAINER_NAME}" | jq '.[] | {
        State: .State,
        Config: {
            Env: .Config.Env,
            ExposedPorts: .Config.ExposedPorts
        },
        NetworkSettings: {
            Ports: .NetworkSettings.Ports
        }
    }' 2>/dev/null || docker inspect "${CONTAINER_NAME}"
    
    exit 1
}

# Run the health check
main "$@"
