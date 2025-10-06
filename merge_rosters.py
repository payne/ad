#!/usr/bin/env python3
"""
Merge AARC and BARC roster files into a unified members.json format
"""
import json

def merge_rosters():
    # Load AARC roster
    with open('attendance-app/public/roster.json', 'r') as f:
        aarc_data = json.load(f)

    # Load BARC roster
    with open('attendance-app/public/BARC_members_from_groups_io.json', 'r') as f:
        barc_data = json.load(f)

    # Create dictionaries: one by callsign for members with callsigns, one list for those without
    members_by_callsign = {}
    members_without_callsign = []

    # Process AARC members first (they have more complete information)
    for member in aarc_data['members']:
        callsign = member.get('callsign', '').strip().upper()
        name = member.get('name', '').strip()

        # Skip entries without callsign or with placeholder callsign
        if not callsign or callsign == '-':
            callsign = ''

        if callsign:
            members_by_callsign[callsign] = {
                'name': name,
                'callsign': callsign,
                'clubs': ['AARC']
            }
        else:
            # No callsign, add to separate list
            members_without_callsign.append({
                'name': name,
                'callsign': '',
                'clubs': ['AARC']
            })

    # Process BARC members
    for member in barc_data:
        callsign = member.get('call_sign', '').strip().upper()
        name = member.get('name', '').strip()

        # Skip entries without name
        if not name:
            continue

        # Clean up callsign
        if not callsign:
            callsign = ''

        if callsign:
            if callsign in members_by_callsign:
                # Member is in both clubs - add BARC if not already there
                if 'BARC' not in members_by_callsign[callsign]['clubs']:
                    members_by_callsign[callsign]['clubs'].append('BARC')
            else:
                # BARC-only member with callsign
                members_by_callsign[callsign] = {
                    'name': name,
                    'callsign': callsign,
                    'clubs': ['BARC']
                }
        else:
            # BARC member without callsign
            members_without_callsign.append({
                'name': name,
                'callsign': '',
                'clubs': ['BARC']
            })

    # Combine members with callsigns and without
    members_list = list(members_by_callsign.values()) + members_without_callsign
    members_list.sort(key=lambda m: m['name'].lower())

    # Write unified roster
    with open('attendance-app/public/members.json', 'w') as f:
        json.dump(members_list, f, indent=2)

    print(f"Created members.json with {len(members_list)} members")

    # Print some stats
    aarc_count = sum(1 for m in members_list if 'AARC' in m['clubs'])
    barc_count = sum(1 for m in members_list if 'BARC' in m['clubs'])
    both_count = sum(1 for m in members_list if 'AARC' in m['clubs'] and 'BARC' in m['clubs'])

    print(f"AARC members: {aarc_count}")
    print(f"BARC members: {barc_count}")
    print(f"Both clubs: {both_count}")

if __name__ == '__main__':
    merge_rosters()
