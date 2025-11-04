# 📋 MedEd Team Onboarding Tour - Detailed Steps Breakdown

**Role:** MedEd Team (`meded_team`)  
**Total Steps:** 15 steps  
**Estimated Duration:** 12-15 minutes  
**Tour Style:** Progressive, building from basics to advanced features

---

## 🎯 Tour Overview

The MedEd Team tour is designed to:
1. **Familiarize** users with core platform features
2. **Empower** users with educator capabilities
3. **Master** advanced administrative tools
4. **Optimize** workflow efficiency

---

## 📍 Step-by-Step Detailed Breakdown

### **STEP 1: Welcome & Dashboard Overview**

**Target Element:** Main dashboard container (`[data-tour="dashboard-main"]`)

**Visual:**
- Spotlight highlights the entire dashboard area
- Dimmed overlay covers the rest of the page
- Tooltip positioned at the center-top

**Content:**

**Title:** "Welcome to Bleepy, [Name]!"

**Body Text:**
```
Welcome to your MedEd Team dashboard! This is your command center where you'll see:

• Upcoming events you're managing
• Quick stats and insights
• Recent activity and notifications
• Fast access to key features

As a MedEd Team member, you have access to both student features and powerful administrative tools for managing events, tracking attendance, and supporting your students.

Let's take a quick tour to show you everything you can do!
```

**Button:** "Let's Begin! →" (Primary, purple gradient)

**Step Position:** 1 of 15

**Interaction:**
- User clicks "Let's Begin!" to proceed
- Can skip entire tour from here
- Tooltip animates in from top with fade effect

---

### **STEP 2: Navigation Sidebar**

**Target Element:** Dashboard sidebar (`[data-tour="sidebar"]` or `aside` sidebar element)

**Visual:**
- Spotlight focuses on the entire sidebar
- Rest of page dimmed
- Tooltip positioned to the right of sidebar

**Content:**

**Title:** "Navigation Hub"

**Body Text:**
```
This sidebar is your navigation hub! Here you can quickly access:

• Dashboard - Return to this overview page
• Calendar & Events - View and manage all events
• AI Simulator - Practice medical scenarios
• Your role-specific tools - Located in the section below

As a MedEd Team member, you'll see additional options like:
→ Event Data Management
→ Contact Messages
→ Student Cohorts
→ And more!

Pro tip: The sidebar can be collapsed to give you more screen space.
```

**Buttons:** 
- "← Previous" (Secondary)
- "Next →" (Primary)

**Step Position:** 2 of 15

**Interaction:**
- User can click sidebar items (tour pauses if they do)
- Highlight pulses to draw attention
- Sidebar section smoothly expands if collapsed

---

### **STEP 3: Upcoming Events Card**

**Target Element:** Upcoming events card/widget (`[data-tour="upcoming-events"]`)

**Visual:**
- Spotlight highlights the events card
- Card has subtle glow/pulse effect
- Tooltip positioned below the card

**Content:**

**Title:** "Upcoming Events"

**Body Text:**
```
This card shows your upcoming events at a glance:

📅 **Events You're Managing**
   - See events you're responsible for
   - Quick view of dates and participants
   - Click to view full details

📊 **Quick Actions**
   - View bookings for events
   - Check attendance status
   - Manage event details

You can filter by:
• Today's events
• This week
• This month
• All upcoming

This is especially useful for MedEd Team members managing multiple events simultaneously.
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 3 of 15

**Interaction:**
- Card may show sample data or actual user events
- Hover effect shows interactivity
- Clicking card details is disabled during tour (or tour pauses)

---

### **STEP 4: AI Patient Simulator Access**

**Target Element:** "Stations" link in sidebar (`[data-tour="ai-simulator"]`)

**Visual:**
- Spotlight highlights the Stations menu item
- Icon pulses with animation
- Tooltip positioned to the right

**Content:**

**Title:** "AI Patient Simulator"

**Body Text:**
```
Practice and test your medical knowledge with our AI-powered patient simulator!

🎯 **Features:**
   • Realistic patient scenarios
   • Interactive consultations
   • AI-powered feedback
   • Progress tracking

