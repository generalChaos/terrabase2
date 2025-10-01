#!/usr/bin/env python3
"""
Ultra-minimal test server using only Python standard library
"""
import os
import http.server
import socketserver
import json

class HealthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "healthy", "message": "Test server is running"}
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"message": "Image Processor Test Server", "status": "running"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    with socketserver.TCPServer(("", port), HealthHandler) as httpd:
        print(f"Server running on port {port}")
        httpd.serve_forever()
