#!/usr/bin/env python3
"""
QRZ.com XML API Photo Fetcher
Retrieves operator photos from QRZ.com using their XML subscription API

Prerequisites:
- Python 3.6+
- QRZ.com XML subscription
- requests library: pip install requests

Usage:
1. Set your QRZ username and password in the config section below
2. Run: python3 fetch_qrz_photos.py
"""

import json
import os
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional, Dict, Any

try:
    import requests
except ImportError:
    print("Error: requests library not found")
    print("Install it with: pip install requests")
    sys.exit(1)

# ============================================================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================================================

QRZ_USERNAME = "N3PAY"  # Your QRZ.com login username
QRZ_PASSWORD = "secret"  # Your QRZ.com login password


# Path to your roster JSON file
ROSTER_FILE = "roster.json"

# Directory to save photos
PHOTOS_DIR = "pictures"

# Delay between API requests (in seconds) to be respectful of QRZ servers
REQUEST_DELAY = 2

# QRZ XML API endpoint
QRZ_API_URL = "https://xmldata.qrz.com/xml/current/"

# ============================================================================
# QRZ XML API Client
# ============================================================================

class QRZClient:
    """Client for interacting with QRZ.com XML API"""

    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password
        self.session_key = None
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AARC-Directory-Photo-Fetcher/1.0'
        })

    def authenticate(self) -> bool:
        """Authenticate with QRZ and get session key"""
        params = {
            'username': self.username,
            'password': self.password
        }

        try:
            response = self.session.get(QRZ_API_URL, params=params)
            response.raise_for_status()

            root = ET.fromstring(response.content)

            # QRZ returns XML with namespace - need to handle both cases
            # Namespace format: {http://xmldata.qrz.com}TagName
            session = root.find('Session')
            if session is None:
                session = root.find('{http://xmldata.qrz.com}Session')

            if session is not None:
                # Look for session key (with or without namespace)
                key = session.find('Key')
                if key is None:
                    key = session.find('{http://xmldata.qrz.com}Key')

                if key is not None:
                    self.session_key = key.text
                    print(f"✓ Successfully authenticated with QRZ.com")
                    return True

                # Check for error
                error = session.find('Error')
                if error is None:
                    error = session.find('{http://xmldata.qrz.com}Error')

                if error is not None:
                    print(f"✗ Authentication error: {error.text}")
                    return False

            print("✗ No session key received from QRZ")
            return False

        except requests.RequestException as e:
            print(f"✗ Network error during authentication: {e}")
            return False
        except ET.ParseError as e:
            print(f"✗ XML parsing error: {e}")
            return False

    def lookup_callsign(self, callsign: str) -> Optional[Dict[str, Any]]:
        """Look up callsign information including photo URL"""
        if not self.session_key:
            print("✗ Not authenticated. Call authenticate() first.")
            return None

        params = {
            's': self.session_key,
            'callsign': callsign
        }

        try:
            response = self.session.get(QRZ_API_URL, params=params)
            response.raise_for_status()

            root = ET.fromstring(response.content)

            # Check for errors (with namespace support)
            session = root.find('Session')
            if session is None:
                session = root.find('{http://xmldata.qrz.com}Session')

            if session is not None:
                error = session.find('Error')
                if error is None:
                    error = session.find('{http://xmldata.qrz.com}Error')
                if error is not None:
                    return {'error': error.text}

            # Parse callsign data (with namespace support)
            callsign_data = root.find('Callsign')
            if callsign_data is None:
                callsign_data = root.find('{http://xmldata.qrz.com}Callsign')

            if callsign_data is None:
                return {'error': 'No data found for callsign'}

            # Extract relevant fields (with namespace support)
            data = {}
            fields = ['call', 'fname', 'name', 'addr1', 'addr2', 'state',
                     'zip', 'country', 'email', 'image', 'bio']

            for field in fields:
                element = callsign_data.find(field)
                if element is None:
                    element = callsign_data.find(f'{{http://xmldata.qrz.com}}{field}')
                if element is not None and element.text:
                    data[field] = element.text

            return data

        except requests.RequestException as e:
            return {'error': f'Network error: {e}'}
        except ET.ParseError as e:
            return {'error': f'XML parsing error: {e}'}

    def download_photo(self, image_url: str, save_path: str) -> bool:
        """Download photo from URL to specified path"""
        try:
            response = self.session.get(image_url, timeout=30)
            response.raise_for_status()

            # Save the image
            with open(save_path, 'wb') as f:
                f.write(response.content)

            return True

        except requests.RequestException as e:
            print(f"  ✗ Error downloading photo: {e}")
            return False

