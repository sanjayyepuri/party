#!/bin/bash

# Ory Passkey Environment Switcher
# This script toggles passkey configuration between local development and production

set -e

PROJECT_ID="e3705db5-5626-4ab2-9590-9329be6d014a"
DISPLAY_NAME="sanjay.party"
PROD_DOMAIN="crazy-chatelet-dfzw3l7h98.projects.oryapis.com"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Ory Passkey Environment Switcher     ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if ory CLI is installed
if ! command -v ory &> /dev/null; then
    echo -e "${RED}✗ Ory CLI is not installed${NC}"
    echo -e "${YELLOW}Install it with: brew install ory/tap/cli${NC}"
    exit 1
fi

# Check if user is authenticated by trying to get the config
if ! ory get identity-config --project "$PROJECT_ID" --format json &> /dev/null; then
    echo -e "${RED}✗ Not authenticated with Ory or project not found${NC}"
    echo -e "${YELLOW}Run: ory auth${NC}"
    exit 1
fi

# Get current configuration
echo -e "${BLUE}Fetching current configuration...${NC}"
CURRENT_CONFIG=$(ory get identity-config --project "$PROJECT_ID" --format json 2>/dev/null)
CURRENT_RP_ID=$(echo "$CURRENT_CONFIG" | jq -r '.selfservice.methods.passkey.config.rp.id')
CURRENT_ORIGINS=$(echo "$CURRENT_CONFIG" | jq -r '.selfservice.methods.passkey.config.rp.origins[0]')

echo ""
echo -e "${YELLOW}Current Configuration:${NC}"
echo -e "  RP ID:     ${CURRENT_RP_ID}"
echo -e "  Origin:    ${CURRENT_ORIGINS}"
echo ""

# Determine current environment and target
if [ "$CURRENT_RP_ID" == "localhost" ]; then
    CURRENT_ENV="development"
    TARGET_ENV="production"
    NEW_RP_ID="$PROD_DOMAIN"
    NEW_ORIGINS="[\"https://$PROD_DOMAIN\"]"
else
    CURRENT_ENV="production"
    TARGET_ENV="development"
    NEW_RP_ID="localhost"
    NEW_ORIGINS="[\"http://localhost:3000\"]"
fi

echo -e "${YELLOW}Current Environment: ${CURRENT_ENV}${NC}"
echo -e "${GREEN}Target Environment:  ${TARGET_ENV}${NC}"
echo ""

# Confirmation prompt
read -p "Switch to ${TARGET_ENV} configuration? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Updating passkey configuration...${NC}"

# Update the configuration
ory patch identity-config --project "$PROJECT_ID" \
  --replace "/selfservice/methods/passkey/config/rp/id=\"$NEW_RP_ID\"" \
  --replace "/selfservice/methods/passkey/config/rp/origins=$NEW_ORIGINS" \
  --quiet --yes > /dev/null 2>&1

echo -e "${GREEN}✓ Configuration updated successfully!${NC}"
echo ""

# Verify the update
NEW_CONFIG=$(ory get identity-config --project "$PROJECT_ID" --format json 2>/dev/null)
UPDATED_RP_ID=$(echo "$NEW_CONFIG" | jq -r '.selfservice.methods.passkey.config.rp.id')
UPDATED_ORIGINS=$(echo "$NEW_CONFIG" | jq -r '.selfservice.methods.passkey.config.rp.origins[0]')

echo -e "${GREEN}New Configuration:${NC}"
echo -e "  RP ID:     ${UPDATED_RP_ID}"
echo -e "  Origin:    ${UPDATED_ORIGINS}"
echo ""

if [ "$TARGET_ENV" == "development" ]; then
    echo -e "${BLUE}ℹ  You can now test passkeys at http://localhost:3000${NC}"
    echo -e "${YELLOW}⚠  Remember to switch back to production before deploying!${NC}"
else
    echo -e "${BLUE}ℹ  Passkeys are now configured for production${NC}"
    echo -e "${GREEN}✓ Safe to deploy to ${PROD_DOMAIN}${NC}"
fi

echo ""
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
