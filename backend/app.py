import os
import json
import urllib.request
import urllib.error

from dotenv import load_dotenv
from http.server import HTTPServer, BaseHTTPRequestHandler

load_dotenv()

API_KEY = os.getenv("GIGACHAT_API_KEY") 
BACKEND_URL = os.getenv("BACKEND_URL")
MODEL = os.genenv("MODEL")

class Handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-type", content_type)
        self.send_header("Access-Control-Allow-Origin", 'https://hhhanafubukiii.github.io/TreeMaker/')
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_POST(self):
        if self.path == "/api/chat":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            client_data = json.loads(post_data)
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            }

            gigachat_payload = {
                "model": MODEL,
                "messages": client_data.get("messages", []),
                "temperature": 0,
                "response_format": client_data.get("response_format")
            }

            try:
                req = urllib.request.Request(
                    BACKEND_URL, 
                    data=json.dumps(gigachat_payload).encode('utf-8'), 
                    headers=headers, 
                    method="POST"
                )
                
                with urllib.request.urlopen(req) as response:
                    response_body = response.read()
                    self._set_headers(200)
                    self.wfile.write(response_body)

            except urllib.error.HTTPError as e:
                err_msg = e.read()
                print(f"GigaChat Error: {err_msg}")
                self._set_headers(e.code)
                self.wfile.write(err_msg)
            except Exception as e:
                print(f"Server Error: {e}")
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self._set_headers(404)

def start_server():
    server = HTTPServer(("0.0.0.0", 8080), Handler)
    print("Starting server on http://0.0.0.0:8080")
    server.serve_forever()

if __name__ == "__main__":
    start_server()
