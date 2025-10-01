if (process.argv.includes('--list-functions')) {
  console.log(JSON.stringify([
    "Power On",
    "Power Off",
    "Volume Up",
    "Volume Down",
    "Status",
    "Reset"
  ]));
  process.exit(0);
}

// Only import after --list-functions check
const { volumeUp, volumeDown, powerOn, powerOff, status, reset } = require('./yourSonyFunctions');
const args = require('minimist')(process.argv.slice(2));
const ip = args.ip;
const action = args.action;

(async () => {
  if (action === "Power On") {
    console.log("Power On sent to", ip);
    await powerOn(ip);
    
  } else if (action === "Power Off") {
    console.log("Power Off sent to", ip);
    await powerOff(ip);
    
  } else if (action === "Volume Up") {
    await volumeUp(ip);
    console.log("Volume Up sent to", ip);
  } else if (action === "Volume Down") {
    await volumeDown(ip);
    console.log("Volume Down sent to", ip);
  } else if (action === "Status" && typeof status === "function") {
    await status(ip);
    console.log("Status fetched for", ip);
  } else if (action === "Reset" && typeof reset === "function") {
    await reset(ip);
    console.log("Reset sent to", ip);
  } else {
    console.log("Unknown action");
  }
})();






