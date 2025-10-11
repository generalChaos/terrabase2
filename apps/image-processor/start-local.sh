#!/bin/bash

# Load environment variables from local.env (skip comments and empty lines)
set -a
source <(grep -v '^#' local.env | grep -v '^$' | sed 's/^/export /')
set +a

# Start the service
source venv/bin/activate
PYTHONPATH=/Users/ricovelasco/Documents/devprojects/party-game/apps/image-processor python src/main.py
