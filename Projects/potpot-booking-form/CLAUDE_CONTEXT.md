# PotPot Project Context for Claude

**Last Updated:** 2026-01-09

## Live URLs (ONLY these 3 are used)
1. https://www.potpot.online - Main website (home + booking)
2. https://potpot-booking-form.vercel.app - Booking form direct access
3. https://potpot-web.vercel.app/partner-app/ - Partner app

## Repository Structure
- `/Users/apple/Projects/potpot-booking-form/` → Deploys to **potpot.online** AND **potpot-booking-form.vercel.app**
  - `index.html` = Home page (plant selection, pricing)
  - `booking.html` = Booking form

- `/Users/apple/Projects/potpot-web/` → Deploys to **potpot-web.vercel.app**
  - `partner-app/` = Partner/Gardener app

- `/Users/apple/Projects/potpot-partner-app-simple/` → Google Apps Script backend
  - `Code.gs` = All backend logic, WATI, Razorpay, Sheets

## Current Backend API
```
https://script.google.com/macros/s/AKfycby2YUM6lOXaUrnqWIpB0X3NAGhGnMz5MGM4Qhg0aKcKUhfaswlulTkKEjPjNHDPAji4BQ/exec
```

## Booking Flow (as of 2026-01-09)
**NEW Flow:** Address → Customer Details (name, phone, plants) → Time Slots → Success

### Slot System
- 30-minute interval slots (8:30 AM - 6:00 PM)
- Lunch break: 1-2 PM (blocked)
- Hard cutoff: 6:30 PM (all work must finish)
- 30-minute travel buffer between bookings
- Service duration based on plant count:
  - 0-20 plants: 60 min
  - 20-35 plants: 90 min
  - 35-50 plants: 120 min
  - 50+ plants: 180 min
- Default duration for old bookings (no plantCount): 90 min

## Integrations
- **Amplitude** - Analytics & session replay
- **Meta Pixel** - Facebook ads tracking (Lead event on booking)
- **Google Analytics** - GA4 tracking
- **WATI** - WhatsApp messages (booking confirmation, reminders)
- **Razorpay** - Payment links
- **Google Sheets** - Database (Bookings, Availability, GardenerZones, ServiceReports)

## Pending Deployments
- [ ] potpot-booking-form needs deploy (local has new flow, live has old flow)

## Recent Changes (2026-01-09)
1. Changed booking flow from Address→Slots→Details to Address→Details→Slots
2. Updated slot system to use plantCount for duration-based blocking
3. Updated API URL to new deployment
4. Fixed Amplitude step tracking for new flow order

## How to Deploy
```bash
cd /Users/apple/Projects/potpot-booking-form
git add .
git commit -m "Your message"
git push
# Vercel auto-deploys on push
```

## Important Notes
- Marketing ADs are running - be careful with changes
- Always test API changes before deploying frontend
- The home page passes `?plants=X` to booking.html via iframe
