/**
 * System email bodies using the shared year-progression chrome.
 * Safe for client preview pages.
 */

import {
  EMAIL_SITE,
  bulletList,
  detailBlock,
  escapeHtml,
  greeting,
  infoBanner,
  p,
  wrapEmailHtml,
} from '@/lib/email-templates/layout'

export type BuiltEmail = { id: string; label: string; group: 'learner' | 'admin'; subject: string; html: string }

function roleDisplayName(role: string) {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'Administrator'
    case 'educator':
      return 'Educator'
    case 'student':
      return 'Student'
    case 'meded_team':
      return 'MedEd Team'
    case 'ctf':
      return 'CTF'
    default:
      return role
  }
}

function roleDescription(role: string) {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'Full administrative access to manage users, content, and system settings.'
    case 'educator':
      return 'Ability to create announcements, manage educational content, and view student progress.'
    case 'meded_team':
      return 'Event management, resources, and medical education team tools.'
    case 'ctf':
      return 'Clinical teaching fellow tools including events, portfolios, and teaching resources.'
    case 'student':
      return 'Access to clinical scenarios, practice sessions, and learning resources.'
    default:
      return 'Access to platform features based on your role.'
  }
}

export function buildVerificationEmail(data: { name: string; verificationUrl: string }): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Verify Your Email',
    headline: 'Welcome to Bleepy',
    footerKind: 'learner',
    reasonLine: 'You received this because a Bleepy account was created with this email address.',
    bodyHtml:
      greeting(data.name) +
      p('Thank you for signing up for Bleepy — your AI-powered medical training platform.') +
      p('To complete your registration and start practising clinical scenarios, please verify your email address.') +
      infoBanner(
        'What’s next?',
        bulletList([
          'Practice with AI patients in realistic scenarios',
          'Get detailed feedback on your clinical skills',
          'Track your progress over time',
        ])
      ) +
      infoBanner(
        'If the button does not work',
        `<p style="margin:0;word-break:break-all;font-family:monospace;font-size:12px;color:#374151;">${escapeHtml(data.verificationUrl)}</p>`
      ) +
      p('<strong>This verification link expires in 48 hours.</strong> If you did not create an account, you can ignore this email.'),
    ctas: [{ href: data.verificationUrl, label: 'Verify email address' }],
  })
  return { id: 'verify', label: 'Verify email', group: 'learner', subject: 'Verify your email - Bleepy', html }
}

export function buildPasswordResetEmail(data: { name: string; resetUrl: string }): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Reset Your Password',
    headline: 'Password reset request',
    footerKind: 'learner',
    reasonLine: 'You received this because a password reset was requested for this Bleepy account.',
    bodyHtml:
      greeting(data.name) +
      p('We received a request to reset your password for your Bleepy account.') +
      infoBanner(
        'Security notice',
        'If you did not request this, you can ignore this email. Your account remains secure. This link expires in 1 hour.'
      ) +
      infoBanner(
        'If the button does not work',
        `<p style="margin:0;word-break:break-all;font-family:monospace;font-size:12px;color:#374151;">${escapeHtml(data.resetUrl)}</p>`
      ),
    ctas: [{ href: data.resetUrl, label: 'Reset password' }],
  })
  return { id: 'password-reset', label: 'Password reset', group: 'learner', subject: 'Reset your password - Bleepy', html }
}

export function buildAccountApprovalEmail(data: { name: string }): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Account Approved - Bleepy',
    headline: 'Account approved',
    footerKind: 'learner',
    bodyHtml:
      greeting(data.name) +
      p('<strong>Your Bleepy account has been approved.</strong> You can now access the platform and start practising with AI-powered clinical scenarios.') +
      infoBanner(
        'What you can do now',
        bulletList([
          'Practice with AI patients in realistic clinical scenarios',
          'Receive detailed feedback on your clinical skills',
          'Track your progress over time',
          'Join educational events and workshops',
        ])
      ) +
      p(`Need help getting started? See our <a href="${EMAIL_SITE}/tutorials" style="color:#1d4ed8;">tutorials</a> or contact the team.`),
    ctas: [{ href: `${EMAIL_SITE}/dashboard`, label: 'Open your dashboard' }],
  })
  return {
    id: 'account-approved',
    label: 'Account approved',
    group: 'learner',
    subject: 'Account Approved - Welcome to Bleepy!',
    html,
  }
}

