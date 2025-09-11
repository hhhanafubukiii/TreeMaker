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
            self.send_header('Access-Control-Allow-Origin', '*')  # Разрешаем все домены
            self.end_headers()
            
            # Правильное формирование JSON
            response_data = {"key": API_KEY}
            response_json = json.dumps(response_data)
            self.wfile.write(response_json.encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')  # Добавляем CORS даже для 404
            self.end_headers()
    
    # Обработка CORS preflight запросов (OPTIONS)
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def start_server():
    server = HTTPServer(("localhost", 8080), KeyHandler)  # Изменен порт на 8080
    print("Starting server on http://localhost:8080")
    server.serve_forever()

if __name__ == "__main__":
    start_server()