#!/usr/bin/env python3
"""
Build a mapping of callsigns to photo file extensions
"""
import json
import os
from pathlib import Path

def build_photo_map():
    pictures_dir = Path('attendance-app/public/pictures')

    if not pictures_dir.exists():
        print(f"Pictures directory not found: {pictures_dir}")
        return

    # Map callsign to file extension
    photo_map = {}

    # Scan all files in pictures directory
    for file_path in pictures_dir.iterdir():
        if file_path.is_file():
            # Get the filename and extension
            filename = file_path.stem  # filename without extension
            extension = file_path.suffix.lstrip('.')  # extension without the dot

            # Only include image files
            if extension.lower() in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                callsign = filename.upper()
                photo_map[callsign] = extension

    # Write to JSON file
    output_file = 'attendance-app/public/photo-map.json'
    with open(output_file, 'w') as f:
        json.dump(photo_map, f, indent=2, sort_keys=True)

    print(f"Created {output_file} with {len(photo_map)} photos")

    # Print some stats
    extensions = {}
    for ext in photo_map.values():
        extensions[ext] = extensions.get(ext, 0) + 1

    print("Extensions found:")
    for ext, count in sorted(extensions.items()):
        print(f"  .{ext}: {count}")

if __name__ == '__main__':
    build_photo_map()