export function buildRoleChangeEmail(data: { name: string; oldRole: string; newRole: string }): BuiltEmail {
  const newLabel = roleDisplayName(data.newRole)
  const html = wrapEmailHtml({
    title: 'Role Updated - Bleepy',
    headline: 'Your role has been updated',
    footerKind: 'learner',
    bodyHtml:
      greeting(data.name) +
      p(`Your Bleepy account role has changed from <strong>${escapeHtml(roleDisplayName(data.oldRole))}</strong> to <strong>${escapeHtml(newLabel)}</strong>.`) +
      infoBanner('What this means', `<p style="margin:0 0 8px 0;">${escapeHtml(roleDescription(data.newRole))}</p>`) +
      p('If this does not look right, contact your medical education team.'),
    ctas: [{ href: `${EMAIL_SITE}/dashboard`, label: 'Open your dashboard' }],
  })
  return {
    id: 'role-change',
    label: 'Role changed',
    group: 'learner',
    subject: `Role Updated to ${newLabel} - Bleepy`,
    html,
  }
}

export function buildAccountCreatedEmail(data: {
  name: string
  email: string
  role: string
  password: string
  loginUrl: string
}): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Account Created - Bleepy',
    headline: 'Your account has been created',
    footerKind: 'learner',
    reasonLine: 'You received this because an administrator created a Bleepy account for you.',
    bodyHtml:
      greeting(data.name) +
      p('Your Bleepy account has been created by an administrator. You now have access to the medical education platform.') +
      infoBanner(
        'Your login credentials',
        detailBlock([
          { label: 'Email', value: `<span style="font-family:monospace;">${escapeHtml(data.email)}</span>` },
          { label: 'Password', value: `<span style="font-family:monospace;font-weight:700;">${escapeHtml(data.password)}</span>` },
          { label: 'Role', value: escapeHtml(data.role.charAt(0).toUpperCase() + data.role.slice(1)) },
        ]) + '<p style="margin:8px 0 0 0;">You will be asked to change this password on first login.</p>'
      ) +
      infoBanner(
        'What’s next?',
        bulletList([
          'Sign in and set a new password',
          'Explore teaching events, resources, and portfolio tools',
          'Complete your profile so we can show the right content',
        ])
      ),
    ctas: [{ href: data.loginUrl, label: 'Log in to your account' }],
  })
  return {
    id: 'account-created',
    label: 'Account created',
    group: 'learner',
    subject: 'Your Bleepy Account Has Been Created',
    html,
  }
}

export function buildCertificateEmail(data: {
  recipientName: string
  eventTitle: string
  eventDate: string
  eventLocation?: string
  eventDuration?: string
  certificateUrl: string
  certificateId: string
  isGuestAccess?: boolean
  hasAttachment?: boolean
}): BuiltEmail {
  const viewUrl = data.certificateUrl || `${EMAIL_SITE}/mycertificates`
  const rows = [
    { label: 'Title', value: escapeHtml(data.eventTitle) },
    { label: 'Date', value: escapeHtml(data.eventDate) },
  ]
  if (data.eventLocation) rows.push({ label: 'Location', value: escapeHtml(data.eventLocation) })
  if (data.eventDuration) rows.push({ label: 'Duration', value: escapeHtml(data.eventDuration) })
  rows.push({
    label: 'Certificate ID',
    value: `<span style="font-family:monospace;">${escapeHtml(data.certificateId)}</span>`,
  })

  const html = wrapEmailHtml({
    title: `Your Certificate - ${data.eventTitle}`,
    headline: 'Your certificate of attendance',
    footerKind: 'learner',
    bodyHtml:
      greeting(data.recipientName) +
      p(`You successfully attended <strong>${escapeHtml(data.eventTitle)}</strong> on ${escapeHtml(data.eventDate)}.`) +
      p('Use the button below to view and download your certificate.') +
      (data.hasAttachment ? p('Your certificate is also attached to this email as a PNG file.') : '') +
      (data.isGuestAccess
        ? p('No login is required — use the secure link to view and download your certificate.')
        : p(`You can also find all certificates in your <a href="${EMAIL_SITE}/mycertificates" style="color:#1d4ed8;">certificate dashboard</a>.`)) +
      infoBanner('Event details', detailBlock(rows)) +
      infoBanner('Tip', 'Keep this certificate for your professional portfolio and CPD records.'),
    ctas: [
      {
        href: viewUrl,
        label: data.isGuestAccess ? 'View / download certificate' : 'View my certificates',
      },
    ],
  })
  return {
    id: 'certificate',
    label: 'Certificate',
    group: 'learner',
    subject: `Your Certificate for ${data.eventTitle}`,
    html,
  }
}

