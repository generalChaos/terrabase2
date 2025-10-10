#!/usr/bin/env python3
"""
Debug startup script to test if Railway can run Python at all
"""
import os
import sys
import time

print("=== RAILWAY DEBUG STARTUP ===")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Environment variables:")
for key, value in os.environ.items():
    if key in ['PORT', 'NODE_ENV', 'PYTHONPATH', 'PATH']:
        print(f"  {key}={value}")

print(f"PORT environment variable: {os.getenv('PORT', 'NOT SET')}")
print("=== STARTING SIMPLE HTTP SERVER ===")

try:
    import http.server
    import socketserver
    import json
    from datetime import datetime
    
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"
    
    print(f"Attempting to start server on {host}:{port}")
    
    class SimpleHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            print(f"Received request: {self.path}")
            if self.path == '/health':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"status": "healthy", "debug": "working"}
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b"Railway debug server is running")
        
        def log_message(self, format, *args):
            print(f"[{self.address_string()}] {format % args}")
    
    with socketserver.TCPServer((host, port), SimpleHandler) as httpd:
        print(f"Server started successfully on {host}:{port}")
        print("Health check available at: /health")
        httpd.serve_forever()
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
