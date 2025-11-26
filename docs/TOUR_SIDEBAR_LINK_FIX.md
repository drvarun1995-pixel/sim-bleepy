# Fix: Bookings Tour Sidebar Link Issue

## Problem
The Bookings tour was skipping step 0 (sidebar link) because:
1. The sidebar container had `display: none` initially
2. There were duplicate IDs: one in mobile sidebar and one in desktop sidebar
3. React-joyride was finding the wrong element (mobile instead of desktop)

## Solution

### 1. Sidebar Container Visibility
The sidebar container was hidden (`display: none`). We detect this and make it visible:
```typescript
if (sidebarInfo.display === 'none' && sidebarContainer) {
  const sidebarEl = sidebarContainer as HTMLElement
  const shouldBeFlex = sidebarEl.className.includes('flex')
  sidebarEl.style.display = shouldBeFlex ? 'flex' : 'block'
  // Wait for layout recalculation
  await new Promise(resolve => requestAnimationFrame(resolve))
  await new Promise(resolve => requestAnimationFrame(resolve))
  await new Promise(resolve => setTimeout(resolve, 100))
}
```

### 2. Desktop vs Mobile Sidebar Link
Since there are duplicate IDs (mobile and desktop), we find the desktop one:
- Desktop sidebar link is in a `nav` element
- Mobile sidebar link is in a div with `lg:hidden` class
- We prefer the desktop one by checking parent elements

### 3. Unique Selector for React-Joyride
React-joyride needs a unique selector. We:
1. Find the correct desktop sidebar link
2. Add a temporary `data-tour-target` attribute
3. Update the step target to use this attribute

```typescript
// Add temporary data attribute to the element we found
sidebarLink.setAttribute('data-tour-target', 'sidebar-bookings-link-desktop')
// Update the step target
finalSteps[0] = {
  ...finalSteps[0],
  target: '[data-tour-target="sidebar-bookings-link-desktop"]'
}
```

## Key Differences from Calendar/Events Tours
- Calendar and Events links are in the "Main" section (always visible)
- Bookings link is in the "Event Operations" section (may be hidden)
- Bookings has duplicate IDs (mobile + desktop), others don't

## Files Modified
- `components/onboarding/OnboardingTourProvider.tsx` - Added sidebar visibility check and desktop link detection
- `lib/onboarding/steps/bookings/CompleteBookingsTour.tsx` - Updated target selector to `nav #sidebar-bookings-link`

## Future Reference
If similar issues occur with other sidebar links:
1. Check if sidebar container is visible
2. Check for duplicate IDs (mobile vs desktop)
3. Use a more specific selector or add a temporary data attribute
4. Ensure the element has dimensions before starting the tour

