const fetch = require('node-fetch');

async function setAudioVolume(ip, psk, volumeChange) {
  const url = `http://${ip}/sony/audio`;
  const headers = {
    "Accept": "*/*",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
    "Content-Type": "text/plain;charset=UTF-8",
    "Origin": "null",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "X-Auth-PSK": psk
  };
  const body = JSON.stringify({
    method: "setAudioVolume",
    version: "1.0",
    id: 1,
    params: [
      {
        target: "speaker",
        volume: volumeChange // "+1" for up, "-1" for down
      }
    ]
  });

  const response = await fetch(url, {
    method: "POST",
    headers,
    body
  });
  const data = await response.json();
  return data;
}

async function volumeUp(ip, psk = "1234") {
  return await setAudioVolume(ip, psk, "+1");
}

async function volumeDown(ip, psk = "1234") {
  return await setAudioVolume(ip, psk, "-1");
}

// Example stub implementations for powerOn, powerOff, status, reset
async function powerOn(ip, psk = "1234") {
  // Implement Sony power on API call here
  console.log("Power On not implemented for", ip);
  return { result: "Power On not implemented" };
}

async function powerOff(ip, psk = "1234") {
  // Implement Sony power off API call here
  console.log("Power Off not implemented for", ip);
  return { result: "Power Off not implemented" };
}

async function status(ip, psk = "1234") {
  // Implement Sony status API call here
  console.log("Status not implemented for", ip);
  return { result: "Status not implemented" };
}

async function reset(ip, psk = "1234") {
  // Implement Sony reset API call here
  console.log("Reset not implemented for", ip);
  return { result: "Reset not implemented" };
}

module.exports = {
  powerOn,
  powerOff,
  volumeUp,
  volumeDown,
  status,
  reset
};