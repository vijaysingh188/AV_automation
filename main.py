from flask import Flask, render_template_string
from zeroconf import Zeroconf, ServiceBrowser
import socket

app = Flask(__name__)

devices = []  


class DeviceListener:
    def add_service(self, zeroconf, service_type, name):
        # Validate service_type and name format
        if not (isinstance(service_type, str) and service_type.endswith('.')):
            print(f"Invalid service_type: {service_type}")
            return
        if not (isinstance(name, str) and name.endswith(service_type)):
            print(f"Invalid service name: {name} for type: {service_type}")
            return
        info = zeroconf.get_service_info(service_type, name)
        print(info,'==============info')
        if info:
            ip = socket.inet_ntoa(info.addresses[0])
            # Try to get a generic name
            generic_name = None
            if hasattr(info, 'properties') and info.properties and b'fn' in info.properties:
                try:
                    generic_name = info.properties[b'fn'].decode('utf-8')
                except Exception:
                    generic_name = str(info.properties[b'fn'])
            elif hasattr(info, 'server') and info.server:
                generic_name = info.server.rstrip('.')
            elif hasattr(info, 'properties') and info.properties:
                # Try other friendly name keys
                for key in [b'name', b'friendly_name']:
                    if key in info.properties:
                        try:
                            generic_name = info.properties[key].decode('utf-8')
                        except Exception:
                            generic_name = str(info.properties[key])
                        break
            if not generic_name:
                # Fallback to original name
                generic_name = name

            # Try to infer device type
            device_type = "Unknown"
            # Use service_type to guess
            if service_type == "_googlecast._tcp.local.":
                device_type = "Google Cast Device"
            elif service_type == "_androidtvremote2._tcp.local.":
                device_type = "Android TV"
            elif service_type == "_airplay._tcp.local.":
                device_type = "AirPlay Device"
            # Try to get model/type from properties
            if hasattr(info, 'properties') and info.properties:
                for key in [b'model', b'type', b'device', b'product']:
                    if key in info.properties:
                        try:
                            device_type = info.properties[key].decode('utf-8')
                        except Exception:
                            device_type = str(info.properties[key])
                        break
            # Check for duplicates
            for d in devices:
                if d["name"] == generic_name and d["ip"] == ip:
                    return  # Duplicate found, do not add
            device = {
                "name": generic_name,
                "ip": ip,
                "port": info.port,
                "type": device_type
            }
            print(devices,'===devices')
            devices.append(device)

    def update_service(self, zeroconf, service_type, name):
        # Empty method to satisfy FutureWarning
        pass


@app.route("/")
def dashboard():
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Smart Home Devices</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    </head>
    <body class="bg-dark text-white">
        <div class="container mt-5">
            <h2 class="mb-4">Discovered Devices</h2>
            <table class="table table-dark table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>IP</th>
                        <th>Port</th>
                        <th>Type</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                {% for device in devices %}
                    <tr>
                        <td>{{ device.name }}</td>
                        <td>{{ device.ip }}</td>
                        <td>{{ device.port }}</td>
                        <td>{{ device.type }}</td>
                        <td>
                            {% if "tv" in device.name|lower %}
                                <a href="/control/tv/{{ device.ip }}" class="btn btn-primary btn-sm">TV Controls</a>
                            {% elif "speaker" in device.name|lower %}
                                <a href="/control/speaker/{{ device.ip }}" class="btn btn-success btn-sm">Volume Up</a>
                            {% elif "curtain" in device.name|lower %}
                                <a href="/control/curtain/{{ device.ip }}" class="btn btn-warning btn-sm">Open Curtain</a>
                            {% else %}
                                <span class="text-muted">No Action</span>
                            {% endif %}
                        </td>
                    </tr>
                {% endfor %}
                </tbody>
            </table>
        </div>
    </body>
    </html>
    """
    return render_template_string(html_template, devices=devices)


@app.route("/control/tv/<ip>", methods=["GET", "POST"])
def control_tv(ip):
    options = [
        ("Shutdown", "/control/tv/{}/shutdown".format(ip)),
        ("Restart", "/control/tv/{}/restart".format(ip)),
        ("Home", "/control/tv/{}/home".format(ip)),
        ("Screen Cast", "/control/tv/{}/screencast".format(ip)),
        ("Volume Up", "/control/tv/{}/volume_up".format(ip)),
        ("Volume Down", "/control/tv/{}/volume_down".format(ip)),
    ]
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>TV Controls</title>
        <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\">
    </head>
    <body class=\"bg-dark text-white\">
        <div class=\"container mt-5\">
            <h2 class=\"mb-4\">TV Controls for {{ ip }}</h2>
            <div class=\"row\">
                {% for label, url in options %}
                <div class=\"col-md-4 mb-3\">
                    <a href=\"{{ url }}\" class=\"btn btn-primary w-100\">{{ label }}</a>
                </div>
                {% endfor %}
            </div>
            <div class=\"alert alert-info mt-4\">
                <strong>Miracast Screen Mirroring:</strong><br>
                To cast your Windows screen to a Miracast-enabled TV, press <kbd>Win+K</kbd> or search for <b>Connect</b> in the Start menu.<br>
                Select your TV from the list to start screen mirroring.<br>
                <span class=\"text-muted\">(Miracast cannot be triggered from this web app; it is a Windows feature.)</span>
            </div>
            <a href=\"/\" class=\"btn btn-secondary mt-4\">Back to Dashboard</a>
        </div>
    </body>
    </html>
    """
    return render_template_string(html, ip=ip, options=options)

