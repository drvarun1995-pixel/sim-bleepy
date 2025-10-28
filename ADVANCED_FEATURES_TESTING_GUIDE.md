# Advanced Features Testing Guide

## 🎯 Overview
This guide covers testing all 4 scenarios for the Advanced Features section in event booking configuration.

## 📋 Test Scenarios

### **Scenario 1: Full Flow (QR + Auto-Certificates + Feedback Required)**
**Configuration:**
- ✅ Enable QR Code Attendance Tracking
- ✅ Auto-generate certificates
- ✅ Certificate Template selected
- ✅ Generate after feedback completion
- ✅ Send certificates via email

**Expected Flow:**
1. Student scans QR code → Attendance marked
2. Student receives feedback form email
3. Student completes feedback form
4. Certificate automatically generated and sent via email

**Test Steps:**
1. Create event with above configuration
2. Generate QR code for event
3. Scan QR code as a student
4. Check email for feedback form
5. Complete feedback form
6. Verify certificate generation and email

---

### **Scenario 2: QR + Auto-Certificates (No Feedback Required)**
**Configuration:**
- ✅ Enable QR Code Attendance Tracking
- ✅ Auto-generate certificates
- ✅ Certificate Template selected
- ❌ Generate after feedback completion (UNCHECKED)
- ✅ Send certificates via email

**Expected Flow:**
1. Student scans QR code → Attendance marked
2. Certificate automatically generated after event ends
3. No feedback form sent

**Test Steps:**
1. Create event with above configuration
2. Generate QR code for event
3. Scan QR code as a student
4. Wait for event to end (or manually trigger via API)
5. Verify certificate generation without feedback

---

### **Scenario 3: QR Only (No Certificates)**
**Configuration:**
- ✅ Enable QR Code Attendance Tracking
- ❌ Auto-generate certificates

**Expected Flow:**
1. Student scans QR code → Attendance marked
2. No certificates generated
3. No feedback forms sent

**Test Steps:**
1. Create event with above configuration
2. Generate QR code for event
3. Scan QR code as a student
4. Verify attendance is marked
5. Verify no certificates or feedback forms

---

### **Scenario 4: QR + Manual Certificate Generation**
**Configuration:**
- ✅ Enable QR Code Attendance Tracking
- ❌ Auto-generate certificates

**Expected Flow:**
1. Student scans QR code → Attendance marked
2. Admin manually generates certificates later
3. No automatic certificate generation

**Test Steps:**
1. Create event with above configuration
2. Generate QR code for event
3. Scan QR code as a student
4. Manually generate certificates via admin panel
5. Verify manual certificate generation works

---

## 🧪 Testing Checklist

### **Pre-Test Setup**
- [ ] Ensure you have admin/meded_team/ctf role
- [ ] Create at least one certificate template
- [ ] Have test student accounts ready
- [ ] Check email configuration is working

### **QR Code Functionality**
- [ ] QR codes generate correctly
- [ ] QR codes display on QR codes page
- [ ] QR code scanning works
- [ ] Attendance is marked correctly
- [ ] Real-time scan count updates

### **Certificate Generation**
- [ ] Templates load correctly
- [ ] Template selection validation works
- [ ] Auto-generation triggers correctly
- [ ] Manual generation works
- [ ] Email sending works

### **Feedback Forms**
- [ ] Forms auto-create when QR enabled
- [ ] Forms send via email after QR scan
- [ ] Form submission works
- [ ] Certificate generation after feedback

### **Event Status Management**
- [ ] Events transition from scheduled → in-progress
- [ ] Events transition from in-progress → completed
- [ ] Certificate generation triggers on completion

### **Validation & Error Handling**
- [ ] Template selection required when auto-generate enabled
- [ ] Feedback deadline required when feedback required
- [ ] Clear error messages shown
- [ ] User guidance is helpful

---

## 🔧 Manual Testing Commands

### **Test Event Status Updates**
```bash
# Run event status update script
node scripts/update-event-statuses.js
```

### **Test Certificate Generation for Ended Events**
```bash
# Run certificate generation script
node scripts/process-ended-events.js
```

### **Test API Endpoints**
```bash
# Test event status update API
curl -X POST http://localhost:3000/api/events/update-status

# Test certificate generation API
curl -X POST http://localhost:3000/api/events/process-ended-events
```

---

## 🐛 Common Issues & Solutions

### **QR Code Not Generating**
- Check if event has booking enabled
- Verify QR attendance is enabled
- Check console for errors

### **Certificates Not Generating**
- Verify template is selected
- Check if event has ended
- Verify auto-generate is enabled
- Check certificate generation logs

### **Feedback Forms Not Sending**
- Check email configuration
- Verify feedback form exists
- Check email sending logs

### **Event Status Not Updating**
- Check cron job is running
- Verify event times are correct
- Check event status update logs

---

## 📊 Expected Results

### **QR Codes Page**
- Shows correct status based on configuration
- Displays appropriate instructions for students
- Updates in real-time

### **Event Data Page**
- Shows validation errors clearly
- Provides helpful guidance
- Auto-creates feedback forms when needed

### **Student Experience**
- Smooth QR code scanning
- Clear instructions
- Appropriate follow-up actions

---

## 🚀 Production Deployment Notes

### **Cron Jobs Setup**
1. Set up cron job for event status updates (every 15-30 minutes)
2. Set up cron job for certificate generation (every hour)
3. Monitor logs for errors

### **Environment Variables**
- Ensure all required env vars are set
- Check email service configuration
- Verify Supabase permissions

### **Database Permissions**
- Ensure RLS policies allow certificate generation
- Check user role permissions
- Verify API access

---

## ✅ Success Criteria

- [ ] All 4 scenarios work correctly
- [ ] No critical errors in console
- [ ] User experience is smooth
- [ ] Validation works as expected
- [ ] Automated processes run correctly
- [ ] Email delivery works
- [ ] Certificate generation works
- [ ] QR code functionality works
