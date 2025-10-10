import sys
import json
import argparse
import asyncio
import requests

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
def set_audio_volume(ip, volume_change):
    url = f"http://{ip}/sony/audio"
    headers = {
        "Accept": "*/*",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        "Connection": "keep-alive",
        "Content-Type": "text/plain;charset=UTF-8",
        "Origin": "null",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
        "X-Auth-PSK": "1234"
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
        response = requests.post(url, headers=headers, json=payload, verify=False)
        data = response.json()
        print("API response:", data)
        return data
    except Exception as e:
        print("Error:", e)
        return {"error": str(e)}

# Async wrappers
async def volume_up(ip, psk=DEFAULT_PSK):
    return set_audio_volume(ip, "+10")

async def volume_down(ip, psk=DEFAULT_PSK):
    return set_audio_volume(ip, psk, "-1")

async def power_on(ip, psk=DEFAULT_PSK):
    print(f"Power On not implemented for {ip}")
    return {"result": "Power On not implemented"}

async def power_off(ip, psk=DEFAULT_PSK):
    print(f"Power Off not implemented for {ip}")
    return {"result": "Power Off not implemented"}

async def status(ip, psk=DEFAULT_PSK):
    print(f"Status not implemented for {ip}")
    return {"result": "Status not implemented"}

async def reset(ip, psk=DEFAULT_PSK):
    print(f"Reset not implemented for {ip}")
    return {"result": "Reset not implemented"}

# Async dispatcher
async def main():
    ip = args.ip
    psk = args.psk
    action = args.action

    if action == "Power On":
        print(f"Power On sent to {ip}")
        await power_on(ip, psk)

    elif action == "Power Off":
        print(f"Power Off sent to {ip}")
        await power_off(ip, psk)

    elif action == "Volume Up":
        await volume_up(ip, psk)
        print(f"Volume Up sent to {ip}")

    elif action == "Volume Down":
        await volume_down(ip, psk)
        print(f"Volume Down sent to {ip}")

    elif action == "Status":
        await status(ip, psk)
        print(f"Status fetched for {ip}")

    elif action == "Reset":
        await reset(ip, psk)
        print(f"Reset sent to {ip}")

    else:
        print("Unknown action")

# Run the async main
asyncio.run(main())