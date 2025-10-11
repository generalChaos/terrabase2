#!/usr/bin/env python3
"""
Ultra-minimal health check server for Railway testing
"""
import os
import http.server
import socketserver
import json
from datetime import datetime

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
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "status": "healthy", 
                "service": "image-processor",
                "version": "1.0.0",
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
            print("Health check response sent")
            
        elif self.path == '/':
            print("Handling / endpoint")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "service": "Image Processor Test Server", 
                "status": "running",
                "version": "1.0.0"
            }
            self.wfile.write(json.dumps(response).encode())
            print("Root response sent")
            
        else:
            print(f"404 for path: {self.path}")
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"error": "Not found", "path": self.path}
            self.wfile.write(json.dumps(response).encode())

if __name__ == "__main__":
    try:
        port = int(os.getenv("PORT", 8000))
        host = "0.0.0.0"
        
        print(f"Starting health check server on {host}:{port}")
        
        with socketserver.TCPServer((host, port), HealthHandler) as httpd:
            print(f"Server running on {host}:{port}")
            print(f"Health check available at: http://{host}:{port}/health")
            httpd.serve_forever()
            
    except Exception as e:
        print(f"Error starting server: {e}")
        exit(1)
