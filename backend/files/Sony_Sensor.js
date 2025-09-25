if (process.argv.includes('--list-functions')) {
  console.log(JSON.stringify([
    "Power On",
    "Power Off",
    "Status",
    "Reset"
  ]));
  process.exit(0);
}

// Normal driver code here
console.log("Sony Sensor Driver Running...");