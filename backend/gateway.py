import asyncio
import websockets
import json
import subprocess
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AWS_SERVER = "ws://13.201.79.241:8000/device-bridge"

async def main():
    while True:
        try:
            async with websockets.connect(AWS_SERVER) as ws:
                print("Connected to AWS")
                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    print("Received command:", data)

                    driver = data["device_driver"]
                    ip = data["ip"]
                    action = data["action"]

                    result = subprocess.run(
                        ["python", driver, "--ip", ip, "--action", action],
                        capture_output=True, text=True
                    )

                    await ws.send(json.dumps({
                        "device": driver,
                        "result": result.stdout.strip(),
                        "error": result.stderr.strip()
                    }))
        except Exception as e:
            logger.info(f"Connection error: {e}, retrying in 5 seconds")
            await asyncio.sleep(5)

asyncio.run(main())