export function buildCertificateAutoGeneratedEmail(data: {
  recipientName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventDuration: string
  certificateUrl: string
  certificateId: string
  isGuestAccess?: boolean
  hasAttachment?: boolean
}): BuiltEmail {
  const viewUrl = data.certificateUrl || `${EMAIL_SITE}/mycertificates`
  const html = wrapEmailHtml({
    title: `Certificate Generated - ${data.eventTitle}`,
    headline: 'Certificate generated',
    footerKind: 'learner',
    bodyHtml:
      greeting(data.recipientName) +
      p('Your certificate was generated automatically after you completed the feedback form.') +
      infoBanner(
        'Event details',
        detailBlock([
          { label: 'Title', value: escapeHtml(data.eventTitle) },
          { label: 'Date', value: escapeHtml(data.eventDate) },
          { label: 'Location', value: escapeHtml(data.eventLocation) },
          { label: 'Duration', value: escapeHtml(data.eventDuration) },
          {
            label: 'Certificate ID',
            value: `<span style="font-family:monospace;">${escapeHtml(data.certificateId)}</span>`,
          },
        ])
      ) +
      (data.isGuestAccess ? p('No login is required — use the secure link to open your certificate.') : '') +
      (data.hasAttachment ? p('Your certificate is also attached to this email as a PNG file.') : '') +
      infoBanner('Tip', 'Keep this certificate for your professional portfolio and CPD records.'),
    ctas: [
      {
        href: viewUrl,
        label: data.isGuestAccess ? 'View / download certificate' : 'Download your certificate',
      },
    ],
  })
  return {
    id: 'certificate-auto',
    label: 'Certificate (auto-generated)',
    group: 'learner',
    subject: `Your Certificate for ${data.eventTitle} has been Generated!`,
    html,
  }
}

export function buildFeedbackFormEmail(data: {
  recipientName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  feedbackFormUrl: string
  feedbackRequiredForCertificate?: boolean
  isGuestAccess?: boolean
}): BuiltEmail {
  const required = !!data.feedbackRequiredForCertificate
  const html = wrapEmailHtml({
    title: `Feedback Request - ${data.eventTitle}`,
    headline: required ? 'Feedback required for your certificate' : 'Please complete feedback',
    footerKind: 'learner',
    bodyHtml:
      greeting(data.recipientName) +
      p(`Thank you for attending <strong>${escapeHtml(data.eventTitle)}</strong> on ${escapeHtml(data.eventDate)} at ${escapeHtml(data.eventTime)}.`) +
      (required
        ? infoBanner(
            'Certificate requires feedback',
            'Feedback is required before your certificate can be released. Once you submit this form, your certificate will be generated and emailed to you automatically.'
          )
        : infoBanner(
            'Your feedback matters',
            'We would love to hear about your experience. Your feedback helps us improve our medical education programmes.'
          )) +
      (data.isGuestAccess
        ? p('No login is required — use the secure link in this email to complete your feedback.')
        : p('You can also open this form later from My Bookings in Bleepy.')),
    ctas: [{ href: data.feedbackFormUrl, label: 'Complete feedback form' }],
  })
  return {
    id: 'feedback',
    label: 'Feedback invite',
    group: 'learner',
    subject: required
      ? `Feedback required for your certificate — ${data.eventTitle}`
      : `Please complete feedback for ${data.eventTitle}`,
    html,
  }
}

