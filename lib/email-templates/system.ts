/**
 * System email bodies using the shared year-progression chrome.
 * Safe for client preview pages.
 */

import {
  EMAIL_FONT,
  EMAIL_SITE,
  detailBlock,
  escapeHtml,
  fallbackUrlNote,
  copyableText,
  featureRows,
  greeting,
  infoBanner,
  p,
  roleChangeCards,
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

function whatsOnBleepy() {
  return infoBanner(
    'What’s on Bleepy',
    featureRows([
      {
        title: 'Foundation Year guides',
        text: 'Practical ward and on-call help for FY doctors.',
        href: `${EMAIL_SITE}/guides/foundation-year`,
        linkLabel: 'Open guides',
      },
      {
        title: 'Teaching events',
        text: 'Book sessions and keep your certificates in one place.',
        href: `${EMAIL_SITE}/events-list`,
        linkLabel: 'View events',
      },
      {
        title: 'OSCE stations',
        text: 'Practise clinical scenarios before you need them on the ward.',
        href: `${EMAIL_SITE}/stations`,
        linkLabel: 'Start practice',
      },
    ])
  )
}

export function buildVerificationEmail(data: { name: string; verificationUrl: string }): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Verify Your Email',
    headline: 'Welcome to Bleepy',
    subheadline: 'Confirm your email to get started',
    footerKind: 'learner',
    reasonLine: 'You received this because a Bleepy account was created with this email address.',
    bodyHtml:
      greeting(data.name) +
      p(
        'Thank you for creating a Bleepy account. Please confirm this email address so we can finish setting it up.'
      ) +
      p(
        'Bleepy supports medical students and foundation doctors with teaching events, certificates, Foundation Year guides, and OSCE practice.'
      ),
    ctas: [{ href: data.verificationUrl, label: 'Confirm my email' }],
    extraBlocksHtml:
      whatsOnBleepy() +
      infoBanner(
        'This link expires in 48 hours',
        '<p style="margin:0;">If you did not create an account, you can ignore this email.</p>'
      ) +
      fallbackUrlNote(data.verificationUrl),
  })
  return { id: 'verify', label: 'Verify email', group: 'learner', subject: 'Verify your email - Bleepy', html }
}

export const VERIFICATION_REMINDER_STEPS = [
  { id: '12h', delayMs: 12 * 60 * 60 * 1000, nextDelayMs: 3 * 24 * 60 * 60 * 1000, label: '12 hours' },
  { id: '3d', delayMs: 3 * 24 * 60 * 60 * 1000, nextDelayMs: 7 * 24 * 60 * 60 * 1000, label: '3 days' },
  { id: '7d', delayMs: 7 * 24 * 60 * 60 * 1000, nextDelayMs: 30 * 24 * 60 * 60 * 1000, label: '7 days' },
  { id: '30d', delayMs: 30 * 24 * 60 * 60 * 1000, nextDelayMs: 37 * 24 * 60 * 60 * 1000, label: '30 days' },
] as const

export type VerificationReminderStepId = (typeof VERIFICATION_REMINDER_STEPS)[number]['id']

const VERIFICATION_REMINDER_COPY: Record<
  VerificationReminderStepId,
  { subject: string; headline: string; subheadline: string; intro: string; last: boolean }
> = {
  '12h': {
    subject: 'Reminder: confirm your Bleepy email',
    headline: 'Confirm your email to finish signing up',
    subheadline: 'A quick reminder from earlier today',
    intro:
      'You created a Bleepy account, but this email address has not been confirmed yet. Confirm it to start using teaching events, Foundation Year guides, and OSCE practice.',
    last: false,
  },
  '3d': {
    subject: 'Still waiting: confirm your Bleepy email',
    headline: 'Your Bleepy account is not confirmed yet',
    subheadline: 'It has been a few days since you signed up',
    intro:
      'We noticed you have not confirmed your email yet. Without that, you cannot sign in or receive teaching and certificates.',
    last: false,
  },
  '7d': {
    subject: 'Your Bleepy account is still unconfirmed',
    headline: 'One week on — confirm your email',
    subheadline: 'Your account is waiting for this last step',
    intro:
      'It has been a week since you signed up for Bleepy. Confirm this email so we can finish setting up your account.',
    last: false,
  },
  '30d': {
    subject: 'Last reminder: confirm your Bleepy email',
    headline: 'This is the last reminder we will send',
    subheadline: 'Confirm your email if you still want this account',
    intro:
      'It has been a month since you signed up. This is the last email we will send asking you to confirm. After this, the account stays inactive unless you confirm it yourself from the sign-in page.',
    last: true,
  },
}