📈 **For MedEd Team:**
   While you have access to practice (3 attempts/day), you can also:
   • Review scenarios used by students
   • Understand the learning experience
   • Test scenarios before assigning them

💡 **Tip:** Use this to familiarize yourself with what your students experience!

Click "Stations" in the sidebar anytime to access the simulator.
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 4 of 15

**Interaction:**
- Menu item highlighted with glow
- Icon animates (stethoscope pulsing)
- User can see where to find this feature

---

### **STEP 5: Calendar View**

**Target Element:** Calendar link in sidebar (`[data-tour="calendar"]`)

**Visual:**
- Spotlight on Calendar menu item
- Tooltip positioned to the right

**Content:**

**Title:** "Calendar View"

**Body Text:**
```
View all events in an intuitive calendar format!

📅 **Calendar Features:**
   • Month/Week/Day views
   • Color-coded event types
   • Quick event creation
   • Easy date navigation

👀 **For Event Management:**
   • See all events you're managing in one view
   • Identify scheduling conflicts
   • Plan event sequences
   • View attendance at a glance

The calendar helps you visualize your event schedule and manage overlapping events efficiently.

Perfect for MedEd Team members coordinating multiple teaching sessions!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 5 of 15

**Interaction:**
- Calendar icon highlights
- Can show preview of calendar view if possible

---

### **STEP 6: Events List**

**Target Element:** Events link in sidebar (`[data-tour="events-list"]`)

**Visual:**
- Spotlight on Events menu item
- Tooltip positioned to the right

**Content:**

**Title:** "Browse All Events"

**Body Text:**
```
Browse and search through all available teaching events!

🔍 **Search & Filter:**
   • Search by event name, description, or category
   • Filter by date range
   • Filter by event format (workshop, lecture, etc.)
   • Filter by category

📋 **Event Cards Show:**
   • Event title and description
   • Date, time, and location
   • Booking status and capacity
   • Your role in the event (if applicable)

As MedEd Team, you can see all events and manage the ones you're responsible for. Great for discovering events and checking availability!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 6 of 15

**Interaction:**
- Events icon highlights
- Can show tooltip with search icon animation

---

### **STEP 7: My Bookings**

**Target Element:** My Bookings link (`[data-tour="my-bookings"]`)

**Visual:**
- Spotlight on My Bookings menu item
- Tooltip positioned to the right

**Content:**

**Title:** "Manage Your Bookings"

**Body Text:**
```
See all events you're registered for or managing!

✅ **Your Personal Bookings:**
   • Events you've registered to attend
   • Your schedule at a glance
   • Quick cancellation if needed

🎫 **Events You're Managing:**
   • All events where you're an organizer/facilitator
   • Booking statistics
   • Participant lists
   • Quick management actions

As MedEd Team, you'll often see events here that you're both managing AND potentially attending as a participant.

Click to view detailed booking information and manage registrations.
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 7 of 15

**Interaction:**
- Ticket icon highlights with animation
- Shows both participant and manager perspectives

---

### **STEP 8: My Certificates**

**Target Element:** My Certificates link (`[data-tour="my-certificates"]`)

**Visual:**
- Spotlight on My Certificates menu item
- Tooltip positioned to the right

**Content:**

**Title:** "Your Certificates"

**Body Text:**
```
Access certificates you've earned from completed events!

🏆 **Your Achievements:**
   • View all certificates you've received
   • Download PDF certificates
   • Share accomplishments

📜 **Certificate Details:**
   • Event name and date
   • Completion verification
   • Professional format
   • Shareable links

As a MedEd Team member, you may earn certificates from events you attend, plus you'll learn how to generate certificates for your students (we'll cover that in advanced features)!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 8 of 15

**Interaction:**
- Award icon highlights
- Subtle badge animation

---

### **STEP 9: Profile Settings**

**Target Element:** Profile/Settings link in sidebar (`[data-tour="profile-settings"]`)

**Visual:**
- Spotlight on Profile/Settings menu item
- Tooltip positioned to the right

**Content:**

**Title:** "Your Profile & Settings"

