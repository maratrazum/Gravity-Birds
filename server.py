from __future__ import annotations

import os
import socket
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path


WEB_ROOT = Path(__file__).resolve().parent / "web"
HOST = os.environ.get("GRAVITY_BIRDS_HOST", "0.0.0.0")
PORT = int(os.environ.get("GRAVITY_BIRDS_PORT", "8016"))


class WebHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)


def get_lan_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), WebHandler)
    lan_ip = get_lan_ip()
    print("Gravity Birds web server is running.")
    print(f"Local:   http://127.0.0.1:{PORT}")
    if HOST == "0.0.0.0":
        print(f"Wi-Fi:   http://{lan_ip}:{PORT}")
        print("Open the Wi-Fi link on other devices in the same local network.")
    else:
        print(f"Host:    http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