# ============================================================================
# Main Photo Fetching Logic
# ============================================================================

def load_roster(roster_file: str) -> list:
    """Load roster from JSON file"""
    try:
        with open(roster_file, 'r') as f:
            data = json.load(f)
            return data.get('members', [])
    except FileNotFoundError:
        print(f"✗ Error: Roster file '{roster_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"✗ Error parsing roster JSON: {e}")
        sys.exit(1)

def get_image_extension(url: str) -> str:
    """Extract file extension from image URL"""
    # Common image extensions
    for ext in ['.jpg', '.jpeg', '.png', '.gif']:
        if ext in url.lower():
            return ext
    return '.jpg'  # Default to .jpg

def fetch_all_photos():
    """Main function to fetch photos for all callsigns in roster"""

    # Validate configuration
    if QRZ_USERNAME == "YOUR_QRZ_USERNAME" or QRZ_PASSWORD == "YOUR_QRZ_PASSWORD":
        print("✗ Error: Please update QRZ_USERNAME and QRZ_PASSWORD in the script")
        sys.exit(1)

    # Create photos directory
    photos_dir = Path(PHOTOS_DIR)
    photos_dir.mkdir(exist_ok=True)
    print(f"✓ Photos directory: {photos_dir.absolute()}")

    # Load roster
    print(f"\n✓ Loading roster from {ROSTER_FILE}...")
    members = load_roster(ROSTER_FILE)
    print(f"✓ Loaded {len(members)} members")

    # Filter members with callsigns
    members_with_callsigns = [m for m in members if m.get('callsign') and m['callsign'] not in ['', '-']]
    print(f"✓ Found {len(members_with_callsigns)} members with callsigns")

    # Initialize QRZ client
    print(f"\n⚡ Authenticating with QRZ.com...")
    client = QRZClient(QRZ_USERNAME, QRZ_PASSWORD)

    if not client.authenticate():
        print("✗ Failed to authenticate. Please check your credentials.")
        sys.exit(1)

    # Statistics
    stats = {
        'total': len(members_with_callsigns),
        'downloaded': 0,
        'no_photo': 0,
        'already_exists': 0,
        'errors': 0
    }

    print(f"\n⚡ Starting photo fetch for {stats['total']} callsigns...\n")

    # Process each member
    for idx, member in enumerate(members_with_callsigns, 1):
        callsign = member['callsign']
        name = member.get('name', 'Unknown')

        print(f"[{idx}/{stats['total']}] {callsign} - {name}")

        # Check if photo already exists
        # Look for any file starting with the callsign
        existing_files = list(photos_dir.glob(f"{callsign}.*"))
        if existing_files:
            print(f"  ⊙ Photo already exists: {existing_files[0].name}")
            stats['already_exists'] += 1
            continue

        # Look up callsign on QRZ
        data = client.lookup_callsign(callsign)

        if data is None:
            print(f"  ✗ Failed to lookup callsign")
            stats['errors'] += 1
            time.sleep(REQUEST_DELAY)
            continue

        if 'error' in data:
            print(f"  ✗ {data['error']}")
            stats['errors'] += 1
            time.sleep(REQUEST_DELAY)
            continue

        # Check if photo URL exists
        image_url = data.get('image')
        if not image_url:
            print(f"  ⊙ No photo available on QRZ")
            stats['no_photo'] += 1
            time.sleep(REQUEST_DELAY)
            continue

        # Determine file extension
        ext = get_image_extension(image_url)
        photo_path = photos_dir / f"{callsign}{ext}"

        # Download photo
        print(f"  ⬇ Downloading from: {image_url}")
        if client.download_photo(image_url, str(photo_path)):
            print(f"  ✓ Saved to: {photo_path.name}")
            stats['downloaded'] += 1
        else:
            stats['errors'] += 1

        # Be respectful - delay between requests
        time.sleep(REQUEST_DELAY)

    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total callsigns processed:  {stats['total']}")
    print(f"Photos downloaded:          {stats['downloaded']}")
    print(f"Already existed:            {stats['already_exists']}")
    print(f"No photo available:         {stats['no_photo']}")
    print(f"Errors:                     {stats['errors']}")
    print("="*60)
    print(f"\n✓ Photos saved to: {photos_dir.absolute()}")

# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    try:
        fetch_all_photos()
    except KeyboardInterrupt:
        print("\n\n✗ Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
