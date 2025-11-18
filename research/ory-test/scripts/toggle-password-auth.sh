#!/bin/bash

# Ory Password Authentication Toggle
# This script enables or disables password authentication

set -e

PROJECT_ID="e3705db5-5626-4ab2-9590-9329be6d014a"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Password Authentication Toggle       ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if ory CLI is installed
if ! command -v ory &> /dev/null; then
    echo -e "${RED}✗ Ory CLI is not installed${NC}"
    echo -e "${YELLOW}Install it with: brew install ory/tap/cli${NC}"
    exit 1
fi

# Check if user is authenticated
if ! ory get identity-config --project "$PROJECT_ID" --format json &> /dev/null; then
    echo -e "${RED}✗ Not authenticated with Ory or project not found${NC}"
    echo -e "${YELLOW}Run: ory auth${NC}"
    exit 1
fi

# Get current configuration
echo -e "${BLUE}Fetching current configuration...${NC}"
CURRENT_CONFIG=$(ory get identity-config --project "$PROJECT_ID" --format json 2>/dev/null)
PASSWORD_ENABLED=$(echo "$CURRENT_CONFIG" | jq -r '.selfservice.methods.password.enabled')
PASSKEY_ENABLED=$(echo "$CURRENT_CONFIG" | jq -r '.selfservice.methods.passkey.enabled')

echo ""
echo -e "${YELLOW}Current Configuration:${NC}"
echo -e "  Password Auth:  ${PASSWORD_ENABLED}"
echo -e "  Passkey Auth:   ${PASSKEY_ENABLED}"
echo ""

# Determine action
if [ "$PASSWORD_ENABLED" == "true" ]; then
    ACTION="disable"
    NEW_STATE="false"
    ACTION_TEXT="Disable"
else
    ACTION="enable"
    NEW_STATE="true"
    ACTION_TEXT="Enable"
fi

echo -e "${YELLOW}${ACTION_TEXT} password authentication?${NC}"
echo ""

# Warning if disabling password with no passkey
if [ "$ACTION" == "disable" ] && [ "$PASSKEY_ENABLED" != "true" ]; then
    echo -e "${RED}⚠  WARNING: Passkeys are not enabled!${NC}"
    echo -e "${RED}   Disabling password auth without another method will lock users out.${NC}"
    echo ""
fi

# Confirmation prompt
read -p "${ACTION_TEXT} password authentication? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Updating password authentication...${NC}"

# Update the configuration
ory patch identity-config --project "$PROJECT_ID" \
  --replace "/selfservice/methods/password/enabled=$NEW_STATE" \
  --quiet --yes > /dev/null 2>&1

echo -e "${GREEN}✓ Configuration updated successfully!${NC}"
echo ""

# Verify the update
NEW_CONFIG=$(ory get identity-config --project "$PROJECT_ID" --format json 2>/dev/null)
UPDATED_PASSWORD=$(echo "$NEW_CONFIG" | jq -r '.selfservice.methods.password.enabled')

echo -e "${GREEN}New Configuration:${NC}"
echo -e "  Password Auth:  ${UPDATED_PASSWORD}"
echo ""

if [ "$UPDATED_PASSWORD" == "false" ]; then
    echo -e "${BLUE}ℹ  Password authentication is now disabled${NC}"
    echo -e "${GREEN}✓ Users can only authenticate with passkeys${NC}"
    if [ "$PASSKEY_ENABLED" == "true" ]; then
        echo -e "${GREEN}✓ Passkeys are enabled${NC}"
    else
        echo -e "${RED}⚠  WARNING: No authentication methods are enabled!${NC}"
    fi
else
    echo -e "${BLUE}ℹ  Password authentication is now enabled${NC}"
    echo -e "${YELLOW}⚠  Users can authenticate with both passwords and passkeys${NC}"
fi

echo ""
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
