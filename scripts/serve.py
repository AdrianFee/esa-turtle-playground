#!/usr/bin/env python3
"""Serve the playground on http://localhost:8008 and open it in a browser.

Usage:  python3 scripts/serve.py [port]
"""
import http.server
import os
import socketserver
import sys
import threading
import webbrowser

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8008
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        # Pyodide and the worker need correct types; also avoid stale caches in class.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # keep the terminal quiet


Handler.extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript", ".js": "text/javascript"})


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with Server(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/"
        print(f"ESA Turtle Playground running at {url}")
        print("Press Ctrl+C to stop.")
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
