#!/bin/bash

# Load environment variables from local.env (skip comments and empty lines)
export $(grep -v '^#' local.env | grep -v '^$' | xargs)

# Start the service
source venv/bin/activate
PYTHONPATH=/Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor python src/main.py