export function buildVerificationReminderEmail(data: {
  name: string
  verificationUrl: string
  step?: VerificationReminderStepId
}): BuiltEmail {
  const copy = VERIFICATION_REMINDER_COPY[data.step || '12h']
  const html = wrapEmailHtml({
    title: copy.headline,
    headline: copy.headline,
    subheadline: copy.subheadline,
    footerKind: 'learner',
    reasonLine: 'You received this because a Bleepy account was created with this email and has not been confirmed yet.',
    bodyHtml:
      greeting(data.name) +
      p(copy.intro) +
      p(
        'Bleepy supports medical students and foundation doctors with teaching events, certificates, Foundation Year guides, and OSCE practice.'
      ),
    ctas: [{ href: data.verificationUrl, label: 'Confirm my email' }],
    extraBlocksHtml:
      whatsOnBleepy() +
      infoBanner(
        copy.last ? 'Last reminder' : 'This link expires in 48 hours',
        copy.last
          ? '<p style="margin:0;">We will not send another confirmation reminder after this. If you did not create an account, you can ignore this email.</p>'
          : '<p style="margin:0;">If you did not create an account, you can ignore this email.</p>'
      ) +
      fallbackUrlNote(data.verificationUrl),
  })
  return {
    id: `verify-reminder-${data.step || '12h'}`,
    label: `Verify reminder (${copy.subheadline})`,
    group: 'learner',
    subject: copy.subject,
    html,
  }
}

export function buildPasswordResetEmail(data: { name: string; resetUrl: string }): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Reset Your Password',
    headline: 'Password reset request',
    subheadline: 'This link expires in 1 hour',
    footerKind: 'learner',
    reasonLine: 'You received this because a password reset was requested for this Bleepy account.',
    bodyHtml:
      greeting(data.name) +
      p(
        'We received a request to reset the password for your Bleepy account. Please choose a new password using the button below.'
      ) +
      p(
        'If you did not request this, you can ignore this email. Your account remains secure, and no changes will be made.'
      ),
    ctas: [{ href: data.resetUrl, label: 'Reset password' }],
    extraBlocksHtml: fallbackUrlNote(data.resetUrl),
  })
  return { id: 'password-reset', label: 'Password reset', group: 'learner', subject: 'Reset your password - Bleepy', html }
}

export function buildPasswordChangedEmail(data: {
  name: string
  signInUrl: string
  resetUrl: string
}): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Your password was changed - Bleepy',
    headline: 'Your password was changed',
    subheadline: 'If this was not you, reset it now',
    footerKind: 'learner',
    reasonLine: 'You received this because the password on this Bleepy account was changed.',
    bodyHtml:
      greeting(data.name) +
      p(
        'The password for your Bleepy account was just changed. You will need to sign in again on any other devices.'
      ) +
      p(
        'If this was you, no further action is needed. If this was not you, reset your password immediately and contact Bleepy support.'
      ),
    ctas: [
      { href: data.signInUrl, label: 'Go to sign in' },
      { href: data.resetUrl, label: 'Reset password', variant: 'secondary' },
    ],
    extraBlocksHtml:
      `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">If you need help, contact <a href="${EMAIL_SITE}/contact" style="color:#1d4ed8;text-decoration:underline;">Bleepy support</a>.</p>` +
      fallbackUrlNote(data.signInUrl),
  })
  return {
    id: 'password-changed',
    label: 'Password changed',
    group: 'learner',
    subject: 'Your Bleepy password was changed',
    html,
  }
}