# TV control endpoints
@app.route("/control/tv/<ip>/shutdown")
def tv_shutdown(ip):
    try:
        from androidtv import AndroidTVSync
        atv = AndroidTVSync(ip, 5555)
        # Use the built-in method to send keyevent
        atv._adb.shell('input keyevent 26')
        return f"Shutdown command sent to TV at {ip} (Power keyevent 26)."
    except Exception as e:
        return f"Failed to send shutdown command: {e}"

@app.route("/control/tv/<ip>/restart")
def tv_restart(ip):
    return f"Restart command sent to TV at {ip}"

@app.route("/control/tv/<ip>/home")
def tv_home(ip):
    return f"Home command sent to TV at {ip}"


@app.route("/control/tv/<ip>/screencast")
def tv_screencast(ip):
    try:
        import os
        # This will open the Windows Connect app (Miracast UI) on the server machine
        os.system('start ms-connect:')
        ######Add code#########
        return "Windows Connect app opened. Please select your TV to start screen mirroring."
    except Exception as e:
        return f"Failed to open Connect app: {e}"


@app.route("/control/tv/<ip>/volume_up")
def tv_volume_up(ip):
    try:
        from androidtv import AndroidTVSync
        atv = AndroidTVSync(ip, 5555)
        # Try sending 5 volume up commands, with error feedback
        success = 0
        errors = []
        for i in range(5):
            try:
                atv.volume_up()
                success += 10
            except Exception as inner_e:
                errors.append(str(inner_e))
        if success > 0:
            return f"Sent {success} Volume Up command(s) to Android TV at {ip}. Errors: {errors if errors else 'None'}"
        else:
            return f"Failed to send any Volume Up commands. Errors: {errors}"
    except Exception as e:
        return f"Failed to send Volume Up command: {e}"


@app.route("/control/tv/<ip>/volume_down")
def tv_volume_down(ip):
    try:
        from androidtv import AndroidTVSync
        atv = AndroidTVSync(ip, 5555)
        # Try sending 5 volume down commands, with error feedback
        success = 0
        errors = []
        for i in range(5):
            try:
                atv.volume_down()
                success += 1
            except Exception as inner_e:
                errors.append(str(inner_e))
        if success > 0:
            return f"Sent {success} Volume Down command(s) to Android TV at {ip}. Errors: {errors if errors else 'None'}"
        else:
            return f"Failed to send any Volume Down commands. Errors: {errors}"
    except Exception as e:
        return f"Failed to send Volume Down command: {e}"


@app.route("/control/speaker/<ip>")
def control_speaker(ip):
    return f"Sent command to increase volume on Speaker at {ip}"


@app.route("/control/curtain/<ip>")
def control_curtain(ip):
    return f"Sent command to open Curtain at {ip}"


if __name__ == "__main__":
    zeroconf = Zeroconf()
    listener = DeviceListener()
    browser = ServiceBrowser(zeroconf, "_googlecast._tcp.local.", listener)
    app.run(host="0.0.0.0", port=5555, debug=True)