**Body Text:**
```
Manage your account information and preferences!

👤 **Profile Information:**
   • Update your name, email, and photo
   • Set your role and specialty
   • Manage your professional details

⚙️ **Account Settings:**
   • Change password
   • Notification preferences
   • Privacy settings
   • Data export options

🎯 **MedEd Team Specific:**
   • Set your hospital/trust affiliation
   • Update contact information
   • Manage notification settings for event management

💡 **Tip:** You can also restart this tour anytime from your profile page!

Keep your profile up to date so students and colleagues can find and contact you easily.
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 9 of 15

**Interaction:**
- User icon highlights
- Can mention the "Take a Tour" button in profile

---

### **STEP 10: Progress Tracking**

**Target Element:** Progress/Overview link (`[data-tour="progress-tracking"]`)

**Visual:**
- Spotlight on Progress/Overview menu item
- Tooltip positioned to the right

**Content:**

**Title:** "Track Your Progress"

**Body Text:**
```
Monitor your learning journey and achievements!

📊 **Your Statistics:**
   • Events attended and managed
   • Simulator practice sessions
   • Certificates earned
   • Activity timeline

📈 **Visual Analytics:**
   • Progress charts and graphs
   • Achievement milestones
   • Activity trends
   • Engagement metrics

🎯 **For MedEd Team:**
   Track your own professional development while managing student progress through the platform.

Understanding your own progress helps you relate to the student experience!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 10 of 15

**Interaction:**
- Chart/analytics icon highlights
- Progress bar animation in tooltip

**Transition Note:** "Great! Now let's explore your advanced MedEd Team features..."

---

### **STEP 11: Announcements (Educator Feature)**

**Target Element:** Announcements link in role-specific section (`[data-tour="announcements"]`)

**Visual:**
- Spotlight on Announcements menu item
- Tooltip positioned to the right
- Section header highlights

**Content:**

**Title:** "Create Announcements"

**Body Text:**
```
Keep your students informed with announcements!

📢 **What You Can Do:**
   • Create announcements visible to all students
   • Target specific groups or universities
   • Include rich text formatting
   • Schedule announcements in advance

📝 **Announcement Features:**
   • Title and description
   • Priority levels (normal, important, urgent)
   • Expiration dates
   • Attachment support

🎯 **Best Practices:**
   • Use for event reminders
   • Share important updates
   • Announce new resources
   • Communicate schedule changes

Perfect for MedEd Team members who need to communicate with large groups of students efficiently!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 11 of 15

**Interaction:**
- Bell icon pulses
- Shows it's in the role-specific section

---

### **STEP 12: File Requests**

**Target Element:** File Requests link (`[data-tour="file-requests"]`)

**Visual:**
- Spotlight on File Requests menu item
- Tooltip positioned to the right

**Content:**

**Title:** "Manage File Requests"

**Body Text:**
```
Handle file requests from students efficiently!

📁 **Request Management:**
   • View all pending file requests
   • See request details and student information
   • Upload requested files directly
   • Mark requests as completed

📋 **Request Information:**
   • Student name and contact
   • Requested file type/description
   • Urgency and deadline
   • Request history

✅ **Workflow:**
   1. Student submits a file request
   2. You receive notification
   3. Upload the requested file
   4. Student receives automatic notification

This streamlines the process of sharing documents and resources with students who need them!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 12 of 15

**Interaction:**
- Folder icon highlights
- Can show badge if there are pending requests (optional)

---

### **STEP 13: Teaching Requests**

**Target Element:** Teaching Requests link (`[data-tour="teaching-requests"]`)

**Visual:**
- Spotlight on Teaching Requests menu item
- Tooltip positioned to the right

**Content:**

**Title:** "Teaching Request Management"

