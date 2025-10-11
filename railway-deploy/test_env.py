#!/usr/bin/env python3
"""
Test environment variables and exit
"""
import os
import sys

print("=== ENVIRONMENT TEST ===")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"Files in current dir: {os.listdir('.')}")

print("\n=== ENVIRONMENT VARIABLES ===")
env_vars = [
    'PORT', 'NODE_ENV', 'PYTHONPATH', 'STORAGE_TYPE', 'SUPABASE_ENABLED',
    'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'
]

for var in env_vars:
    value = os.getenv(var, 'NOT SET')
    print(f"{var}={value}")

print("\n=== TESTING IMPORTS ===")
try:
    from fastapi import FastAPI
    print("✓ FastAPI import successful")
except Exception as e:
    print(f"✗ FastAPI import failed: {e}")

try:
    import uvicorn
    print("✓ uvicorn import successful")
except Exception as e:
    print(f"✗ uvicorn import failed: {e}")

print("\n=== TESTING SAFE MAIN ===")
try:
    from src.main_safe import app
    print("✓ main_safe import successful")
except Exception as e:
    print(f"✗ main_safe import failed: {e}")

print("\n=== TESTING OLD MAIN ===")
try:
    from src.main import app
    print("✓ main import successful")
except Exception as e:
    print(f"✗ main import failed: {e}")

print("\n=== TEST COMPLETE ===")
