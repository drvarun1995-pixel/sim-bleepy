# 🚀 Event Booking System - Quick Start

## ⚡ Get Started in 5 Minutes

### Step 1: Run Database Migrations (Required!)

Open Supabase SQL Editor and run these 4 files **in order**:

```
1. migrations/add-event-booking-fields.sql
2. migrations/create-event-bookings-table.sql
3. migrations/create-booking-stats-view.sql
4. migrations/setup-booking-rls-policies.sql
```

⏱️ Takes: ~10 seconds total

---

### Step 2: Enable Booking on an Event

1. Go to **Event Data** page
2. Edit any event (or create new one)
3. Click **"Booking"** tab (between Speakers and Event Status)
4. ✅ Check **"Activate Booking for this Event"**
5. Set capacity: e.g., 50
6. Click **Save**

⏱️ Takes: ~30 seconds

---

### Step 3: Test Booking as User

1. Go to **Events** page
2. Click the event you just configured
3. See the **"Register"** button with capacity
4. Click it → Modal appears
5. Check the confirmation checkbox
6. Click **"Confirm Registration"**
7. ✅ Success! You're registered

⏱️ Takes: ~20 seconds

---

### Step 4: View Bookings as Admin

1. Click **"Bookings"** in sidebar (Event Management section)
2. See your event with 1 booking
3. Click **"View Details"**
4. See all bookings with user information

⏱️ Takes: ~15 seconds

---

## 🎉 That's It!

Your booking system is now live and working!

---

## 📍 Where to Find Things

### For Users (All Roles)
- **Book Events:** Events page → Click event → "Register" button
- **View Bookings:** Sidebar → "My Bookings"
- **Cancel Booking:** My Bookings → "Cancel Booking" button

### For Admins/Educators
- **Configure Booking:** Event Data → Edit Event → "Booking" tab
- **View All Bookings:** Sidebar → Event Management → "Bookings"
- **Manage Bookings:** Bookings → Click event → "View Details"
- **Export Data:** Bookings page → "Export CSV" button

---

## ⚙️ Quick Configuration Guide

### Enable Booking
Event Data → Edit → Booking Tab → ✅ Activate Booking

### Set Capacity
Booking Tab → "Event Capacity" → Enter number (or leave empty for unlimited)

### Change Button Text
Booking Tab → "Booking Button Label" → Enter custom text

### Set Deadline
Booking Tab → "Booking Deadline" → Hours before event (default: 1)

### Enable/Disable Waitlist
Booking Tab → ✅ "Allow Waitlist"

---

## 🎯 Common Tasks

### Task: Create bookable event
1. Event Data → Add Event
2. Fill basic info
3. Go to "Booking" tab
4. Enable booking
5. Set capacity
6. Save

### Task: View who booked
1. Bookings (sidebar)
2. Find event
3. "View Details"
4. See all bookings

### Task: Export bookings
1. Bookings → Event
2. "Export CSV"
3. File downloads

### Task: Mark attendance
1. Bookings → Event
2. Find user
3. "Mark Attended"

### Task: Cancel user's booking
1. My Bookings (user view)
2. Find booking
3. "Cancel Booking"

---

## 🆘 Quick Fixes

### Problem: No booking button
**Fix:** Enable booking in Event Data → Booking tab

### Problem: Can't see bookings
**Fix:** Run all 4 migration files

### Problem: "Unauthorized"
**Fix:** Login with correct role (admin/educator/meded_team/ctf)

### Problem: Event full instantly
**Fix:** Check capacity setting in Booking tab

---

## 📚 Full Documentation

For detailed guides, see:
- `BOOKING_SYSTEM_IMPLEMENTATION_GUIDE.md` - Complete setup & testing
- `BOOKING_SYSTEM_SUMMARY.md` - Technical overview

---

## ✅ Pre-Flight Checklist

Before going live:
- [ ] All 4 migrations run
- [ ] Test event created
- [ ] Booking works
- [ ] Cancellation works
- [ ] Admin can see bookings
- [ ] Mobile tested

---

**Status:** ✅ All systems ready!  
**Time to deploy:** ~5 minutes  
**Difficulty:** Easy

Start with Step 1 above! 🚀


