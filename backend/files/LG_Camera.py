import sys
import json
import argparse


# respond to discovery requests immediately and exit 0
if '--list-functions' in sys.argv:
    print(json.dumps([
        "Power On",
        "Power Off",
        "Volume Up",
        "Volume Down"
    ]))
    sys.exit(0)