export function buildAttendanceThankYouEmail(data: {
  recipientName: string
  eventTitle: string
  eventDate: string
  eventTime: string
}): BuiltEmail {
  const html = wrapEmailHtml({
    title: `Thank You - ${data.eventTitle}`,
    headline: 'Thank you for attending',
    footerKind: 'learner',
    bodyHtml:
      greeting(data.recipientName) +
      p(`Thank you for attending <strong>${escapeHtml(data.eventTitle)}</strong> on ${escapeHtml(data.eventDate)} at ${escapeHtml(data.eventTime)}.`) +
      p('We appreciate you taking the time to attend. If you have questions or feedback, please get in touch.'),
    ctas: [{ href: `${EMAIL_SITE}/events-list`, label: 'Browse more events' }],
  })
  return {
    id: 'attendance-thanks',
    label: 'Attendance thank you',
    group: 'learner',
    subject: `Thank you for attending ${data.eventTitle}`,
    html,
  }
}

export function buildConnectionRequestEmail(data: {
  recipientName: string
  requesterName: string
  connectionType: 'friend' | 'mentor'
  respondUrl: string
}): BuiltEmail {
  const kind = data.connectionType === 'friend' ? 'friend' : 'mentor'
  const html = wrapEmailHtml({
    title: `New ${kind} request on Bleepy`,
    headline: `New ${kind} request`,
    footerKind: 'learner',
    bodyHtml:
      greeting(data.recipientName) +
      p(`<strong>${escapeHtml(data.requesterName)}</strong> has sent you a ${kind} request on Bleepy. Review the invitation to decide how you would like to connect.`) +
      infoBanner(
        'If the button does not work',
        `<p style="margin:0;word-break:break-all;font-family:monospace;font-size:12px;">${escapeHtml(data.respondUrl)}</p>`
      ),
    ctas: [
      { href: data.respondUrl, label: 'Review request' },
      { href: `${EMAIL_SITE}/connections`, label: 'Manage connections', variant: 'secondary' },
    ],
  })
  return {
    id: 'connection-request',
    label: 'Connection request',
    group: 'learner',
    subject: data.connectionType === 'friend' ? 'New friend request on Bleepy' : 'New mentor request on Bleepy',
    html,
  }
}

export function buildConnectionAcceptedEmail(data: {
  recipientName: string
  responderName: string
  connectionType: 'friend' | 'mentor'
  dashboardUrl: string
}): BuiltEmail {
  const kind = data.connectionType === 'friend' ? 'friend' : 'mentor'
  const html = wrapEmailHtml({
    title: `${kind} request accepted`,
    headline: `${kind.charAt(0).toUpperCase() + kind.slice(1)} request accepted`,
    footerKind: 'learner',
    bodyHtml:
      greeting(data.recipientName) +
      p(`<strong>${escapeHtml(data.responderName)}</strong> has accepted your ${kind} request on Bleepy. Open your connections hub to start the conversation.`),
    ctas: [{ href: data.dashboardUrl || `${EMAIL_SITE}/connections`, label: 'Open connections' }],
  })
  return {
    id: 'connection-accepted',
    label: 'Connection accepted',
    group: 'learner',
    subject:
      data.connectionType === 'friend'
        ? 'Your friend request was accepted on Bleepy'
        : 'Your mentor request was accepted on Bleepy',
    html,
  }
}

export function buildConnectionReportAcknowledgementEmail(data: {
  recipientName: string
  targetName: string
  reason: string
  notes?: string | null
  dashboardUrl: string
}): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Thanks for flagging this connection',
    headline: 'We received your report',
    footerKind: 'learner',
    bodyHtml:
      greeting(data.recipientName) +
      p(`Thank you for looking out for the community. Our team is reviewing your report about <strong>${escapeHtml(data.targetName)}</strong>.`) +
      infoBanner(
        'Report summary',
        `<p style="margin:0;">${escapeHtml(data.reason)}</p>${
          data.notes
            ? `<p style="margin:12px 0 0 0;white-space:pre-line;">${escapeHtml(data.notes)}</p>`
            : ''
        }`
      ) +
      p('You can continue using Bleepy as normal. If this feels urgent, reply to this email.'),
    ctas: [{ href: data.dashboardUrl, label: 'Return to connections' }],
  })
  return {
    id: 'connection-report-ack',
    label: 'Connection report acknowledgement',
    group: 'learner',
    subject: 'Thanks for flagging this connection',
    html,
  }
}

function londonDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function buildAdminContactFormEmail(data: {
  contactId: string
  name: string
  email: string
  subject: string
  category: string
  message: string
  submissionTime: string
}): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'New Contact Form Submission',
    headline: 'New contact form submission',
    footerKind: 'admin',
    bodyHtml:
      p('A new message was submitted on Bleepy.') +
      detailBlock([
        { label: 'From', value: `${escapeHtml(data.name)} (${escapeHtml(data.email)})` },
        { label: 'Subject', value: escapeHtml(data.subject) },
        { label: 'Category', value: escapeHtml(data.category.replace(/_/g, ' ')) },
        { label: 'Submitted', value: escapeHtml(londonDate(data.submissionTime)) },
        { label: 'Message ID', value: `<span style="font-family:monospace;">${escapeHtml(data.contactId)}</span>` },
      ]) +
      infoBanner('Message', `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.message)}</p>`),
    ctas: [{ href: `${EMAIL_SITE}/contact-messages`, label: 'Open contact messages' }],
  })
  return {
    id: 'admin-contact',
    label: 'Admin: contact form',
    group: 'admin',
    subject: `New Contact Form Submission - ${data.subject}`,
    html,
  }
}

export function buildAdminFileRequestEmail(data: {
  requestId: string
  userName: string
  userEmail: string
  fileName: string
  description: string
  preferredFormat?: string
  additionalInfo?: string
  eventTitle: string
  eventDate?: string
  submissionTime: string
}): BuiltEmail {
  const rows = [
    { label: 'Requested by', value: `${escapeHtml(data.userName)} (${escapeHtml(data.userEmail)})` },
    { label: 'File name', value: escapeHtml(data.fileName) },
    {
      label: 'Event',
      value: `${escapeHtml(data.eventTitle)}${data.eventDate ? ` (${escapeHtml(data.eventDate)})` : ''}`,
    },
  ]
  if (data.preferredFormat) rows.push({ label: 'Format', value: escapeHtml(data.preferredFormat) })
  rows.push({ label: 'Submitted', value: escapeHtml(londonDate(data.submissionTime)) })
  rows.push({
    label: 'Request ID',
    value: `<span style="font-family:monospace;">${escapeHtml(data.requestId)}</span>`,
  })

  const html = wrapEmailHtml({
    title: 'New File Request',
    headline: 'New file request',
    footerKind: 'admin',
    bodyHtml:
      detailBlock(rows) +
      infoBanner('Description', `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.description)}</p>`) +
      (data.additionalInfo
        ? infoBanner('Additional information', `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.additionalInfo)}</p>`)
        : ''),
    ctas: [{ href: `${EMAIL_SITE}/admin-file-requests`, label: 'Manage file requests' }],
  })
  return {
    id: 'admin-file-request',
    label: 'Admin: file request',
    group: 'admin',
    subject: `New File Request - ${data.fileName}`,
    html,
  }
}

export function buildAdminTeachingRequestEmail(data: {
  requestId: string
  userName: string
  userEmail: string
  topic: string
  description: string
  preferredDate?: string
  preferredTime?: string
  duration: string
  categories: string[]
  format: string
  additionalInfo?: string
  submissionTime: string
}): BuiltEmail {
  const schedule = [data.preferredDate, data.preferredTime].filter(Boolean).join(' · ')
  const html = wrapEmailHtml({
    title: 'New Teaching Request',
    headline: 'New teaching request',
    footerKind: 'admin',
    bodyHtml:
      detailBlock([
        { label: 'Requested by', value: `${escapeHtml(data.userName)} (${escapeHtml(data.userEmail)})` },
        { label: 'Topic', value: escapeHtml(data.topic) },
        { label: 'Duration', value: escapeHtml(data.duration) },
        { label: 'Format', value: escapeHtml(data.format) },
        { label: 'Categories', value: escapeHtml((data.categories || []).join(', ') || '—') },
        ...(schedule ? [{ label: 'Preferred', value: escapeHtml(schedule) }] : []),
        { label: 'Submitted', value: escapeHtml(londonDate(data.submissionTime)) },
        { label: 'Request ID', value: `<span style="font-family:monospace;">${escapeHtml(data.requestId)}</span>` },
      ]) +
      infoBanner('Description', `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.description)}</p>`) +
      (data.additionalInfo
        ? infoBanner('Additional information', `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.additionalInfo)}</p>`)
        : ''),
    ctas: [{ href: `${EMAIL_SITE}/request-teaching`, label: 'Open teaching requests' }],
  })
  return {
    id: 'admin-teaching-request',
    label: 'Admin: teaching request',
    group: 'admin',
    subject: `New Teaching Request - ${data.topic}`,
    html,
  }
}

