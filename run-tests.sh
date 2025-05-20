#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running StoryTeller Tests${NC}"
echo "=============================="

# Run backend tests
echo -e "\n${YELLOW}Running Backend Tests...${NC}"
echo "------------------------------"
docker-compose exec backend pytest -v
BACKEND_EXIT_CODE=$?

if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✓ Backend tests passed!${NC}"
    BACKEND_SUCCESS=true
else
    echo -e "\n${RED}✗ Backend tests failed!${NC}"
    BACKEND_SUCCESS=false
fi

# Run frontend tests
echo -e "\n${YELLOW}Running Frontend Tests...${NC}"
echo "------------------------------"
docker-compose exec frontend npm test
FRONTEND_EXIT_CODE=$?

if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✓ Frontend tests passed!${NC}"
    FRONTEND_SUCCESS=true
else
    echo -e "\n${RED}✗ Frontend tests failed!${NC}"
    FRONTEND_SUCCESS=false
fi

# Summary
echo -e "\n${YELLOW}Test Summary:${NC}"
echo "=============================="
if [ "$BACKEND_SUCCESS" = true ]; then
    echo -e "${GREEN}✓ Backend: PASSED${NC}"
else
    echo -e "${RED}✗ Backend: FAILED${NC}"
fi

if [ "$FRONTEND_SUCCESS" = true ]; then
    echo -e "${GREEN}✓ Frontend: PASSED${NC}"
else
    echo -e "${RED}✗ Frontend: FAILED${NC}"
fi

# Exit with error if any tests failed
if [ "$BACKEND_SUCCESS" = true ] && [ "$FRONTEND_SUCCESS" = true ]; then
    echo -e "\n${GREEN}All tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
fi
