#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import re
import urllib.request


class Handler(SimpleHTTPRequestHandler):
  def do_GET(self):
    if self.path == "/api/growtopia-status":
      self.handle_status()
      return
    return super().do_GET()

  def handle_status(self):
    try:
      req = urllib.request.Request(
        "https://www.growtopiagame.com/detail",
        headers={"User-Agent": "Mozilla/5.0"},
      )
      with urllib.request.urlopen(req, timeout=12) as resp:
        payload = json.loads(resp.read().decode("utf-8", errors="ignore"))

      online_user = str(payload.get("online_user", "--"))
      online_digits = re.sub(r"[^0-9]", "", online_user)
      players = online_digits if online_digits else "--"
      is_up = players != "--" and int(players) > 0

      payload = {
        "ok": True,
        "isUp": is_up,
        "players": players,
      }
      data = json.dumps(payload).encode("utf-8")
      self.send_response(200)
      self.send_header("Content-Type", "application/json")
      self.send_header("Cache-Control", "no-store")
      self.send_header("Content-Length", str(len(data)))
      self.end_headers()
      self.wfile.write(data)
    except Exception:
      payload = {"ok": False, "isUp": False, "players": "--"}
      data = json.dumps(payload).encode("utf-8")
      self.send_response(200)
      self.send_header("Content-Type", "application/json")
      self.send_header("Content-Length", str(len(data)))
      self.end_headers()
      self.wfile.write(data)


if __name__ == "__main__":
  server = HTTPServer(("127.0.0.1", 8080), Handler)
  print("Serving on http://127.0.0.1:8080")
  server.serve_forever()
