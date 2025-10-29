# Advanced Features Flow - Scenarios

## Overview
This document outlines different scenarios for the Advanced Features configuration based on various checkbox combinations in the event booking system.

---

## 🎯 Scenario 1: QR Code Only (Minimal Setup)
```
☑️ Enable QR Code Attendance Tracking
☐ Auto-generate certificates
```

**Flow:**
1. Student scans QR → Attendance marked
2. Student receives feedback form email
3. Student completes feedback (optional)
4. **No certificate generation**

**Use Case:** Events where you only want to track attendance and collect feedback, but don't need certificates.

---

## 🎯 Scenario 2: QR + Auto-Certificate (Full Automation)
```
☑️ Enable QR Code Attendance Tracking  
☑️ Auto-generate certificates
   ☑️ Generate after feedback completion
   ☑️ Send certificates via email
```

**Flow:**
1. Student scans QR → Attendance marked
2. Student receives feedback form email
3. Student completes feedback (required)
4. Certificate auto-generated and emailed
5. Complete automation

**Use Case:** Professional development events where certificates are required and you want full automation.

---

## 🎯 Scenario 3: QR + Manual Certificate (Controlled)
```
☑️ Enable QR Code Attendance Tracking
☑️ Auto-generate certificates
   ☐ Generate after feedback completion
   ☑️ Send certificates via email
```

**Flow:**
1. Student scans QR → Attendance marked
2. Student receives feedback form email
3. Student completes feedback (optional)
4. Certificate auto-generated immediately after QR scan
5. Certificate emailed

**Use Case:** Events where attendance alone qualifies for certificates, feedback is optional.

---

## 🎯 Scenario 4: QR + Manual Approval (Quality Control)
```
☑️ Enable QR Code Attendance Tracking
☑️ Auto-generate certificates
   ☑️ Generate after feedback completion
   ☐ Send certificates via email
```

**Flow:**
1. Student scans QR → Attendance marked
2. Student receives feedback form email
3. Student completes feedback (required)
4. Certificate generated but **not sent**
5. MedEd team manually reviews and sends certificates

**Use Case:** High-stakes events where you want to review feedback before issuing certificates.

---

## 🎯 Scenario 5: QR + Deadline-Based (Time-Sensitive)
```
☑️ Enable QR Code Attendance Tracking
☑️ Auto-generate certificates
   ☑️ Generate after feedback completion
   ☑️ Send certificates via email
   📅 Feedback Deadline: 7 days
```

**Flow:**
1. Student scans QR → Attendance marked
2. Student receives feedback form email
3. Student has 7 days to complete feedback
4. If completed within deadline → Certificate generated and emailed
5. If missed deadline → No certificate (or manual review)

**Use Case:** Time-sensitive events where feedback must be collected within a specific timeframe.

---

## 🎯 Scenario 6: QR + No Feedback Required (Attendance Only)
```
☑️ Enable QR Code Attendance Tracking
☑️ Auto-generate certificates
   ☐ Generate after feedback completion
   ☑️ Send certificates via email
```

**Flow:**
1. Student scans QR → Attendance marked
2. Certificate generated immediately
3. Certificate emailed
4. **No feedback form sent**

**Use Case:** Simple attendance-based certificates where feedback collection is not needed.

---

## 🔄 Scenario Comparison Matrix

| Scenario | QR Code | Auto-Cert | After Feedback | Email Cert | Deadline | Use Case |
|----------|---------|-----------|----------------|------------|----------|----------|
| 1 | ✅ | ❌ | N/A | N/A | N/A | Attendance tracking only |
| 2 | ✅ | ✅ | ✅ | ✅ | Optional | Full automation |
| 3 | ✅ | ✅ | ❌ | ✅ | N/A | Attendance-based certs |
| 4 | ✅ | ✅ | ✅ | ❌ | Optional | Quality control |
| 5 | ✅ | ✅ | ✅ | ✅ | ✅ | Time-sensitive |
| 6 | ✅ | ✅ | ❌ | ✅ | N/A | Simple attendance certs |

---

## 🎨 UI State Examples

### Scenario 2 (Full Automation) - UI State:
```
☑️ Enable QR Code Attendance Tracking
   📝 Feedback Form Template: [Workshop Template ▼]
   
☑️ Auto-generate certificates
   ☑️ Generate after feedback completion
   ☑️ Send certificates via email
   📅 Feedback Deadline: [7 days ▼]
```

### Scenario 4 (Quality Control) - UI State:
```
☑️ Enable QR Code Attendance Tracking
   📝 Feedback Form Template: [Custom Form ▼]
   
☑️ Auto-generate certificates
   ☑️ Generate after feedback completion
   ☐ Send certificates via email
   📅 Feedback Deadline: [No deadline ▼]
```

---

## 🚀 Implementation Notes

1. **Default State**: Scenario 1 (QR Code only) should be the default when enabling QR attendance
2. **Progressive Disclosure**: Show certificate options only when QR is enabled
3. **Validation**: Ensure logical combinations (e.g., can't have "after feedback" without feedback form)
4. **User Guidance**: Provide clear descriptions for each scenario
5. **Template Integration**: Feedback form templates should be selectable when QR is enabled

---

## 📋 Testing Checklist

- [ ] Test each scenario with different checkbox combinations
- [ ] Verify feedback form creation based on template selection
- [ ] Test certificate generation logic for each scenario
- [ ] Validate email sending behavior
- [ ] Test deadline enforcement for time-sensitive scenarios
- [ ] Verify UI state changes based on selections
- [ ] Test edge cases (disabling QR after enabling certificates)