export function buildLoginLockoutEmail(data: {
  name: string
  lockoutMinutes: number
  resetUrl: string
  signInUrl: string
}): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Sign-in temporarily locked - Bleepy',
    headline: 'Sign-in is temporarily locked',
    subheadline: `You can try again in ${data.lockoutMinutes} minutes`,
    footerKind: 'learner',
    reasonLine: 'You received this because there were too many failed sign-in attempts for this Bleepy account.',
    bodyHtml:
      greeting(data.name) +
      p(
        `We temporarily locked sign-in for your Bleepy account after too many failed password attempts. You can try again in ${data.lockoutMinutes} minutes.`
      ) +
      p(
        'If this was you, wait and sign in again, or reset your password. If this was not you, reset your password and contact Bleepy support.'
      ),
    ctas: [
      { href: data.resetUrl, label: 'Reset password' },
      { href: data.signInUrl, label: 'Go to sign in', variant: 'secondary' },
    ],
    extraBlocksHtml:
      `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">If you need help, contact <a href="${EMAIL_SITE}/contact" style="color:#1d4ed8;text-decoration:underline;">Bleepy support</a>.</p>` +
      fallbackUrlNote(data.resetUrl),
  })
  return {
    id: 'login-lockout',
    label: 'Login lockout',
    group: 'learner',
    subject: 'Your Bleepy sign-in is temporarily locked',
    html,
  }
}

export function buildAdminLoginLockoutEmail(data: {
  email: string
  userName?: string | null
  userExists: boolean
  ip?: string | null
  lockoutMinutes: number
  maxAttempts: number
  windowMinutes: number
}): BuiltEmail {
  const rows = [
    { label: 'Email', value: escapeHtml(data.email) },
    { label: 'Account', value: data.userExists ? 'Yes — user emailed' : 'No matching user' },
  ]
  if (data.userName) rows.push({ label: 'Name', value: escapeHtml(data.userName) })
  if (data.ip && data.ip !== 'unknown') rows.push({ label: 'IP', value: escapeHtml(data.ip) })
  rows.push({
    label: 'Lockout',
    value: `${data.lockoutMinutes} minutes after ${data.maxAttempts} failed attempts in ${data.windowMinutes} minutes`,
  })

  const html = wrapEmailHtml({
    title: 'Sign-in lockout',
    headline: 'Sign-in lockout',
    subheadline: data.email,
    footerKind: 'admin',
    reasonLine: 'You received this because a Bleepy sign-in address was locked after too many failed attempts.',
    bodyHtml:
      p('A sign-in email was locked after too many failed password attempts.') +
      infoBanner('Lockout details', detailBlock(rows)),
    ctas: [{ href: `${EMAIL_SITE}/admin-users`, label: 'Open user management' }],
    extraBlocksHtml: fallbackUrlNote(`${EMAIL_SITE}/admin-users`),
  })
  return {
    id: 'admin-login-lockout',
    label: 'Admin: login lockout',
    group: 'admin',
    subject: `Sign-in lockout — ${data.email}`,
    html,
  }
}

export function buildAccountApprovalEmail(data: { name: string }): BuiltEmail {
  const html = wrapEmailHtml({
    title: 'Account Approved - Bleepy',
    headline: 'Account approved',
    subheadline: 'You can now sign in to Bleepy',
    footerKind: 'learner',
    reasonLine: 'You received this because your Bleepy account was approved.',
    bodyHtml:
      greeting(data.name) +
      p('Your Bleepy account has been approved. You can now sign in and use the platform.') +
      p(
        'Bleepy supports medical students and foundation doctors with teaching events, certificates, Foundation Year guides, and OSCE practice.'
      ),
    ctas: [{ href: `${EMAIL_SITE}/dashboard`, label: 'Open your dashboard' }],
    extraBlocksHtml:
      whatsOnBleepy() +
      `<p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">Need help getting started? See our <a href="${EMAIL_SITE}/tutorials" style="color:#1d4ed8;text-decoration:underline;">tutorials</a> or <a href="${EMAIL_SITE}/contact" style="color:#1d4ed8;text-decoration:underline;">contact the team</a>.</p>`,
  })
  return {
    id: 'account-approved',
    label: 'Account approved',
    group: 'learner',
    subject: 'Your Bleepy account has been approved',
    html,
  }
}

