import os
import json

from dotenv import load_dotenv
from http.server import HTTPServer, BaseHTTPRequestHandler

load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")

class KeyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/key":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = {"key": API_KEY}
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning')
        self.end_headers()

def start_server():
    server = HTTPServer(("0.0.0.0", 8080), KeyHandler)
    print("Starting server on http://0.0.0.0:8080")
    server.serve_forever()

if __name__ == "__main__":
    start_server()
