import sys
import json
import argparse


# respond to discovery requests immediately and exit 0
if '--list-functions' in sys.argv:
    print(json.dumps([
        "Power On",
        "Power Off",
        "Volume Up",
        "Volume Down",
        "Status",
        "Reset"
    ]))
    sys.exit(0)

# Map actions to Samsung remote keys
ACTION_KEY_MAP = {
    "Volume Up": "KEY_VOLUP",
    "Volume Down": "KEY_VOLDOWN",
    "Power On": "KEY_POWER",
    "Power Off": "KEY_POWER",  # many Samsung TVs toggle power with same key
    "Status": None,
    "Reset": None
}

import websocket
from websocket import WebSocketException


def send_key(ip, key, port=8001, timeout=5):
    """
    Send a Samsung TV remote key via websocket.
    Returns dict with result or error.
    """
    url = f"ws://{ip}:{port}/api/v2/channels/samsung.remote.control?name=TVController"
    payload = {
        "method": "ms.remote.control",
        "params": {
            "Cmd": "Click",
            "DataOfCmd": key,
            "Option": "false",
            "TypeOfRemote": "SendRemoteKey"
        }
    }
    ws = None
    try:
        ws = websocket.create_connection(url, timeout=timeout)
        ws.send(json.dumps(payload))
        # No formal response expected for many TVs; return success
        return {"ok": True, "sent": key}
    except (WebSocketException, OSError) as e:
        return {"ok": False, "error": str(e)}
    finally:
        try:
            if ws:
                ws.close()
        except Exception:
            pass

def perform_action(ip, action, port=8001, timeout=5):
    """
    Perform an action. For Status/Reset return not-implemented placeholder.
    """
    key = ACTION_KEY_MAP.get(action)
    if key:
        return send_key(ip, key, port=port, timeout=timeout)
    if action == "Status":
        # Implement status retrieval if device exposes an API; placeholder:
        return {"ok": False, "error": "Status not implemented for Samsung via websocket"}
    if action == "Reset":
        # Reset may not be supported; placeholder
        return {"ok": False, "error": "Reset not implemented"}
    return {"ok": False, "error": "Unknown action"}

def parse_args(argv):
    p = argparse.ArgumentParser(description="Sony / Samsung display control")
    p.add_argument('--ip', required=True, help="Device IP address")
    p.add_argument('--action', required=True, choices=AVAILABLE_ACTIONS, help="Action to perform")
    p.add_argument('--port', type=int, default=8001, help="Websocket port (default 8001)")
    p.add_argument('--timeout', type=float, default=5.0, help="Connection timeout seconds")
    return p.parse_args(argv)

if __name__ == "__main__":
    args = parse_args(sys.argv[1:])
    res = perform_action(args.ip, args.action, port=args.port, timeout=args.timeout)
    # Print machine-readable JSON for backend to parse
    print(json.dumps(res))
    # exit code 0 even on logical failure (backend reads JSON)
    sys.exit(0)