**Body Text:**
```
Manage requests for teaching sessions and educational content!

🎓 **Request Types:**
   • Requests for new teaching sessions
   • Content creation requests
   • Topic suggestions
   • Workshop requests

📅 **Request Details:**
   • Student/group making request
   • Topic or subject area
   • Preferred format (workshop, lecture, etc.)
   • Suggested dates/times
   • Priority level

🔄 **Management Actions:**
   • Accept and schedule requests
   • Propose alternative dates
   • Decline with reason
   • Convert to events

This helps you stay responsive to student needs and plan your teaching schedule effectively!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 13 of 15

**Interaction:**
- Calendar icon highlights
- Shows connection to event creation

---

### **STEP 14: Resource Management**

**Target Element:** Downloads/Resources section (`[data-tour="resources"]`)

**Visual:**
- Spotlight on Downloads/Resources menu item
- Tooltip positioned to the right

**Content:**

**Title:** "Upload & Manage Resources"

**Body Text:**
```
Create a library of educational resources for your students!

📚 **Resource Types:**
   • PDF documents and guides
   • Video tutorials
   • Image collections
   • Links to external resources

⬆️ **Upload Features:**
   • Drag-and-drop file upload
   • Multiple file selection
   • Automatic file categorization
   • Link resources to specific events

🔍 **Organization:**
   • Categorize by subject/topic
   • Tag for easy searching
   • Link to relevant events
   • Set access permissions

💡 **Pro Tip:** Link resources to events so students automatically have access to relevant materials when they register!

Build a comprehensive resource library that supports all your teaching events.
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 14 of 15

**Interaction:**
- Folder/upload icon highlights
- Can show upload animation

**Transition Note:** "Excellent! Now let's dive into your advanced event management tools..."

---

### **STEP 15: Event Data Management** ⭐ (Key MedEd Feature)

**Target Element:** Event Data link in role-specific section (`[data-tour="event-data"]`)

**Visual:**
- Spotlight on Event Data menu item
- Stronger highlight/pulse effect (this is important!)
- Tooltip positioned to the right
- Badge or indicator showing it's a key feature

**Content:**

**Title:** "⭐ Event Data Management - Your Main Tool!"

**Body Text:**
```
This is your central hub for managing ALL teaching events!

🎯 **Complete Event Control:**
   • Create new events from scratch
   • Edit existing events
   • Duplicate events for recurring sessions
   • Archive or delete events

📝 **Event Details Management:**
   • Title, description, and categories
   • Date, time, and location settings
   • Booking configuration (capacity, waitlist)
   • QR code and attendance settings
   • Feedback form configuration
   • Certificate generation settings

📊 **Event Tabs:**
   • All Events - Browse and search
   • Add Event - Create new events
   • Event Details - Edit existing events
   • Bulk Upload - Import multiple events (we'll cover this next!)

💪 **For MedEd Team:**
   This is where you'll spend most of your time managing the teaching calendar. Master this page and you'll efficiently manage hundreds of events!

Ready to become an event management pro? Let's continue!
```

**Buttons:**
- "← Previous"
- "Next →" (with excitement indicator)

**Step Position:** 15 of 15

**Interaction:**
- List icon pulses strongly
- Can show preview of event data page if possible
- Highlighted as a critical feature

---

### **STEP 16: Bulk Event Upload**

**Target Element:** Bulk Upload option/page (`[data-tour="bulk-upload"]`)

**Visual:**
- If on Event Data page: Highlights Bulk Upload tab/button
- If separate page: Highlights menu item
- Tooltip positioned appropriately

**Content:**

**Title:** "Bulk Event Upload - Time Saver!"

**Body Text:**
```
Upload dozens of events in minutes, not hours!

⚡ **Power Feature:**
   • Upload Excel (.xlsx) or CSV files
   • Import 10, 50, or 100+ events at once
   • Automatic validation and error checking
   • Preview before final import

📋 **File Format:**
   • Download our template
   • Fill in event details (title, date, time, etc.)
   • Upload and review
   • Confirm import

✅ **Validation:**
   • Automatic date format checking
   • Duplicate detection
   • Required field validation
   • Error reporting with row numbers

💡 **Perfect For:**
   • Semester planning
   • Recurring weekly sessions
   • Conference schedules
   • Workshop series

This feature alone can save you hours of manual event creation!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 16 of 15 (wait, that's wrong - this should be step 16, but we said 15 steps... Let me recount)

**Wait, I need to fix the step count. Let me recalculate:**

Actually, looking at the original plan:
- Steps 1-10: Student features (10 steps)
- Steps 11-15: Educator features (5 steps)  
- Steps 16-23: MedEd Team features (8 steps)

Total: 23 steps for MedEd Team

Let me continue with the correct step numbering...

---

### **STEP 17: QR Code Management**

**Target Element:** QR Codes link (`[data-tour="qr-codes"]`)

**Visual:**
- Spotlight on QR Codes menu item
- Tooltip positioned to the right
- QR code icon animation

**Content:**

**Title:** "QR Code Generation & Management"

**Body Text:**
```
Streamline event attendance with QR codes!

