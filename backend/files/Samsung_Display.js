// List available functions for UI
if (process.argv.includes('--list-functions')) {
  console.log(JSON.stringify([
    "Power On",
    "Power Off",
    "Set Input",
    "Volume Up",
    "Volume Down",
    "Get Status",
    "Reboot"
  ]));
  process.exit(0);
}



const SamsungMDC = require('./SamsungMDC'); // Adjust the path if needed

// Helper to get IP from command line
function getIpArg() {
  const ipIndex = process.argv.indexOf('--ip');
  if (ipIndex !== -1 && process.argv.length > ipIndex + 1) {
    return process.argv[ipIndex + 1];
  }
  return null;
}

async function powerOn(ip) {
  console.log("Power On command sent");
  const display = new SamsungMDC(ip);
  
  await display.powerOn();
  
}

async function powerOff(ip) {
  const display = new SamsungMDC(ip);
  console.log("Power Off command sent");
  await display.powerOff();
  
}

async function setInput(ip) {
  const display = new SamsungMDC(ip);
  // Example: set to HDMI1, adjust as needed
  await display.setInput('HDMI1');
  console.log("Set Input command sent");
}

async function volumeUp(ip) {
  const display = new SamsungMDC(ip);
  await display.volumeUp();
  console.log("Volume Up command sent");
}

async function volumeDown(ip) {
  const display = new SamsungMDC(ip);
  await display.volumeDown();
  console.log("Volume Down command sent");
}

async function getStatus(ip) {
  const display = new SamsungMDC(ip);
  const status = await display.getStatus();
  console.log("Status:", status);
}

async function reboot(ip) {
  const display = new SamsungMDC(ip);
  await display.reboot();
  console.log("Reboot command sent");
}


// Perform an action if --action is provided
const actionIndex = process.argv.indexOf('--action');
if (actionIndex !== -1 && process.argv.length > actionIndex + 1) {
  const action = process.argv[actionIndex + 1];
  const ip = getIpArg();
  if (!ip) {
    console.error("IP address is required. Use --ip <address>");
    process.exit(1);
  }
  (async () => {
    switch (action) {
      case "Power On":
        await powerOn(ip);
        break;
      case "Power Off":
        await powerOff(ip);
        break;
      case "Set Input":
        await setInput(ip);
        break;
      case "Volume Up":
        await volumeUp(ip);
        break;
      case "Volume Down":
        await volumeDown(ip);
        break;
      case "Get Status":
        await getStatus(ip);
        break;
      case "Reboot":
        await reboot(ip);
        break;
      default:
        console.log("Unknown action:", action);
    }
    process.exit(0);
  })();
} else {
  // Default behavior if run without special arguments
  console.log("Samsung Display Driver Ready");
}