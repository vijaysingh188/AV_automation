import asyncio

# Constants
K_HEADER_DATA = 0xAA
K_ACK_DATA = 0x41

class Command:
    def __init__(self, name, device_id, cmd_type, param_byte=None):
        self.name = name
        self.cmd_type = cmd_type
        self.device_id = device_id
        self.cmd = [K_HEADER_DATA, cmd_type, device_id]
        if param_byte is not None:
            param_byte = max(0, round(param_byte)) & 0xFF
            self.cmd += [1, param_byte]
        else:
            self.cmd.append(0)
        checksum = sum(self.cmd[1:]) & 0xFF
        self.cmd.append(checksum)

    def get_bytes(self):
        return bytes(self.cmd)

    def __str__(self):
        return f"{self.name} {self.cmd}"


class Prop:
    def __init__(self, driver, name, cmd_byte, current=None, min_val=None, max_val=None):
        self.driver = driver
        self.name = name
        self.cmd_byte = cmd_byte
        self.current = current
        self.wanted = None
        self.min = min_val
        self.max = max_val

    def get(self):
        return self.wanted if self.wanted is not None else self.current

    def set(self, value):
        if (self.min is not None and value < self.min) or (self.max is not None and value > self.max):
            print(f"Value out of range for {self.name}: {value}")
            return False
        changed = self.wanted != value
        self.wanted = value
        return changed

    def update_current(self, value):
        self.current = value
        self.driver.property_changed(self.name)

    def needs_correction(self):
        return self.wanted is not None and self.current != self.wanted

    async def correct(self):
        cmd = Command(self.name, self.driver.id, self.cmd_byte, self.wanted)
        await self.driver.start_request(cmd)
        self.current = self.wanted


class BoolProp(Prop):
    async def correct(self):
        self.wanted = 1 if self.wanted else 0
        await super().correct()


class NumProp(Prop):
    async def correct(self):
        await super().correct()


class Power(BoolProp):
    async def correct(self):
        if self.wanted:
            await self.driver.wake_up()
        await super().correct()


class Volume(NumProp):
    async def correct(self):
        # Convert normalized value to 0-100 scale
        if self.wanted is not None:
            self.wanted = int(self.wanted * 100)
        await super().correct()


class SamsungMDC:
    def __init__(self, socket):
        self.socket = socket
        self.id = 0
        self.prop_list = []
        self.discarded = False
        self.curr_cmd = None
        self.cmd_timeout = None

        if socket.enabled:
            socket.auto_connect(True)
            socket.enable_wake_on_lan()

            self.power_prop = Power(self, "power", 0x11, False)
            self.input_prop = NumProp(self, "input", 0x14, 0, min_val=0, max_val=99)
            self.volume_prop = Volume(self, "volume", 0x12, 1)

            self.prop_list.extend([self.power_prop, self.input_prop, self.volume_prop])

            socket.on_connect(self.connect_state_changed)
            socket.on_data(self.data_received)
            socket.on_finish(self.discard)

            if socket.connected:
                asyncio.create_task(self.poll_now())

    async def wake_up(self):
        await self.socket.wake_on_lan()

    async def send_correction(self):
        if not self.curr_cmd and not self.discarded:
            for prop in self.prop_list:
                if prop.needs_correction():
                    await prop.correct()
                    break

    async def poll_now(self):
        cmd = Command("status", self.id, 0x00)
        await self.start_request(cmd)
        asyncio.create_task(self.poll_soon())

    async def poll_soon(self, delay=5):
        await asyncio.sleep(delay)
        if not self.discarded:
            await self.poll_now()

    async def start_request(self, cmd):
        self.curr_cmd = cmd
        self.socket.send_bytes(cmd.get_bytes())
        try:
            # Wait for response asynchronously
            await asyncio.wait_for(self.wait_for_response(), timeout=10)
        except asyncio.TimeoutError:
            print(f"Request timeout: {cmd}")
        self.curr_cmd = None

    async def wait_for_response(self):
        # Dummy placeholder for real socket async response
        await asyncio.sleep(0.1)

    def data_received(self, data):
        # Process incoming data from socket
        pass

    def connect_state_changed(self, state):
        print(f"Connection state: {state}")

    def property_changed(self, prop_name):
        print(f"Property changed: {prop_name}")

    def discard(self):
        self.discarded = True
