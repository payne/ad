# QRZ Photo Fetcher - Setup Instructions

This script fetches member photos from QRZ.com using their XML API.

## Prerequisites

1. **QRZ.com XML Subscription**
   - You need an active XML subscription at QRZ.com
   - Standard QRZ.com logbook accounts do NOT include XML access
   - Subscribe at: https://www.qrz.com/i/subscriptions.html

2. **Python 3.6 or higher**
   - Check your version: `python3 --version`

3. **Required Python Library**
   ```bash
   pip install requests
   ```

## Setup

1. **Edit the script configuration**

   Open `fetch_qrz_photos.py` and update these lines:
   ```python
   QRZ_USERNAME = "YOUR_QRZ_USERNAME"  # Your QRZ.com login username
   QRZ_PASSWORD = "YOUR_QRZ_PASSWORD"  # Your QRZ.com login password
   ```

2. **Make the script executable (optional)**
   ```bash
   chmod +x fetch_qrz_photos.py
   ```

## Usage

Run the script:
```bash
python3 fetch_qrz_photos.py
```

The script will:
1. Authenticate with QRZ.com
2. Read all callsigns from `roster.json`
3. Look up each callsign via the QRZ XML API
4. Download photos to the `pictures/` directory
5. Name files as: `CALLSIGN.jpg` (or .png/.gif depending on source)

## What to Expect

- **Processing Time**: With 113 callsigns and a 2-second delay between requests, expect ~4-5 minutes
- **Success Rate**: Not all operators have photos uploaded to QRZ
- **File Names**: Photos are saved as `{CALLSIGN}.{ext}` (e.g., `K0MXL.jpg`, `WD0GKA.png`)

## Output Example

```
✓ Photos directory: /Users/mpayne/git/AARC_Directory/pictures
✓ Loading roster from roster.json...
✓ Loaded 123 members
✓ Found 113 members with callsigns

⚡ Authenticating with QRZ.com...
✓ Successfully authenticated with QRZ.com

⚡ Starting photo fetch for 113 callsigns...

[1/113] K0MXL - John E Amdor III
  ⬇ Downloading from: https://files.qrz.com/...
  ✓ Saved to: K0MXL.jpg

[2/113] WD0GKA - Barbara M Anderson
  ⊙ No photo available on QRZ

[3/113] KF0HFI - Terri Archer
  ⊙ Photo already exists: KF0HFI.jpg
...
```

## Troubleshooting

### Authentication Failed
- Verify your QRZ username and password are correct
- Confirm your QRZ subscription includes XML access
- Check https://logbook.qrz.com/lbstat to verify XML subscription status

### "requests" Module Not Found
```bash
pip3 install requests
```

### Rate Limiting / Too Many Requests
- The script includes a 2-second delay between requests
- If you get rate limit errors, increase `REQUEST_DELAY` in the script

### No Photos Found
- Not all amateur radio operators upload photos to QRZ
- Photos may be restricted to logged-in users only
- Some operators mark their profiles as private

## API Reference

QRZ XML API Documentation: https://www.qrz.com/page/xml_data.html

## Notes

- The script respects QRZ's servers with built-in delays
- Photos are skipped if they already exist (won't re-download)
- Non-licensed members (no callsign) are automatically skipped
- The script is read-only and doesn't modify your QRZ account

## Privacy & Ethics

- Only download photos for legitimate club directory purposes
- Respect operators' privacy - don't redistribute photos without permission
- Some operators intentionally don't upload photos - respect their choice