export function buildAdminMededTeamProfileEmail(data: {
  userName: string
  userEmail: string
  publicSlug: string | null
}): BuiltEmail {
  const profileUrl = data.publicSlug ? `${EMAIL_SITE}/profile/${data.publicSlug}` : `${EMAIL_SITE}/dashboard`
  const html = wrapEmailHtml({
    title: 'MedEd Team Profile Update',
    headline: 'MedEd Team profile update',
    footerKind: 'admin',
    bodyHtml:
      p(`<strong>${escapeHtml(data.userName)}</strong> (${escapeHtml(data.userEmail)}) has set their profile role to <strong>MedEd Team</strong>.`) +
      infoBanner(
        'Action',
        'Consider updating their platform permissions if they should access MedEd Team tooling.'
      ),
    ctas: [
      { href: profileUrl, label: 'View public profile' },
      { href: `${EMAIL_SITE}/admin-users`, label: 'Open user management', variant: 'secondary' },
    ],
  })
  return {
    id: 'admin-meded-profile',
    label: 'Admin: MedEd team profile',
    group: 'admin',
    subject: `MedEd Team profile update: ${data.userName}`,
    html,
  }
}

export function buildAdminNewUserEmail(data: {
  userEmail: string
  userName: string
  signupTime: string
  consentGiven: boolean
  marketingConsent: boolean
  analyticsConsent: boolean
}): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'New User Registration',
    headline: 'New user registration',
    footerKind: 'admin',
    bodyHtml:
      p('A new user has registered on Bleepy.') +
      infoBanner(
        'User details',
        detailBlock([
          { label: 'Name', value: escapeHtml(data.userName) },
          { label: 'Email', value: escapeHtml(data.userEmail) },
          { label: 'Registered', value: escapeHtml(londonDate(data.signupTime)) },
        ])
      ) +
      infoBanner(
        'Consent',
        detailBlock([
          { label: 'Terms', value: data.consentGiven ? 'Agreed' : 'Not agreed' },
          { label: 'Marketing', value: data.marketingConsent ? 'Opted in' : 'Opted out' },
          { label: 'Analytics', value: data.analyticsConsent ? 'Opted in' : 'Opted out' },
        ])
      ),
    ctas: [{ href: `${EMAIL_SITE}/admin-users`, label: 'View user management' }],
  })
  return {
    id: 'admin-new-user',
    label: 'Admin: new user',
    group: 'admin',
    subject: 'New User Registration - Bleepy',
    html,
  }
}

export function buildConnectionReportEmail(data: {
  reporterName: string
  targetName: string
  reason: string
  notes?: string | null
  dashboardUrl: string
}): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Connection report',
    headline: 'A connection was reported',
    footerKind: 'admin',
    bodyHtml:
      p(`<strong>${escapeHtml(data.reporterName)}</strong> flagged <strong>${escapeHtml(data.targetName)}</strong>.`) +
      detailBlock([
        { label: 'Reporter', value: escapeHtml(data.reporterName) },
        { label: 'Target', value: escapeHtml(data.targetName) },
        { label: 'Reason', value: escapeHtml(data.reason) },
        ...(data.notes ? [{ label: 'Notes', value: `<span style="white-space:pre-line;">${escapeHtml(data.notes)}</span>` }] : []),
      ]),
    ctas: [{ href: data.dashboardUrl, label: 'Review connection hub' }],
  })
  return {
    id: 'admin-connection-report',
    label: 'Admin: connection report',
    group: 'admin',
    subject: `Connection report: ${data.reporterName} → ${data.targetName}`,
    html,
  }
}

