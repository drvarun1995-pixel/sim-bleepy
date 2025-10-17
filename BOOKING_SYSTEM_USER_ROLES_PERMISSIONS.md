# Booking System - User Roles & Permissions

## Overview
The booking system has role-based access control with different permissions for different user roles. Here's a comprehensive breakdown of what each role can do.

## User Roles Hierarchy
1. **STUDENT** (Basic Access)
2. **EDUCATOR** (Resource Management)  
3. **MEDED_TEAM** (Event Management + Contact Messages)
4. **CTF** (Event Management + Contact Messages)
5. **ADMIN** (Full Access)

## Booking System Permissions by Role

### 🎓 STUDENT
**Access Level:** Basic User Access

#### ✅ What Students CAN do:
- **View Events**: Browse all published events on events-list, calendar, and formats pages
- **Register for Events**: Book spots on events that have booking enabled
- **View Own Bookings**: Access "My Bookings" page to see their registered events
- **Cancel Own Bookings**: Cancel their own upcoming bookings with reason
- **Delete Own Cancelled Bookings**: Remove cancelled bookings from their personal records
- **Join Waitlists**: Register for events that are full (if waitlist enabled)

#### ❌ What Students CANNOT do:
- Access admin booking management pages (`/bookings`)
- View other users' bookings
- Manage event booking settings
- Cancel other users' bookings
- Access booking statistics or analytics
- Export booking data

---

### 👨‍🏫 EDUCATOR  
**Access Level:** Resource Management

#### ✅ What Educators CAN do:
- **Everything Students can do** +
- **Access Booking Management**: View `/bookings` page to see all event bookings
- **Manage Event Bookings**: Access `/bookings/[eventId]` to manage bookings for specific events
- **Cancel User Bookings**: Cancel bookings for any user with reason
- **Delete Bookings**: Hard delete cancelled and attended bookings
- **View Booking Statistics**: See booking counts, capacity utilization, etc.
- **Export Booking Data**: Download CSV reports of bookings
- **Manage Booking Settings**: Configure booking options on event-data page
- **Enable/Disable Booking**: Toggle booking functionality for events

#### ❌ What Educators CANNOT do:
- Access system-wide admin functions
- Modify user roles
- Access advanced analytics

---

### 🏥 MEDED_TEAM
**Access Level:** Event Management + Contact Messages

#### ✅ What MedEd Team CAN do:
- **Everything Educators can do** +
- **Full Event Management**: Create, edit, and manage all events
- **Advanced Booking Analytics**: Access detailed booking reports
- **User Communication**: Send messages to users about bookings
- **System Configuration**: Modify booking system settings

#### ❌ What MedEd Team CANNOT do:
- Modify core system settings
- Access user role management

---

### 🎯 CTF (Clinical Teaching Fellow)
**Access Level:** Event Management + Contact Messages

#### ✅ What CTF CAN do:
- **Everything Educators can do** +
- **Full Event Management**: Create, edit, and manage all events  
- **Advanced Booking Analytics**: Access detailed booking reports
- **User Communication**: Send messages to users about bookings
- **System Configuration**: Modify booking system settings

#### ❌ What CTF CANNOT do:
- Modify core system settings
- Access user role management

---

### 👑 ADMIN
**Access Level:** Full System Access

#### ✅ What Admins CAN do:
- **Everything all other roles can do** +
- **Complete System Control**: Full access to all features
- **User Role Management**: Modify user roles and permissions
- **System Configuration**: Change core system settings
- **Data Management**: Access all data and analytics
- **Booking System Administration**: Full control over booking system
- **Delete Any Booking**: Hard delete any booking regardless of status
- **Access All Pages**: No restrictions on any part of the system

---

## Page Access Matrix

| Page/Feature | Student | Educator | MedEd Team | CTF | Admin |
|--------------|---------|----------|------------|-----|-------|
| **Events List** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Calendar View** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Formats View** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Event Details** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Book Event** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **My Bookings** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cancel Own Booking** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Delete Own Cancelled** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Booking Management** (`/bookings`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Event Booking Details** (`/bookings/[id]`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Cancel Any Booking** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Delete Any Booking** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Export Booking Data** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Configure Event Booking** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Enable/Disable Booking** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **View Booking Analytics** | ❌ | ✅ | ✅ | ✅ | ✅ |

## Booking Workflow by Role

### For Students:
1. **Browse Events** → Find interesting events
2. **Register** → Click register button, confirm in modal
3. **Manage Bookings** → View in "My Bookings", cancel if needed
4. **Delete Cancelled** → Remove cancelled bookings from personal records

### For Educators/MedEd Team/CTF/Admin:
1. **Everything Students can do** +
2. **Manage All Bookings** → Access `/bookings` to see all events with bookings
3. **Cancel User Bookings** → Cancel any user's booking with reason
4. **Delete Bookings** → Hard delete cancelled/attended bookings
5. **Configure Events** → Set up booking options for events
6. **Export Data** → Download booking reports

## Special Features by Role

### Booking Modal Enhancements:
- **All Users**: See user details (name, email) in booking confirmation modal
- **Enhanced Styling**: Beautiful gradient buttons and improved layout

### Filter Persistence:
- **All Users**: Filter settings saved in localStorage for:
  - Events List page
  - Calendar page  
  - Formats page
- **Settings Remembered**: Search terms, category filters, view modes, etc.

### Responsive Design:
- **Mobile-First**: All booking pages work perfectly on mobile
- **Single Column Layout**: My Bookings and Bookings pages show one booking per row
- **Enhanced Styling**: Gradient backgrounds, better button styling, improved cards

## Security Notes

- **Row Level Security (RLS)**: Database-level security ensures users only see their own data
- **API Authentication**: All booking APIs verify user authentication and roles
- **Soft Delete**: Bookings are soft-deleted first, then hard-deleted by admins
- **Audit Trail**: All booking changes are logged with user and timestamp information

## Recent Enhancements

1. **Enhanced Register Button**: Beautiful gradient styling with hover effects
2. **Improved Booking Modal**: User details display, better styling, enhanced UX
3. **Filter Persistence**: Remember user preferences across sessions
4. **Single Column Layout**: Better mobile experience for booking pages
5. **Admin Delete for Attended**: Admins can now delete attended bookings
6. **Cancellation Reason Display**: Reasons show properly on My Bookings page