📱 **QR Code Features:**
   • Generate unique QR codes for each event
   • Download QR codes as images or PDFs
   • Print-ready formats
   • Automatic code generation on event creation

✅ **Attendance Tracking:**
   • Students scan QR code at event
   • Instant attendance recording
   • No manual check-in needed
   • Real-time attendance dashboard

🎯 **Workflow:**
   1. Create or edit event
   2. Enable QR code attendance (automatic)
   3. Download/print QR code
   4. Display at event venue
   5. Students scan on arrival
   6. View attendance in real-time

💡 **Best Practices:**
   • Print large QR codes for visibility
   • Have backup QR codes
   • Test scanning before event
   • Include QR code in event materials

Perfect for workshops, lectures, and any event where you need quick, accurate attendance!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 17 of 23

**Interaction:**
- QR code icon shows animation
- Can show sample QR code in tooltip

---

### **STEP 18: Attendance Tracking**

**Target Element:** Attendance Tracking link (`[data-tour="attendance-tracking"]`)

**Visual:**
- Spotlight on Attendance Tracking menu item
- Tooltip positioned to the right
- Users icon highlights

**Content:**

**Title:** "Attendance Tracking & Analytics"

**Body Text:**
```
Monitor and analyze event attendance data!

📊 **Attendance Dashboard:**
   • View attendance for all events
   • Real-time attendance during events
   • Historical attendance data
   • Attendance rate statistics

👥 **Per-Event View:**
   • See who attended each event
   • Compare expected vs. actual attendance
   • Export attendance lists
   • Mark manual attendance (if needed)

📈 **Analytics:**
   • Attendance trends over time
   • Most popular events
   • Student attendance patterns
   • Capacity utilization

🔍 **Search & Filter:**
   • Filter by event, date range, student
   • Search specific attendees
   • Export data for reporting

💡 **Use Cases:**
   • Track mandatory attendance events
   • Identify students who need support
   • Plan future event capacity
   • Generate attendance reports

Essential for MedEd Team members managing compliance and student engagement!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 18 of 23

**Interaction:**
- Users/people icon highlights
- Can show attendance chart preview

---

### **STEP 19: Feedback Management**

**Target Element:** Feedback link (`[data-tour="feedback"]`)

**Visual:**
- Spotlight on Feedback menu item
- Tooltip positioned to the right
- Message/feedback icon highlights

**Content:**

**Title:** "Collect & Analyze Event Feedback"

**Body Text:**
```
Gather valuable insights from event participants!

📝 **Feedback Collection:**
   • Automatic feedback forms for events
   • Customizable feedback questions
   • Optional or required feedback
   • Email reminders to submit feedback

📊 **Feedback Dashboard:**
   • View all feedback submissions
   • Filter by event, date, or rating
   • Read individual responses
   • Export feedback data

📈 **Analytics:**
   • Average ratings per event
   • Feedback trends over time
   • Common themes and suggestions
   • Response rate statistics

💬 **Response Management:**
   • Reply to feedback directly
   • Mark feedback as reviewed
   • Flag important feedback
   • Follow up on concerns

🎯 **Improvement Loop:**
   Use feedback to:
   • Improve future events
   • Address student concerns
   • Recognize successful sessions
   • Plan better content

Feedback helps you continuously improve the learning experience!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 19 of 23

**Interaction:**
- Message circle icon highlights
- Can show feedback form preview

---

### **STEP 20: Certificate Management**

**Target Element:** Certificates link (`[data-tour="certificates"]`)

