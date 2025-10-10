import sys
import json
import argparse
import asyncio
import requests
import urllib3

# Disable insecure request warnings for self-signed certs (used when verify=False)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Default PSK
DEFAULT_PSK = "1234"

# List available actions
AVAILABLE_ACTIONS = [
    "Power On",
    "Power Off",
    "Volume Up",
    "Volume Down",
    "Status",
    "Reset"
]

# Early check for --list-functions
if '--list-functions' in sys.argv:
    print(json.dumps(AVAILABLE_ACTIONS))
    sys.exit(0)

# Argument parsing
parser = argparse.ArgumentParser(description="Sony TV Control Script")
parser.add_argument('--ip', required=True, help='IP address of the TV')
parser.add_argument('--action', required=True, choices=AVAILABLE_ACTIONS, help='Action to perform')
parser.add_argument('--psk', default=DEFAULT_PSK, help='Pre-Shared Key for authentication')
args = parser.parse_args()

# Core volume control function
def set_audio_volume(ip, volume_change, psk=DEFAULT_PSK):
    """
    Send a setAudioVolume RPC to the Sony device.
    volume_change should be a string like "+1" or "-1".
    """
    url = f"http://{ip}/sony/audio"
    headers = {
        "Accept": "*/*",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        "Connection": "keep-alive",
        "Content-Type": "text/plain;charset=UTF-8",
        "Origin": "null",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
        "X-Auth-PSK": str(psk)
    }
    payload = {
        "method": "setAudioVolume",
        "version": "1.0",
        "id": 1,
        "params": [
            {
                "target": "speaker",
                "volume": volume_change
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=payload, verify=False, timeout=5)
        # If the device returns JSON, parse it; otherwise return raw text
        try:
            data = response.json()
        except ValueError:
            data = {"status_code": response.status_code, "text": response.text}
        print("API response:", data)
        return data
    except requests.exceptions.RequestException as e:
        print("HTTP Error:", e)
        return {"error": str(e)}

# Async wrappers that call the functional implementation
async def volume_up(ip, psk=DEFAULT_PSK):
    return set_audio_volume(ip, "+5", psk)

async def volume_down(ip, psk=DEFAULT_PSK):
    return set_audio_volume(ip, "-5", psk)

# Core helper to send JSON-RPC style requests to Sony endpoints
def _send_rpc(ip, endpoint, method, params, psk=DEFAULT_PSK, timeout=5):
    url = f"http://{ip}{endpoint}"
    headers = {
        "Accept": "*/*",
        "Content-Type": "text/plain;charset=UTF-8",
        "Origin": "null",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "X-Auth-PSK": str(psk)
    }
    payload = {
        "method": method,
        "version": "1.0",
        "id": 1,
        "params": params
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, verify=False, timeout=timeout)
        try:
            return {"status_code": resp.status_code, "data": resp.json()}
        except ValueError:
            return {"status_code": resp.status_code, "text": resp.text}
    except requests.RequestException as e:
        return {"error": str(e)}

# Implement power on/off using RPC attempts; use asyncio.to_thread to avoid blocking
async def power_on(ip, psk=DEFAULT_PSK):
    """
    Attempts common Sony endpoints to power the display on.
    Returns the first successful response or aggregated errors.
    """
    # Try known/system endpoints and method names
    attempts = [
        ("/sony/system", "setPowerStatus", [{"status": True}]),
        ("/sony/system", "setPower", [{"power": "on"}]),
        ("/sony/power", "setPowerStatus", [{"status": True}]),
    ]
    errors = []
    for endpoint, method, params in attempts:
        result = await asyncio.to_thread(_send_rpc, ip, endpoint, method, params, psk)
        if result and ("error" not in result) and result.get("status_code", 0) in (200, 201):
            print("Power On response:", result)
            return result
        errors.append({ "endpoint": endpoint, "method": method, "result": result })
    # fallback: no successful attempt
    print("Power On failed attempts:", errors)
    return {"error": "Power On failed", "details": errors}

async def power_off(ip, psk=DEFAULT_PSK):
    """
    Attempts common Sony endpoints to power the display off.
    Returns the first successful response or aggregated errors.
    """
    attempts = [
        ("/sony/system", "setPowerStatus", [{"status": False}]),
        ("/sony/system", "setPower", [{"power": "off"}]),
        ("/sony/power", "setPowerStatus", [{"status": False}]),
    ]
    errors = []
    for endpoint, method, params in attempts:
        result = await asyncio.to_thread(_send_rpc, ip, endpoint, method, params, psk)
        if result and ("error" not in result) and result.get("status_code", 0) in (200, 201):
            print("Power Off response:", result)
            return result
        errors.append({ "endpoint": endpoint, "method": method, "result": result })
    print("Power Off failed attempts:", errors)
    return {"error": "Power Off failed", "details": errors}

# Power / status / reset implemented as safe no-throw handlers.
# If you know the exact endpoints for these on your Sony device, replace the body with real API calls.
def _safe_noop(message, ip):
    print(message)
    return {"result": message, "ip": ip}

async def status(ip, psk=DEFAULT_PSK):
    # Implement actual Status retrieval if available; fallback to a safe response
    return _safe_noop("Status not implemented", ip)

async def reset(ip, psk=DEFAULT_PSK):
    # Implement actual Reset if available; fallback to a safe response
    return _safe_noop("Reset not implemented", ip)

# Async dispatcher
async def main():
    ip = args.ip
    psk = args.psk
    action = args.action

    result = None
    try:
        if action == "Power On":
            print(f"Power On sent to {ip}")
            result = await power_on(ip, psk)

        elif action == "Power Off":
            print(f"Power Off sent to {ip}")
            result = await power_off(ip, psk)

        elif action == "Volume Up":
            result = await volume_up(ip, psk)
            print(f"Volume Up sent to {ip}")

        elif action == "Volume Down":
            result = await volume_down(ip, psk)
            print(f"Volume Down sent to {ip}")

        elif action == "Status":
            result = await status(ip, psk)
            print(f"Status fetched for {ip}")

        elif action == "Reset":
            result = await reset(ip, psk)
            print(f"Reset sent to {ip}")

        else:
            print("Unknown action")
            result = {"error": "Unknown action"}

    except Exception as e:
        # Catch unexpected errors to avoid non-zero exit
        print("Error during action:", str(e))
        result = {"error": str(e)}

    # Print final result so caller (backend) can read stdout
    try:
        print("RESULT:", json.dumps(result))
    except Exception:
        print("RESULT:", result)

# Run the async main
if __name__ == "__main__":
    asyncio.run(main())