export const SAMPLE_SYSTEM_EMAILS: BuiltEmail[] = [
  buildVerificationEmail({
    name: 'Alex Example',
    verificationUrl: `${EMAIL_SITE}/auth/verify?token=preview`,
  }),
  buildPasswordResetEmail({
    name: 'Alex Example',
    resetUrl: `${EMAIL_SITE}/auth/reset-password?token=preview`,
  }),
  buildAccountApprovalEmail({ name: 'Alex Example' }),
  buildAccountCreatedEmail({
    name: 'Alex Example',
    email: 'alex@example.com',
    role: 'student',
    password: 'TemporaryPass1',
    loginUrl: `${EMAIL_SITE}/auth/signin`,
  }),
  buildRoleChangeEmail({ name: 'Alex Example', oldRole: 'student', newRole: 'ctf' }),
  buildFeedbackFormEmail({
    recipientName: 'Alex Example',
    eventTitle: 'Chest pain workshop',
    eventDate: '13 August 2026',
    eventTime: '14:00',
    feedbackFormUrl: `${EMAIL_SITE}/feedback/event/preview`,
    feedbackRequiredForCertificate: true,
  }),
  buildCertificateEmail({
    recipientName: 'Alex Example',
    eventTitle: 'Chest pain workshop',
    eventDate: '13 August 2026',
    eventLocation: 'ARU Chelmsford',
    eventDuration: '2 hours',
    certificateUrl: `${EMAIL_SITE}/mycertificates`,
    certificateId: 'CERT-PREVIEW-001',
    hasAttachment: true,
  }),
  buildCertificateAutoGeneratedEmail({
    recipientName: 'Alex Example',
    eventTitle: 'Chest pain workshop',
    eventDate: '13 August 2026',
    eventLocation: 'ARU Chelmsford',
    eventDuration: '2 hours',
    certificateUrl: `${EMAIL_SITE}/mycertificates`,
    certificateId: 'CERT-PREVIEW-001',
    hasAttachment: true,
  }),
  buildAttendanceThankYouEmail({
    recipientName: 'Alex Example',
    eventTitle: 'Chest pain workshop',
    eventDate: '13 August 2026',
    eventTime: '14:00',
  }),
  buildConnectionRequestEmail({
    recipientName: 'Alex Example',
    requesterName: 'Jordan Lee',
    connectionType: 'friend',
    respondUrl: `${EMAIL_SITE}/connections`,
  }),
  buildConnectionAcceptedEmail({
    recipientName: 'Alex Example',
    responderName: 'Jordan Lee',
    connectionType: 'friend',
    dashboardUrl: `${EMAIL_SITE}/connections`,
  }),
  buildConnectionReportAcknowledgementEmail({
    recipientName: 'Alex Example',
    targetName: 'Jordan Lee',
    reason: 'Inappropriate messages',
    notes: 'Preview notes only.',
    dashboardUrl: `${EMAIL_SITE}/connections`,
  }),
  buildAdminContactFormEmail({
    contactId: 'preview-id',
    name: 'Alex Example',
    email: 'alex@example.com',
    subject: 'Question about teaching events',
    category: 'general',
    message: 'Could you confirm the next FY teaching date?',
    submissionTime: new Date().toISOString(),
  }),
  buildAdminFileRequestEmail({
    requestId: 'preview-id',
    userName: 'Alex Example',
    userEmail: 'alex@example.com',
    fileName: 'Slides for chest pain',
    description: 'Please share the workshop slides.',
    eventTitle: 'Chest pain workshop',
    eventDate: '13 August 2026',
    submissionTime: new Date().toISOString(),
  }),
  buildAdminTeachingRequestEmail({
    requestId: 'preview-id',
    userName: 'Alex Example',
    userEmail: 'alex@example.com',
    topic: 'ECG basics',
    description: 'Would like a 45-minute session for FY1s.',
    duration: '45 minutes',
    categories: ['FY', 'Cardiology'],
    format: 'In person',
    preferredDate: '20 August 2026',
    preferredTime: '13:00',
    submissionTime: new Date().toISOString(),
  }),
  buildAdminMededTeamProfileEmail({
    userName: 'Alex Example',
    userEmail: 'alex@example.com',
    publicSlug: 'alex-example',
  }),
  buildAdminNewUserEmail({
    userEmail: 'alex@example.com',
    userName: 'Alex Example',
    signupTime: new Date().toISOString(),
    consentGiven: true,
    marketingConsent: false,
    analyticsConsent: true,
  }),
  buildConnectionReportEmail({
    reporterName: 'Alex Example',
    targetName: 'Jordan Lee',
    reason: 'Inappropriate messages',
    notes: 'Preview notes only.',
    dashboardUrl: `${EMAIL_SITE}/connections`,
  }),
]