export function buildRoleChangeEmail(data: { name: string; oldRole: string; newRole: string }): BuiltEmail {
  const oldLabel = roleDisplayName(data.oldRole)
  const newLabel = roleDisplayName(data.newRole)
  const html = wrapEmailHtml({
    title: 'Role Updated - Bleepy',
    headline: 'Your role has been updated',
    subheadline: `New role: ${newLabel}`,
    footerKind: 'learner',
    reasonLine: 'You received this because an administrator updated your Bleepy role.',
    bodyHtml:
      greeting(data.name) +
      p(
        `Your Bleepy account role has been updated. This changes which tools and pages you can access.`
      ) +
      roleChangeCards(oldLabel, newLabel),
    ctas: [{ href: `${EMAIL_SITE}/dashboard`, label: 'Open your dashboard' }],
    extraBlocksHtml:
      infoBanner('What this means', `<p style="margin:0;">${escapeHtml(roleDescription(data.newRole))}</p>`) +
      `<p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">If this does not look right, contact your medical education team or <a href="${EMAIL_SITE}/contact" style="color:#1d4ed8;text-decoration:underline;">Bleepy support</a>.</p>`,
  })
  return {
    id: 'role-change',
    label: 'Role changed',
    group: 'learner',
    subject: `Your Bleepy role has been updated to ${newLabel}`,
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
    subheadline: 'An administrator set this up for you',
    footerKind: 'learner',
    reasonLine: 'You received this because an administrator created a Bleepy account for you.',
    bodyHtml:
      greeting(data.name) +
      p(
        'An administrator has created a Bleepy account for you. Please sign in with the details below. You will be asked to choose a new password the first time you log in.'
      ) +
      infoBanner(
        'Your login details',
        detailBlock([
          { label: 'Email', value: copyableText(data.email) },
          { label: 'Password', value: copyableText(data.password) },
          { label: 'Role', value: escapeHtml(roleDisplayName(data.role)) },
        ]) +
          '<p id="bleepy-copy-status" style="margin:8px 0 0 0;font-size:12px;line-height:18px;color:#6b7280;">Click the email or password to copy it.</p>'
      ),
    ctas: [{ href: data.loginUrl, label: 'Log in to your account' }],
    extraBlocksHtml: whatsOnBleepy(),
  })
  return {
    id: 'account-created',
    label: 'Account created',
    group: 'learner',
    subject: 'Your Bleepy account has been created',
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
    { label: 'Event', value: escapeHtml(data.eventTitle) },
    { label: 'Date', value: escapeHtml(data.eventDate) },
  ]
  if (data.eventLocation) rows.push({ label: 'Location', value: escapeHtml(data.eventLocation) })
  if (data.eventDuration) rows.push({ label: 'Duration', value: escapeHtml(data.eventDuration) })
  rows.push({
    label: 'Certificate ID',
    value: `<span style="font-family:Consolas,Monaco,monospace;">${escapeHtml(data.certificateId)}</span>`,
  })

  const html = wrapEmailHtml({
    title: `Your Certificate - ${data.eventTitle}`,
    headline: 'Your certificate of attendance',
    subheadline: data.eventTitle,
    footerKind: 'learner',
    reasonLine: 'You received this because you attended a Bleepy teaching event.',
    bodyHtml:
      greeting(data.recipientName) +
      p(
        `Thank you for attending <strong>${escapeHtml(data.eventTitle)}</strong>. Your certificate of attendance is ready to view and download.`
      ) +
      infoBanner('Session details', detailBlock(rows)),
    ctas: [
      {
        href: viewUrl,
        label: data.isGuestAccess ? 'View / download certificate' : 'View my certificates',
      },
    ],
    extraBlocksHtml:
      (data.hasAttachment
        ? `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">Your certificate is also attached to this email as a PNG file.</p>`
        : '') +
      (data.isGuestAccess
        ? `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">No login is required. Use the button or link in this email to open your certificate.</p>`
        : `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">You can also find all of your certificates in <a href="${EMAIL_SITE}/mycertificates" style="color:#1d4ed8;text-decoration:underline;">My Certificates</a>.</p>`) +
      infoBanner(
        'Portfolio and CPD',
        '<p style="margin:0;">Keep this certificate for your professional portfolio and CPD records.</p>'
      ) +
      fallbackUrlNote(viewUrl),
  })
  return {
    id: 'certificate',
    label: 'Certificate',
    group: 'learner',
    subject: `Your certificate of attendance — ${data.eventTitle}`,
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
    headline: 'Your certificate of attendance',
    subheadline: data.eventTitle,
    footerKind: 'learner',
    reasonLine: 'You received this because you completed feedback after a Bleepy teaching event.',
    bodyHtml:
      greeting(data.recipientName) +
      p(
        `Thank you for completing feedback for <strong>${escapeHtml(data.eventTitle)}</strong>. Your certificate of attendance has been generated and is ready to view and download.`
      ) +
      infoBanner(
        'Session details',
        detailBlock([
          { label: 'Event', value: escapeHtml(data.eventTitle) },
          { label: 'Date', value: escapeHtml(data.eventDate) },
          { label: 'Location', value: escapeHtml(data.eventLocation) },
          { label: 'Duration', value: escapeHtml(data.eventDuration) },
          {
            label: 'Certificate ID',
            value: `<span style="font-family:Consolas,Monaco,monospace;">${escapeHtml(data.certificateId)}</span>`,
          },
        ])
      ),
    ctas: [
      {
        href: viewUrl,
        label: data.isGuestAccess ? 'View / download certificate' : 'View my certificates',
      },
    ],
    extraBlocksHtml:
      (data.hasAttachment
        ? `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">Your certificate is also attached to this email as a PNG file.</p>`
        : '') +
      (data.isGuestAccess
        ? `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">No login is required. Use the button or link in this email to open your certificate.</p>`
        : `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">You can also find all of your certificates in <a href="${EMAIL_SITE}/mycertificates" style="color:#1d4ed8;text-decoration:underline;">My Certificates</a>.</p>`) +
      infoBanner(
        'Portfolio and CPD',
        '<p style="margin:0;">Keep this certificate for your professional portfolio and CPD records.</p>'
      ) +
      fallbackUrlNote(viewUrl),
  })
  return {
    id: 'certificate-auto',
    label: 'Certificate (auto-generated)',
    group: 'learner',
    subject: `Your certificate of attendance is ready — ${data.eventTitle}`,
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
    subheadline: data.eventTitle,
    footerKind: 'learner',
    reasonLine: 'You received this because you attended a Bleepy teaching event.',
    bodyHtml:
      greeting(data.recipientName) +
      p(
        `Thank you for attending <strong>${escapeHtml(data.eventTitle)}</strong>. Please complete a short feedback form about this session.`
      ) +
      infoBanner(
        'Session details',
        detailBlock([
          { label: 'Event', value: escapeHtml(data.eventTitle) },
          { label: 'Date', value: escapeHtml(data.eventDate) },
          { label: 'Time', value: escapeHtml(data.eventTime) },
        ])
      ),
    ctas: [{ href: data.feedbackFormUrl, label: 'Complete feedback form' }],
    extraBlocksHtml:
      (required
        ? infoBanner(
            'Certificate',
            '<p style="margin:0;">Feedback is required before your certificate can be released. Once you submit this form, your certificate will be generated and emailed to you.</p>'
          )
        : infoBanner(
            'Why we ask',
            '<p style="margin:0;">Your feedback helps the medical education team improve teaching for the next cohort.</p>'
          )) +
      (data.isGuestAccess
        ? `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">No login is required. Use the button or link in this email to complete the form.</p>`
        : `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">You can also open this form later from My Bookings in Bleepy.</p>`) +
      fallbackUrlNote(data.feedbackFormUrl),
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
  const eventsUrl = `${EMAIL_SITE}/events-list`
  const html = wrapEmailHtml({
    title: `Thank You - ${data.eventTitle}`,
    headline: 'Thank you for attending',
    subheadline: data.eventTitle,
    footerKind: 'learner',
    reasonLine: 'You received this because you were marked as attending a Bleepy teaching event.',
    bodyHtml:
      greeting(data.recipientName) +
      p(
        `Thank you for attending <strong>${escapeHtml(data.eventTitle)}</strong>. We hope the session was useful.`
      ) +
      infoBanner(
        'Session details',
        detailBlock([
          { label: 'Event', value: escapeHtml(data.eventTitle) },
          { label: 'Date', value: escapeHtml(data.eventDate) },
          { label: 'Time', value: escapeHtml(data.eventTime) },
        ])
      ),
    ctas: [{ href: eventsUrl, label: 'Browse more events' }],
    extraBlocksHtml:
      infoBanner(
        'Questions or feedback',
        `<p style="margin:0;">If you have questions about this session, please contact your medical education team or <a href="${EMAIL_SITE}/contact" style="color:#1d4ed8;text-decoration:underline;">Bleepy support</a>.</p>`
      ) + fallbackUrlNote(eventsUrl),
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
  const kindLabel = data.connectionType === 'friend' ? 'Friend' : 'Mentor'
  const respondUrl = data.respondUrl || `${EMAIL_SITE}/connections`
  const html = wrapEmailHtml({
    title: `New ${kind} request on Bleepy`,
    headline: `New ${kind} request`,
    subheadline: data.requesterName,
    footerKind: 'learner',
    reasonLine: 'You received this because someone sent you a connection request on Bleepy.',
    bodyHtml:
      greeting(data.recipientName) +
      p(
        `<strong>${escapeHtml(data.requesterName)}</strong> has sent you a ${kind} request. Review the invitation to accept or decline.`
      ) +
      infoBanner(
        'Request details',
        detailBlock([
          { label: 'From', value: escapeHtml(data.requesterName) },
          { label: 'Type', value: escapeHtml(kindLabel) },
        ])
      ),
    ctas: [
      { href: respondUrl, label: 'Review request' },
      { href: `${EMAIL_SITE}/connections`, label: 'Manage connections', variant: 'secondary' },
    ],
    extraBlocksHtml:
      `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">You can also find pending requests in Connections on Bleepy.</p>` +
      fallbackUrlNote(respondUrl),
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
  const kindLabel = data.connectionType === 'friend' ? 'Friend' : 'Mentor'
  const connectionsUrl = data.dashboardUrl || `${EMAIL_SITE}/connections`
  const html = wrapEmailHtml({
    title: `${kind} request accepted`,
    headline: `${kindLabel} request accepted`,
    subheadline: data.responderName,
    footerKind: 'learner',
    reasonLine: 'You received this because someone accepted your connection request on Bleepy.',
    bodyHtml:
      greeting(data.recipientName) +
      p(
        `<strong>${escapeHtml(data.responderName)}</strong> has accepted your ${kind} request. You can now connect on Bleepy.`
      ) +
      infoBanner(
        'Connection details',
        detailBlock([
          { label: 'With', value: escapeHtml(data.responderName) },
          { label: 'Type', value: escapeHtml(kindLabel) },
        ])
      ),
    ctas: [{ href: connectionsUrl, label: 'Open connections' }],
    extraBlocksHtml: fallbackUrlNote(connectionsUrl),
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
  const connectionsUrl = data.dashboardUrl || `${EMAIL_SITE}/connections`
  const rows = [
    { label: 'Reported user', value: escapeHtml(data.targetName) },
    { label: 'Reason', value: escapeHtml(data.reason) },
  ]
  if (data.notes) {
    rows.push({
      label: 'Notes',
      value: `<span style="white-space:pre-line;">${escapeHtml(data.notes)}</span>`,
    })
  }

  const html = wrapEmailHtml({
    title: 'Thanks for flagging this connection',
    headline: 'We received your report',
    subheadline: 'Our team will review this',
    footerKind: 'learner',
    reasonLine: 'You received this because you reported a connection on Bleepy.',
    bodyHtml:
      greeting(data.recipientName) +
      p(
        `Thank you for looking out for the community. Our team is reviewing your report about <strong>${escapeHtml(data.targetName)}</strong>. You can continue using Bleepy as normal.`
      ) +
      infoBanner('Report summary', detailBlock(rows)),
    ctas: [{ href: connectionsUrl, label: 'Return to connections' }],
    extraBlocksHtml:
      `<p style="margin:0 0 14px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#6b7280;">If this feels urgent, reply to this email or contact <a href="${EMAIL_SITE}/contact" style="color:#1d4ed8;text-decoration:underline;">Bleepy support</a>.</p>` +
      fallbackUrlNote(connectionsUrl),
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
  const inboxUrl = `${EMAIL_SITE}/contact-messages`
  const html = wrapEmailHtml({
    title: 'New Contact Form Submission',
    headline: 'New contact form submission',
    subheadline: data.subject,
    footerKind: 'admin',
    reasonLine: 'You received this because you are a Bleepy administrator.',
    bodyHtml:
      p('A new message was submitted through the Bleepy contact form.') +
      infoBanner(
        'Submission details',
        detailBlock([
          { label: 'From', value: `${escapeHtml(data.name)} (${escapeHtml(data.email)})` },
          { label: 'Subject', value: escapeHtml(data.subject) },
          { label: 'Category', value: escapeHtml(data.category.replace(/_/g, ' ')) },
          { label: 'Submitted', value: escapeHtml(londonDate(data.submissionTime)) },
          {
            label: 'Message ID',
            value: `<span style="font-family:Consolas,Monaco,monospace;">${escapeHtml(data.contactId)}</span>`,
          },
        ])
      ) +
      infoBanner('Message', `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.message)}</p>`),
    ctas: [{ href: inboxUrl, label: 'Open contact messages' }],
    extraBlocksHtml: fallbackUrlNote(inboxUrl),
  })
  return {
    id: 'admin-contact',
    label: 'Admin: contact form',
    group: 'admin',
    subject: `New contact form submission — ${data.subject}`,
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
    value: `<span style="font-family:Consolas,Monaco,monospace;">${escapeHtml(data.requestId)}</span>`,
  })

  const manageUrl = `${EMAIL_SITE}/admin-file-requests`
  const html = wrapEmailHtml({
    title: 'New File Request',
    headline: 'New file request',
    subheadline: data.fileName,
    footerKind: 'admin',
    reasonLine: 'You received this because you are a Bleepy administrator.',
    bodyHtml:
      p('A learner has requested a file from a teaching event.') +
      infoBanner('Request details', detailBlock(rows)) +
      infoBanner('Description', `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.description)}</p>`) +
      (data.additionalInfo
        ? infoBanner(
            'Additional information',
            `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.additionalInfo)}</p>`
          )
        : ''),
    ctas: [{ href: manageUrl, label: 'Manage file requests' }],
    extraBlocksHtml: fallbackUrlNote(manageUrl),
  })
  return {
    id: 'admin-file-request',
    label: 'Admin: file request',
    group: 'admin',
    subject: `New file request — ${data.fileName}`,
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
  const requestsUrl = `${EMAIL_SITE}/request-teaching`
  const html = wrapEmailHtml({
    title: 'New Teaching Request',
    headline: 'New teaching request',
    subheadline: data.topic,
    footerKind: 'admin',
    reasonLine: 'You received this because you are a Bleepy administrator.',
    bodyHtml:
      p('A learner has requested a teaching session.') +
      infoBanner(
        'Request details',
        detailBlock([
          { label: 'Requested by', value: `${escapeHtml(data.userName)} (${escapeHtml(data.userEmail)})` },
          { label: 'Topic', value: escapeHtml(data.topic) },
          { label: 'Duration', value: escapeHtml(data.duration) },
          { label: 'Format', value: escapeHtml(data.format) },
          { label: 'Categories', value: escapeHtml((data.categories || []).join(', ') || '—') },
          ...(schedule ? [{ label: 'Preferred', value: escapeHtml(schedule) }] : []),
          { label: 'Submitted', value: escapeHtml(londonDate(data.submissionTime)) },
          {
            label: 'Request ID',
            value: `<span style="font-family:Consolas,Monaco,monospace;">${escapeHtml(data.requestId)}</span>`,
          },
        ])
      ) +
      infoBanner('Description', `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.description)}</p>`) +
      (data.additionalInfo
        ? infoBanner(
            'Additional information',
            `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.additionalInfo)}</p>`
          )
        : ''),
    ctas: [{ href: requestsUrl, label: 'Open teaching requests' }],
    extraBlocksHtml: fallbackUrlNote(requestsUrl),
  })
  return {
    id: 'admin-teaching-request',
    label: 'Admin: teaching request',
    group: 'admin',
    subject: `New teaching request — ${data.topic}`,
    html,
  }
}

export function buildAdminMededTeamProfileEmail(data: {
  userName: string
  userEmail: string
  publicSlug: string | null
}): BuiltEmail {
  const profileUrl = data.publicSlug ? `${EMAIL_SITE}/profile/${data.publicSlug}` : `${EMAIL_SITE}/dashboard`
  const usersUrl = `${EMAIL_SITE}/admin-users`
  const html = wrapEmailHtml({
    title: 'MedEd Team Profile Update',
    headline: 'MedEd Team profile update',
    subheadline: data.userName,
    footerKind: 'admin',
    reasonLine: 'You received this because you are a Bleepy administrator.',
    bodyHtml:
      p(
        `<strong>${escapeHtml(data.userName)}</strong> (${escapeHtml(data.userEmail)}) has set their profile job title to <strong>MedEd Team</strong>. This does not change their platform role on its own.`
      ) +
      infoBanner(
        'Submission details',
        detailBlock([
          { label: 'Name', value: escapeHtml(data.userName) },
          { label: 'Email', value: escapeHtml(data.userEmail) },
          { label: 'Profile', value: data.publicSlug ? escapeHtml(data.publicSlug) : 'No public slug' },
        ])
      ),
    ctas: [
      { href: profileUrl, label: 'View public profile' },
      { href: usersUrl, label: 'Open user management', variant: 'secondary' },
    ],
    extraBlocksHtml:
      infoBanner(
        'Action',
        '<p style="margin:0;">Update their platform permissions only if they should have MedEd Team tooling.</p>'
      ) + fallbackUrlNote(usersUrl),
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
  const usersUrl = `${EMAIL_SITE}/admin-users`
  const html = wrapEmailHtml({
    title: 'New User Registration',
    headline: 'New user registration',
    subheadline: data.userName,
    footerKind: 'admin',
    reasonLine: 'You received this because you are a Bleepy administrator.',
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
    ctas: [{ href: usersUrl, label: 'View user management' }],
    extraBlocksHtml: fallbackUrlNote(usersUrl),
  })
  return {
    id: 'admin-new-user',
    label: 'Admin: new user',
    group: 'admin',
    subject: 'New user registration — Bleepy',
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
  const reviewUrl = data.dashboardUrl || `${EMAIL_SITE}/connections`
  const html = wrapEmailHtml({
    title: 'Connection report',
    headline: 'A connection was reported',
    subheadline: `${data.reporterName} → ${data.targetName}`,
    footerKind: 'admin',
    reasonLine: 'You received this because you are a Bleepy administrator.',
    bodyHtml:
      p(
        `<strong>${escapeHtml(data.reporterName)}</strong> flagged <strong>${escapeHtml(data.targetName)}</strong>. Please review this report.`
      ) +
      infoBanner(
        'Report details',
        detailBlock([
          { label: 'Reporter', value: escapeHtml(data.reporterName) },
          { label: 'Reported user', value: escapeHtml(data.targetName) },
          { label: 'Reason', value: escapeHtml(data.reason) },
          ...(data.notes
            ? [{ label: 'Notes', value: `<span style="white-space:pre-line;">${escapeHtml(data.notes)}</span>` }]
            : []),
        ])
      ),
    ctas: [{ href: reviewUrl, label: 'Review connection hub' }],
    extraBlocksHtml: fallbackUrlNote(reviewUrl),
  })
  return {
    id: 'admin-connection-report',
    label: 'Admin: connection report',
    group: 'admin',
    subject: `Connection report: ${data.reporterName} → ${data.targetName}`,
    html,
  }
}
