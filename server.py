from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import urllib.error
import urllib.request


CONFIG_PATH = os.path.join(os.path.dirname(__file__), "backend-config.json")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class InterviewPilotHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/ai":
            self.send_error(404, "Not found")
            return

        try:
            body = self._read_json_body()
            config = load_config()
            api_key = config.get("openrouter_api_key") or os.environ.get("OPENROUTER_API_KEY")
            model = config.get("openrouter_model") or os.environ.get("OPENROUTER_MODEL")

            if not api_key or api_key == "PASTE_YOUR_OPENROUTER_KEY_HERE":
                self._send_json({"error": {"message": "Missing OpenRouter API key in backend-config.json."}}, 400)
                return
            if not model:
                self._send_json({"error": {"message": "Missing OpenRouter model in backend-config.json."}}, 400)
                return

            body["model"] = model
            body["response_format"] = {"type": "json_object"}
            payload = self._send_openrouter_request(body, api_key)
            self._send_raw_json(payload)
        except urllib.error.HTTPError as error:
            payload = error.read() or json.dumps({
                "error": {"message": f"OpenRouter request failed with status {error.code}."}
            }).encode("utf-8")
            self._send_raw_json(payload, error.code)
        except Exception as error:
            self._send_json({"error": {"message": str(error)}}, 500)

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _send_openrouter_request(self, body, api_key):
        request = urllib.request.Request(
            OPENROUTER_URL,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "http://localhost:8080",
                "X-Title": "InterviewPilot AI",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=90) as response:
            return response.read()

    def _send_json(self, payload, status=200):
        self._send_raw_json(json.dumps(payload).encode("utf-8"), status)

    def _send_raw_json(self, payload, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def load_config():
    if not os.path.exists(CONFIG_PATH):
        return {}
    with open(CONFIG_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("localhost", 8080), InterviewPilotHandler)
    print("InterviewPilot AI running at http://localhost:8080")
    server.serve_forever()