**Visual:**
- Spotlight on Certificates menu item
- Tooltip positioned to the right
- Award/trophy icon highlights

**Content:**

**Title:** "Generate Professional Certificates"

**Body Text:**
```
Automatically create certificates for event completion!

🏆 **Certificate Generation:**
   • Automatic certificate creation on event completion
   • Professional, branded certificate design
   • PDF format for easy sharing
   • Downloadable by students

⚙️ **Configuration:**
   • Enable/disable certificates per event
   • Set certificate requirements (attendance, feedback, etc.)
   • Customize certificate template
   • Add event-specific details

📋 **Certificate Management:**
   • View all generated certificates
   • Search by student or event
   • Re-generate certificates if needed
   • Track certificate distribution

✅ **Automation:**
   Certificates are automatically:
   • Generated when requirements met
   • Emailed to students
   • Available in student's "My Certificates"
   • Stored for your records

💡 **Best Practices:**
   • Set clear completion requirements
   • Include meaningful event information
   • Make certificates professional and shareable
   • Use for CPD/CME credit documentation

Help students document their learning achievements professionally!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 20 of 23

**Interaction:**
- Award icon highlights with glow
- Can show certificate preview

---

### **STEP 21: Contact Messages**

**Target Element:** Contact Messages link (`[data-tour="contact-messages"]`)

**Visual:**
- Spotlight on Contact Messages menu item
- Tooltip positioned to the right
- Message square icon highlights
- Can show notification badge if messages exist

**Content:**

**Title:** "Manage Platform Communications"

**Body Text:**
```
Centralized hub for all user inquiries and messages!

💬 **Message Center:**
   • View all contact form submissions
   • See messages from students, educators, and visitors
   • Filter by status (new, read, replied, archived)
   • Search message history

📧 **Message Details:**
   • Sender information and contact details
   • Message subject and content
   • Submission timestamp
   • Attachment downloads (if any)

✅ **Status Management:**
   • Mark as "New" - Unread message
   • Mark as "Read" - Under review
   • Mark as "Replied" - Response sent
   • Archive - Long-term storage

📝 **Response Tools:**
   • Reply directly via email
   • Add internal notes
   • Assign to team members
   • Set follow-up reminders

🎯 **Quick Actions:**
   • Prioritize urgent messages
   • Bulk status updates
   • Export message data
   • Delete spam/inappropriate messages

Stay on top of all platform communications and provide excellent support!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 21 of 23

**Interaction:**
- Message icon highlights
- Can show message count badge
- Pulse animation if unread messages exist

---

### **STEP 22: Student Cohorts**

**Target Element:** Student Cohorts link (`[data-tour="student-cohorts"]`)

**Visual:**
- Spotlight on Student Cohorts menu item
- Tooltip positioned to the right
- Graduation cap icon highlights

**Content:**

**Title:** "Student Cohort Analytics & Management"

**Body Text:**
```
Comprehensive analytics and insights into your student population!

👥 **Cohort Overview:**
   • View all students organized by university
   • See breakdown by year of study
   • Track verification status
   • Monitor student engagement

📊 **Analytics Dashboard:**
   • Total student counts per institution
   • Year-wise distribution
   • Verification rates
   • Activity statistics

🏫 **University Breakdown:**
   • ARU (Anglia Ruskin University)
   • UCL (University College London)
   • Other institutions
   • Unaffiliated students

📈 **Key Metrics:**
   • Total students
   • Verified vs. unverified
   • Active vs. inactive
   • Engagement trends

🔍 **Insights:**
   Use cohort data to:
   • Plan institution-specific events
   • Identify student needs
   • Track enrollment trends
   • Measure platform adoption

💡 **Data-Driven Decisions:**
   Make informed decisions about:
   • Event planning and capacity
   • Resource allocation
   • Student support needs
   • Program development

Essential analytics for MedEd Team members managing large student populations!
```

**Buttons:**
- "← Previous"
- "Next →"

**Step Position:** 22 of 23

**Interaction:**
- Graduation cap icon highlights
- Can show chart/graph preview in tooltip

