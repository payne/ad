# Interaction Log

## 2025-10-01

### Session 1

**User Request:** Record our interactions in a file inside of this directory.

**Action Taken:** Created this interaction log file to track conversations and actions.

---

**User Request:** Extract the information inside of r.html and turn it into a json file.

**Action Taken:**
- Read r.html containing the Ak-Sar-Ben Amateur Radio Club roster
- Extracted 123 members with fields: id, callsign, name, address, city, state, zipcode, email, phone, rank
- Created roster.json with structured data

---

**User Request:** Generate a reference list of QRZ.com URLs for each callsign for manual lookup. Put the list into an ordered list (ol) within an HTML file.

**Action Taken:**
- Created pictures/ directory for future photo storage
- Generated qrz_lookup.html with clickable links to QRZ.com profiles for all 113 members with callsigns
- Included member names and ranks for easy reference
- Noted non-licensed members and private profiles without QRZ links

---

**User Request:** Create a script template for using the QRZ XML API. I have a subscription.

**Action Taken:**
- Created fetch_qrz_photos.py - Python script for downloading photos via QRZ XML API
- Features include:
  - QRZ authentication and session management
  - Automatic photo downloads for all callsigns in roster.json
  - Rate limiting (2 second delay) to respect QRZ servers
  - Skip already-downloaded photos
  - Detailed progress reporting and statistics
  - Error handling for network issues and missing photos
- Created README_QRZ_API.md with setup and usage instructions
- Made script executable with chmod +x

---

**Issue:** User reported authentication failure with QRZ API

**Troubleshooting & Resolution:**
- Created test_qrz_auth.py diagnostic script to examine raw API responses
- Discovered QRZ XML responses include XML namespace (xmlns="http://xmldata.qrz.com")
- Original script wasn't handling namespaced XML elements
- Created Python virtual environment: `python3 -m venv venv`
- Installed requests library: `pip install requests` (in venv)
- Fixed both authenticate() and lookup_callsign() methods to handle XML namespaces
- Added fallback logic to check for both namespaced and non-namespaced elements

**Execution Results:**
- Successfully authenticated with QRZ (subscription expires: Oct 2, 2026)
- Processed 112 callsigns from roster
- Downloaded 42 member photos to pictures/ directory (including N3PAY - Matt Payne)
- 69 members had no photo available on QRZ
- 1 error (W0HII - 403 Forbidden on photo URL)
- Photos saved as: CALLSIGN.jpg, CALLSIGN.png, or CALLSIGN.jpeg

**Files Modified:**
- fetch_qrz_photos.py - Added XML namespace handling
- test_qrz_auth.py - Created for diagnostics

---

**User Request:** Create an Angular application that uses a dark theme, Angular Material, and local storage to take attendance. Entering any part of a callsign will show which callsigns in roster.json match. Entering an extra character will narrow the matches. Clicking on a callsign will record attendance and display the person's name. Keep the text field for entering callsigns so they can be entered quickly. No server-side interaction once started.

**Action Taken:**
- Created new Angular 18 application with routing and SCSS
- Added Angular Material with custom dark theme configuration
- Copied roster.json to public/ folder for client-side access
- Created RosterService to load and search roster.json
  - Implements callsign search with partial matching
  - Uses HttpClient with caching via shareReplay
- Created AttendanceService with localStorage persistence
  - Records attendance with callsign, name, and timestamp
  - Prevents duplicate entries
  - Persists data across browser sessions
- Built AttendanceComponent with Material UI
  - Real-time callsign search as user types
  - Shows matched members as clickable chips
  - Auto-clears search and refocuses input after selection
  - Displays attendance list with timestamps
  - Shows attendance count badge
  - Clear all attendance button
- Configured dark theme using Material's theming system
- Started development server at http://localhost:4200

**Features Implemented:**
- Dark theme throughout the application
- Incremental search (narrows results as you type)
- Visual feedback for already-recorded members
- Local storage persistence
- No server dependencies after initial load
- Quick data entry workflow (stays focused on input)
- Attendance count display
- Ability to remove individual records

---

