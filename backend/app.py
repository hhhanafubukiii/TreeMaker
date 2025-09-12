import os
import json

from dotenv import load_dotenv
from http.server import HTTPServer, BaseHTTPRequestHandler

load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")

class Handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS, POST")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/key":
            self._set_headers()
            response_data = {"key": API_KEY}
            self.wfile.write(json.dumps(response_data).encode("utf-8"))
        else:
            self._set_headers(status=404)

    def do_OPTIONS(self):
        self._set_headers()

def start_server():
    server = HTTPServer(("0.0.0.0", 8080), Handler)
    print("Starting server on http://0.0.0.0:8080")
    server.serve_forever()

if __name__ == "__main__":
    start_server()