---

### **STEP 23: Tour Completion & Summary** 🎉

**Target Element:** Center of screen (no specific element)

**Visual:**
- Large centered modal/overlay
- Celebration animation (confetti, checkmark)
- Dimmed background
- Success-themed colors (green, gold)

**Content:**

**Title:** "🎉 Congratulations! Tour Complete!"

**Body Text:**
```
You've completed the Bleepy onboarding tour!

**You Now Know:**
✅ How to navigate the platform
✅ How to access core features
✅ How to manage events efficiently
✅ How to track attendance and feedback
✅ How to generate certificates
✅ How to communicate with students
✅ How to analyze student data

**Quick Reference:**
• Event Data - Your main event management hub
• QR Codes - For easy attendance tracking
• Bulk Upload - Save time with multiple events
• Certificates - Automate professional documentation
• Contact Messages - Centralized communications
• Student Cohorts - Data-driven insights

**Next Steps:**
1. Explore the platform at your own pace
2. Create your first event (if you haven't already)
3. Try uploading resources for students
4. Set up your first feedback form
5. Generate a test certificate

**Need Help?**
• Restart this tour anytime from your Profile page
• Check the Help & Support section
• Contact platform administrators

**Ready to get started?** Let's make medical education better together!
```

**Buttons:**
- "Explore Dashboard →" (Primary, large)
- "View Profile Settings" (Secondary)
- "Restart Tour" (Tertiary, small)

**Step Position:** 23 of 23

**Interaction:**
- Confetti animation on completion
- Success checkmark animation
- User can choose next action
- Tour completion saved to database

**Completion Actions:**
- Automatically marks `onboarding_completed = true` in database
- Sets `onboarding_completed_at` timestamp
- User won't see tour again unless they restart from profile

---

## 🎨 Visual Design Specifications

### Tooltip Styling
- **Background:** White with subtle gradient
- **Border:** 2px solid purple (#9333EA)
- **Border Radius:** 12px
- **Shadow:** 0 8px 24px rgba(0,0,0,0.15)
- **Padding:** 24px
- **Max Width:** 400px (responsive)

### Spotlight Effect
- **Overlay Color:** rgba(0,0,0,0.6)
- **Highlight Border:** 3px solid purple (#9333EA)
- **Border Radius:** 8px
- **Animation:** Subtle pulse (2s ease-in-out infinite)

### Typography
- **Title:** 20px, bold, purple (#9333EA)
- **Body:** 14px, regular, gray-700
- **Buttons:** 14px, medium weight

### Icons
- **Size:** 20px x 20px
- **Color:** Purple (#9333EA) for highlights
- **Animation:** Pulse on important features

### Progress Indicator
- **Position:** Bottom of tooltip
- **Format:** "Step X of 23"
- **Style:** Progress bar with percentage
- **Color:** Purple gradient

---

## 🔄 Navigation Flow

### Button States
- **Previous:** Disabled on step 1
- **Next:** Becomes "Finish" on last step
- **Skip:** Available on all steps (top-right corner)

### Keyboard Navigation
- **Arrow Right:** Next step
- **Arrow Left:** Previous step
- **Escape:** Skip/Exit tour
- **Enter:** Confirm/Continue

### Tour Pausing
- Tour pauses if user:
  - Clicks outside highlighted area
  - Navigates to different page
  - Interacts with form elements
- Resume option appears as notification

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Tooltip full-width with padding
- Positioned at bottom of screen
- Larger touch targets
- Simplified content

### Tablet (768px - 1024px)
- Tooltip max-width: 350px
- Adaptive positioning
- Touch-optimized buttons

### Desktop (> 1024px)
- Tooltip max-width: 400px
- Optimal positioning
- Full feature set

---

## 🎯 Success Metrics

### Tour Completion
- Track completion rate per role
- Time to complete
- Steps skipped most often
- User satisfaction

### Feature Adoption
- Measure feature usage post-tour
- Compare users who completed vs. skipped
- Identify features needing better explanation

---

**This detailed breakdown provides exact content, interactions, and visual specifications for implementing the MedEd Team onboarding tour!**
