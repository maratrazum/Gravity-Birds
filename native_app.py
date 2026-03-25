from __future__ import annotations

import socket
import threading
import time

from http.server import ThreadingHTTPServer

import webview

from server import HOST, PORT, WEB_ROOT, WebHandler


def wait_for_server(host: str, port: int, timeout: float = 5.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=0.25):
                return
        except OSError:
            time.sleep(0.05)
    raise RuntimeError(f"Server did not start on http://{host}:{port}")


def run_server() -> ThreadingHTTPServer | None:
    try:
        server = ThreadingHTTPServer((HOST, PORT), WebHandler)
    except OSError:
        wait_for_server(HOST, PORT)
        return None

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    wait_for_server(HOST, PORT)
    return server


def main() -> None:
    if not WEB_ROOT.exists():
        raise FileNotFoundError(f"Missing web root: {WEB_ROOT}")

    server = run_server()
    try:
        webview.create_window(
            "Gravity Birds 1366x768",
            f"http://{HOST}:{PORT}/",
            width=1366,
            height=768,
            min_size=(1024, 576),
            resizable=True,
            text_select=False,
            zoomable=False,
        )
        webview.start(debug=False)
    finally:
        if server is not None:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
