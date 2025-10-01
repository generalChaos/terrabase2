#!/usr/bin/env python3
"""
Ultra-minimal test server using only Python standard library
"""
import os
import http.server
import socketserver
import json
import sys

class HealthHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Override to add custom logging"""
        print(f"[{self.address_string()}] {format % args}")
    
    def do_GET(self):
        print(f"Received GET request for path: {self.path}")
        if self.path == '/health':
            print("Handling /health endpoint")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "healthy", "message": "Test server is running"}
            self.wfile.write(json.dumps(response).encode())
            print("Health check response sent")
        elif self.path == '/':
            print("Handling / endpoint")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"message": "Image Processor Test Server", "status": "running"}
            self.wfile.write(json.dumps(response).encode())
            print("Root response sent")
        else:
            print(f"404 for path: {self.path}")
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    try:
        port = int(os.getenv("PORT", 8000))
        print(f"Starting server on port {port}")
        print(f"Environment PORT: {os.getenv('PORT', 'not set')}")
        
        with socketserver.TCPServer(("0.0.0.0", port), HealthHandler) as httpd:
            print(f"Server successfully started on 0.0.0.0:{port}")
            print("Waiting for requests...")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)
