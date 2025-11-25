'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { tourSteps } from '@/lib/onboarding/tourSteps'
import { OnboardingContext } from './OnboardingContext'
import type { Step } from 'react-joyride'
import {
  createCompleteCalendarTour,
  createCompleteEventsListTour,
  createCompleteFormatsTour,
  createCompleteMyBookingsTour,
  createCompleteMyAttendanceTour,
  createCompleteMyCertificatesTour,
  createCompleteEventDataTour,
} from '@/lib/onboarding/steps'

// Dynamically import Joyride to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride'), { ssr: false })

interface OnboardingTourProviderProps {
  children: React.ReactNode
  userRole?: string | null
}

// Onboarding Tour Logger - Use this prefix to filter logs in browser console
// In Firefox: Filter by "[TOUR]" or use console filter
// You can also filter by log level: Errors, Warnings, Info, Logs, Debug
const tourLog = {
  error: (...args: any[]) => {
    console.groupCollapsed('%c[TOUR ERROR]', 'color: red; font-weight: bold;');
    console.error(...args);
    console.groupEnd();
  },
  warn: (...args: any[]) => {
    console.groupCollapsed('%c[TOUR WARN]', 'color: orange; font-weight: bold;');
    console.warn(...args);
    console.groupEnd();
  },
  info: (...args: any[]) => {
    console.info('%c[TOUR INFO]', 'color: blue; font-weight: bold;', ...args);
  },
  debug: (...args: any[]) => {
    console.debug('%c[TOUR DEBUG]', 'color: gray; font-weight: bold;', ...args);
  },
  log: (...args: any[]) => {
    console.log('%c[TOUR]', 'color: green; font-weight: bold;', ...args);
  },
  step: (stepIndex: number, message: string, ...args: any[]) => {
    console.log(`%c[TOUR STEP ${stepIndex}]`, 'color: purple; font-weight: bold;', message, ...args);
  },
  element: (selector: string, status: 'ready' | 'not-ready' | 'checking', details?: any) => {
    const emoji = status === 'ready' ? '✅' : status === 'not-ready' ? '❌' : '🔍';
    const color = status === 'ready' ? 'color: green;' : status === 'not-ready' ? 'color: red;' : 'color: blue;';
    console.debug(`%c[TOUR ELEMENT] ${emoji} ${selector}`, color, status, details || '');
  }
};

export function OnboardingTourProvider({ children, userRole }: OnboardingTourProviderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)
  const [waitingForElement, setWaitingForElement] = useState(false)
  const [isLoadingTour, setIsLoadingTour] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')
  const waitingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const usingCustomStepsRef = useRef(false) // Track if we're using custom steps

  // Check if device is desktop (not mobile or tablet)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])



  // Get steps based on role
  const getStepsForRole = useCallback(() => {
    if (!userRole) return []
    
    const roleMap: Record<string, keyof typeof tourSteps> = {
      student: 'student',
      educator: 'educator',
      meded_team: 'meded_team',
      ctf: 'ctf',
    }

    const role = roleMap[userRole] || 'student'
    return tourSteps[role] || []
  }, [userRole])

  // Initialize steps from role, but allow dynamic modification for fallbacks
  const [steps, setSteps] = useState(() => getStepsForRole())

  // Update steps when role changes (but only if not using custom steps)
  useEffect(() => {
    if (!usingCustomStepsRef.current) {
    setSteps(getStepsForRole())
    }
  }, [getStepsForRole])

  // Remove overlay background-color when tour is running (react-joyride sets it via inline styles)
  // Except for the first step (stepIndex === 0) where we want the overlay to show
  useEffect(() => {
    if (!run || typeof document === 'undefined') return

    const removeOverlayBackground = () => {
      const overlay = document.querySelector('.react-joyride__overlay') as HTMLElement
      const spotlight = document.querySelector('.react-joyride__spotlight') as HTMLElement
      
      if (overlay) {
        // If it's the first step (no spotlight exists), keep the overlay background
        // Otherwise, remove it to let the spotlight's box-shadow create the dimming
        if (stepIndex === 0 && !spotlight) {
          overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
        } else {
          overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)'
        }
      }
    }

    // Remove immediately
    removeOverlayBackground()

    // Use MutationObserver to watch for overlay changes
    const observer = new MutationObserver(() => {
      removeOverlayBackground()
    })

    // Observe the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    })

    // Also check periodically (fallback)
    const interval = setInterval(removeOverlayBackground, 100)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [run, stepIndex])

  // Inject dynamic CSS for styling
  useEffect(() => {
    if (typeof document !== 'undefined' && steps.length > 0) {
      const styleId = 'joyride-custom-styles'
      let styleElement = document.getElementById(styleId) as HTMLStyleElement
      
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = styleId
        document.head.appendChild(styleElement)
      }
      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               styleElement.textContent = `
              .react-joyride__overlay {
                opacity: 1 !important;
                /* Default to transparent, but will be overridden by inline styles for first step */
                background-color: rgba(0, 0, 0, 0) !important;
              }
              /* When there's no spotlight (first step), show overlay background */
              .react-joyride__overlay:not(:has(.react-joyride__spotlight)) {
                background-color: rgba(0, 0, 0, 0.7) !important;
              }
            /* Main spotlight container - must be fully transparent */
            .react-joyride__spotlight {
              background: transparent !important;
              background-color: rgba(0, 0, 0, 0) !important;
              opacity: 1 !important;
              pointer-events: none !important;
              mix-blend-mode: normal !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            /* All children of spotlight must be fully visible */
            .react-joyride__spotlight *,
            .react-joyride__spotlight > *,
            .react-joyride__spotlight > div,
            .react-joyride__spotlight > div > * {
              pointer-events: auto !important;
              opacity: 1 !important;
              visibility: visible !important;
              background: transparent !important;
              background-color: transparent !important;
              filter: none !important;
              transform: none !important;
              box-shadow: none !important;
            }
            /* Ensure all nested elements and pseudo-elements are visible */
            .react-joyride__spotlight *,
            .react-joyride__spotlight *::before,
            .react-joyride__spotlight *::after {
              opacity: 1 !important;
              visibility: visible !important;
              background: transparent !important;
            }
            /* Remove any pseudo-elements that might add darkening */
            .react-joyride__spotlight::before,
            .react-joyride__spotlight::after {
              display: none !important;
              opacity: 0 !important;
            }
            /* Target any wrapper divs - make them transparent */
            div[class*="spotlight"],
            div[style*="spotlight"],
            [class*="joyride"][class*="spotlight"] {
              background-color: transparent !important;
              background: transparent !important;
              opacity: 1 !important;
            }
            /* Force the actual content to be fully visible with full brightness */
            .react-joyride__spotlight > div,
            .react-joyride__spotlight > * {
              background: transparent !important;
              opacity: 1 !important;
              filter: brightness(1) contrast(1) saturate(1) !important;
              -webkit-filter: brightness(1) contrast(1) saturate(1) !important;
            }
                         /* Ensure the overlay doesn't darken the spotlight area */
             .react-joyride__overlay ~ .react-joyride__spotlight,
             .react-joyride__overlay + .react-joyride__spotlight {
               background: transparent !important;
               opacity: 1 !important;
             }
             /* Make overlay transparent in spotlight area */
             .react-joyride__spotlight {
               background-color: rgba(0, 0, 0, 0) !important;
               z-index: 10001 !important;
               position: relative !important;
             }
             .react-joyride__spotlight > * {
               position: relative !important;
               z-index: 10002 !important;
               isolation: isolate !important;
             }
             /* Ensure the overlay itself doesn't cover the spotlight content */
             .react-joyride__overlay {
               pointer-events: auto !important;
             }
             /* Make sure elements inside spotlight are not affected by overlay */
             .react-joyride__spotlight [data-tour],
             .react-joyride__spotlight [id*="dashboard"],
             .react-joyride__spotlight [class*="Card"],
             .react-joyride__spotlight [class*="card"],
             .react-joyride__spotlight > div,
             .react-joyride__spotlight > section,
             .react-joyride__spotlight > article,
             .react-joyride__spotlight > main {
               position: relative !important;
               z-index: 10003 !important;
               opacity: 1 !important;
               visibility: visible !important;
               background: transparent !important;
               filter: none !important;
               transform: none !important;
               isolation: isolate !important;
             }
             /* Ensure all child elements inherit full visibility */
             .react-joyride__spotlight * {
               isolation: isolate !important;
             }
                                       .react-joyride__tooltip footer {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 12px !important;
            padding-top: 20px !important;
            padding-bottom: 20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
            margin-top: 20px !important;
            margin-bottom: 10px !important;
            border-top: 1px solid #E5E7EB !important;
          }
         .react-joyride__tooltip footer > div {
           display: flex !important;
           align-items: center !important;
           gap: 12px !important;
         }
         .react-joyride__button--next:hover,
         .react-joyride__button--back:hover {
           transform: translateY(-1px) !important;
         }
         .react-joyride__button--skip:hover {
           color: #9333EA !important;
           background-color: #F3F4F6 !important;
         }
         .react-joyride__close {
           color: #6B7280 !important;
         }
         .react-joyride__close:hover {
           color: #9333EA !important;
         }
       `
    }
  }, [steps.length])

  // Function to check if an element is ready (exists and has dimensions)
  const isElementReady = useCallback((selector: string): { ready: boolean; reason?: string } => {
    if (!selector || selector === 'body') {
      return { ready: true }
    }

    // For selectors that might match multiple elements (like sidebar links),
    // find the correct one by filtering out anchor tags in sidebar
    let element: HTMLElement | null = null
    
    if (selector.includes('dashboard-main') || selector.includes('my-bookings')) {
      // For these selectors, we want to avoid sidebar links (anchor tags)
      // Try to find non-anchor elements first
      const allElements = document.querySelectorAll(selector)
      
      for (const el of Array.from(allElements)) {
        const htmlEl = el as HTMLElement
        // Skip anchor tags (sidebar links) - we want the actual content elements
        if (htmlEl.tagName === 'A' || htmlEl.tagName === 'a') {
          continue
        }
        // For dashboard-main, prefer MAIN tag
        if (selector.includes('dashboard-main') && htmlEl.tagName === 'MAIN') {
          element = htmlEl
          break
        }
        // For my-bookings, prefer elements with Card-like structure (not in sidebar)
        if (selector.includes('my-bookings')) {
          // Check if it's not in the sidebar (sidebar is usually in an aside or has specific classes)
          const isInSidebar = htmlEl.closest('aside') || 
                             htmlEl.closest('[class*="sidebar"]') ||
                             htmlEl.closest('[class*="Sidebar"]')
          if (!isInSidebar) {
            element = htmlEl
            break
          }
        }
      }
      
      // If we didn't find a non-anchor element, fall back to first match
      if (!element && allElements.length > 0) {
        element = allElements[0] as HTMLElement
      }
    } else {
      // For other selectors, use normal querySelector
      element = document.querySelector(selector) as HTMLElement
    }
    
    // Special handling for event-data pagination - always consider it ready
    // It's in the all-events section which should be active by step 10
    if (selector.includes('event-data-pagination')) {
      if (element) {
        // Element exists - check if it has any content or dimensions
        const rect = element.getBoundingClientRect()
        const hasContent = element.children.length > 0 || element.textContent?.trim().length > 0
        
        // Even if it has zero dimensions, if it has content or is in the DOM, consider it ready
        if (hasContent || rect.width > 0 || rect.height > 0 || element.offsetHeight > 0) {
          tourLog.element(selector, 'ready', { hasContent, dimensions: `${rect.width}x${rect.height}` })
          return { ready: true }
        } else {
          // Element exists but might be empty - still consider it ready as it will have content
          tourLog.element(selector, 'ready', 'empty but will have content')
          return { ready: true }
        }
      } else {
        // Element doesn't exist yet - it's in all-events section which should be active
        // Consider it ready - it will be rendered when we reach that step
        tourLog.element(selector, 'ready', 'not rendered yet, will be rendered when step is reached')
        return { ready: true }
      }
    }
    
    // Special handling for event-data and add-event elements that don't exist yet (inactive tabs)
    if (!element) {
      // For event-data non-tab elements, if they don't exist, they're in an inactive tab
      // Consider them ready - they'll be rendered when the tab is switched
      if (selector.includes('event-data') && !selector.includes('tab')) {
        tourLog.element(selector, 'ready', 'in inactive tab, will be rendered when tab is switched')
        return { ready: true }
      }
      // For add-event form elements, if they don't exist, they're in the Add Event tab which isn't active
      // Consider them ready - they'll be rendered when we switch to the Add Event tab
      if (selector.includes('add-event-')) {
        tourLog.element(selector, 'ready', 'in Add Event tab, will be rendered when tab is switched')
        return { ready: true }
      }
      return { ready: false, reason: 'Element not found in DOM' }
    }

    if (!document.contains(element)) {
      return { ready: false, reason: 'Element not attached to DOM' }
    }

    // Special handling for event-data tab buttons - they're always ready if they exist
    if (selector.includes('event-data') && selector.includes('tab')) {
      tourLog.element(selector, 'ready', 'tab button exists')
      return { ready: true }
    }

    // Get computed styles first
    const styles = window.getComputedStyle(element)
    const display = styles.display
    const visibility = styles.visibility
    const opacity = parseFloat(styles.opacity)
    
    // Special handling for event-data and add-event elements that are hidden (inactive tab sections)
    // They'll become visible when the tab is switched by the tour
    if (display === 'none' && selector.includes('event-data') && !selector.includes('tab')) {
      tourLog.element(selector, 'ready', 'hidden in inactive tab, will become visible when tab is switched')
      return { ready: true }
    }
    // For add-event form elements that are hidden, they're in the Add Event tab
    // They'll become visible when we switch to the Add Event tab
    if (display === 'none' && selector.includes('add-event-')) {
      tourLog.element(selector, 'ready', 'hidden in Add Event tab, will become visible when tab is switched')
      return { ready: true }
    }
    
    // If element is hidden by CSS, it's not ready (for non-event-data elements)
    if (display === 'none') {
      return { ready: false, reason: 'Element has display: none' }
    }
    
    if (visibility === 'hidden') {
      return { ready: false, reason: 'Element has visibility: hidden' }
    }
    
    // Force layout recalculation - this is critical for flexbox elements
    // Accessing offsetHeight forces the browser to calculate layout
    void element.offsetHeight
    void element.offsetWidth
    void element.scrollHeight
    void element.scrollWidth
    
    // Also force parent layout if needed - especially for flex containers
    let parent = element.parentElement
    let parentChain = 0
    while (parent && parent !== document.body && parentChain < 5) {
      void parent.offsetHeight
      void parent.offsetWidth
      parent = parent.parentElement
      parentChain++
    }
    
    // Now get the bounding rect after forcing layout
    const rect = element.getBoundingClientRect()
    
    // Check multiple dimension indicators for flexbox elements
    const boundingRectWidth = rect.width
    const boundingRectHeight = rect.height
    const scrollWidth = element.scrollWidth
    const scrollHeight = element.scrollHeight
    const clientWidth = element.clientWidth
    const clientHeight = element.clientHeight
    const offsetWidth = element.offsetWidth
    const offsetHeight = element.offsetHeight
    
    // Debug logging for problematic selectors
    if (selector.includes('dashboard-main') || selector.includes('my-bookings')) {
      const isInSidebar = element.closest('aside') || 
                         element.closest('[class*="sidebar"]') ||
                         element.closest('[class*="Sidebar"]')
      
      tourLog.element(selector, 'checking', {
        rect: `${boundingRectWidth}x${boundingRectHeight}`,
        scroll: `${scrollWidth}x${scrollHeight}`,
        client: `${clientWidth}x${clientHeight}`,
        offset: `${offsetWidth}x${offsetHeight}`,
        display,
        visibility,
        opacity,
        hasChildren: element.children.length,
        tagName: element.tagName,
        isInSidebar: !!isInSidebar,
        className: element.className.substring(0, 50)
      })
      
      // If we're checking a sidebar link, warn about it
      if (element.tagName === 'A' || isInSidebar) {
        tourLog.warn(`${selector} matched a sidebar link instead of content element. Looking for better match...`)
      }
    }
    
    // For flex-1 or flex elements, check if parent has dimensions
    if (boundingRectWidth === 0 || boundingRectHeight === 0) {
      const parentElement = element.parentElement
      if (parentElement) {
        const parentRect = parentElement.getBoundingClientRect()
        const parentStyles = window.getComputedStyle(parentElement)
        const isParentFlex = parentStyles.display === 'flex' || parentStyles.display === 'inline-flex'
        
        if (isParentFlex && parentRect.width > 0 && parentRect.height > 0) {
          // Parent is flex and has dimensions, element is likely ready even if rect shows 0
          // Check if element has visible children
          const children = Array.from(element.children) as HTMLElement[]
          if (children.length > 0) {
            const hasVisibleChildren = children.some(child => {
              const childRect = child.getBoundingClientRect()
              return childRect.width > 0 || childRect.height > 0
            })
            if (hasVisibleChildren) {
              tourLog.element(selector, 'ready', 'parent flex has dimensions and element has visible children')
              return { ready: true }
            }
          }
        }
      }
    }
    
    // For main layout containers (like dashboard-main), check if they have content
    if (selector.includes('dashboard-main') || element.tagName === 'MAIN') {
      // Check if there are any child elements
      const children = Array.from(element.children) as HTMLElement[]
      if (children.length > 0) {
        // Check if any child has dimensions or content
        const hasRenderedChildren = children.some(child => {
          const childRect = child.getBoundingClientRect()
          const childStyles = window.getComputedStyle(child)
          return (childRect.width > 0 || childRect.height > 0 || 
                  child.scrollWidth > 0 || child.scrollHeight > 0) &&
                 childStyles.display !== 'none'
        })
        
        if (hasRenderedChildren) {
          tourLog.element(selector, 'ready', 'main element has rendered children')
          return { ready: true }
        }
      }
      
      // For main elements, if scrollHeight > 0, it's ready (has content)
      if (scrollHeight > 0 || scrollWidth > 0) {
        tourLog.element(selector, 'ready', `main element has scroll dimensions (${scrollWidth}x${scrollHeight})`)
        return { ready: true }
      }
    }
    
    // For Card elements (like my-bookings), check if they have content
    if (selector.includes('my-bookings')) {
      // Check if Card has visible content
      const children = Array.from(element.children) as HTMLElement[]
      if (children.length > 0) {
        const hasContent = children.some(child => {
          const childRect = child.getBoundingClientRect()
          return childRect.width > 0 || childRect.height > 0
        })
        if (hasContent && (scrollHeight > 0 || scrollWidth > 0)) {
          tourLog.element(selector, 'ready', 'card has content and scroll dimensions')
          return { ready: true }
        }
      }
    }
    
    // For flexbox/grid elements, check if they have visible children
    const isFlexbox = display === 'flex' || display === 'inline-flex'
    const isGrid = display === 'grid' || display === 'inline-grid'
    
    if ((isFlexbox || isGrid) && (boundingRectWidth === 0 || boundingRectHeight === 0)) {
      const children = Array.from(element.children) as HTMLElement[]
      if (children.length > 0) {
        const hasVisibleChildren = children.some(child => {
          const childRect = child.getBoundingClientRect()
          const childStyles = window.getComputedStyle(child)
          return (childRect.width > 0 || childRect.height > 0) &&
                 childStyles.display !== 'none' &&
                 childStyles.visibility !== 'hidden'
        })
        
        if (hasVisibleChildren) {
          tourLog.element(selector, 'ready', 'flex/grid element has visible children')
          return { ready: true }
        }
      }
    }

    // Final check: if any dimension indicator shows size, it's ready
    if (boundingRectWidth > 0 && boundingRectHeight > 0) {
      return { ready: true }
    }
    
    if (scrollWidth > 0 && scrollHeight > 0) {
      return { ready: true }
    }
    
    if (clientWidth > 0 && clientHeight > 0) {
      return { ready: true }
    }
    
    if (offsetWidth > 0 && offsetHeight > 0) {
      return { ready: true }
    }

    return { ready: false, reason: `Element has zero dimensions (rect: ${boundingRectWidth}x${boundingRectHeight}, scroll: ${scrollWidth}x${scrollHeight}, client: ${clientWidth}x${clientHeight}, offset: ${offsetWidth}x${offsetHeight})` }
  }, [])

    // Helper function to get a more specific selector that avoids sidebar links
  const getSpecificSelector = useCallback((selector: string): string => {
    // For dashboard-main, use main tag selector to avoid sidebar link
    if (selector === '[data-tour="dashboard-main"]') {
      // Check if main element exists with this attribute
      const mainEl = document.querySelector('main[data-tour="dashboard-main"]')
      if (mainEl) {
        return 'main[data-tour="dashboard-main"]'
      }
      // Fallback: try to find main element and check if it has the attribute
      const mainElements = document.querySelectorAll('main')
      for (const main of Array.from(mainElements)) {
        if (main.getAttribute('data-tour') === 'dashboard-main') {
          return 'main[data-tour="dashboard-main"]'
        }
      }
    }
    
        // For my-bookings, prioritize sidebar link for tour steps
    // The sidebar link should be used for the tour, not the card element
    if (selector === '[data-tour="my-bookings"]') {
      const sidebarLink = document.querySelector('#sidebar-my-bookings-link')
      if (sidebarLink) {
        // Always return sidebar link for tour steps
        return '#sidebar-my-bookings-link'
      }
      // Fallback: if no sidebar link found, look for card element (legacy support)
      const allElements = document.querySelectorAll(selector)
      let cardElement: HTMLElement | null = null
      
      for (const el of Array.from(allElements)) {
        const htmlEl = el as HTMLElement
        // Skip anchor tags (sidebar links)
        if (htmlEl.tagName === 'A' || htmlEl.tagName === 'a') {
          continue
        }
        // Check if it's not in the sidebar
        const isInSidebar = htmlEl.closest('aside') || 
                           htmlEl.closest('[class*="sidebar"]') ||
                           htmlEl.closest('[class*="Sidebar"]')
        if (!isInSidebar) {
          cardElement = htmlEl
          break
        }
      }
      
      if (cardElement) {
        // Add a temporary data attribute that we can use for a unique selector
        // This won't interfere with styling or functionality
        const tourId = 'tour-my-bookings-card'
        cardElement.setAttribute('data-tour-target', tourId)
        return `[data-tour-target="${tourId}"]`
      }
    }
    
    // For calendar sidebar link, use specific ID
    if (selector === '[data-tour="calendar"]') {
      const calendarLink = document.querySelector('#sidebar-calendar-link')
      if (calendarLink) {
        return '#sidebar-calendar-link'
      }
    }
    
    // For events sidebar link, use specific ID
    if (selector === '[data-tour="events-list"]' || selector === '#sidebar-events-link') {
      const eventsLink = document.querySelector('#sidebar-events-link')
      if (eventsLink) {
        return '#sidebar-events-link'
      }
    }
    
    // For formats sidebar link, use specific ID
    if (selector === '[data-tour="formats"]' || selector === '#sidebar-formats-link') {
      const formatsLink = document.querySelector('#sidebar-formats-link')
      if (formatsLink) {
        return '#sidebar-formats-link'
      }
    }
    
    // For my-bookings sidebar link, use specific ID
    if (selector === '[data-tour="my-bookings"]' || selector === '#sidebar-my-bookings-link') {
      const myBookingsLink = document.querySelector('#sidebar-my-bookings-link')
      if (myBookingsLink) {
        return '#sidebar-my-bookings-link'
      }
    }
    
    // For my-attendance sidebar link, use specific ID
    if (selector === '[data-tour="my-attendance"]' || selector === '#sidebar-my-attendance-link') {
      const myAttendanceLink = document.querySelector('#sidebar-my-attendance-link')
      if (myAttendanceLink) {
        return '#sidebar-my-attendance-link'
      }
    }
    
    // For my-certificates sidebar link, use specific ID
    if (selector === '[data-tour="my-certificates"]' || selector === '#sidebar-my-certificates-link') {
      const myCertificatesLink = document.querySelector('#sidebar-my-certificates-link')
      if (myCertificatesLink) {
        return '#sidebar-my-certificates-link'
      }
    }
    
    // For event-data sidebar link, use specific ID
    if (selector === '[data-tour="event-data"]' || selector === '#sidebar-event-data-link') {
      const eventDataLink = document.querySelector('#sidebar-event-data-link')
      if (eventDataLink) {
        return '#sidebar-event-data-link'
      }
    }
    
    return selector
  }, [])

  // Function to wait for all step targets to be ready and apply fallbacks
  const waitForAllStepsReady = useCallback(async (stepsToCheck: Step[]): Promise<Step[]> => {
    tourLog.info('Checking all tour step targets...')
    setLoadingProgress('Checking page elements...')
    
    // First, update step targets to use more specific selectors where needed
    const updatedSteps = stepsToCheck.map((step, index) => {
      if (typeof step.target === 'string' && 
          (step.target === '[data-tour="dashboard-main"]' || step.target === '[data-tour="my-bookings"]')) {
        const specificSelector = getSpecificSelector(step.target)
        if (specificSelector !== step.target) {
          tourLog.debug(`Step ${index}: Using more specific selector "${specificSelector}" instead of "${step.target}"`)
          return { ...step, target: specificSelector }
        }
      }
      return step
    })
    
    const checks = updatedSteps.map((step, index) => {
      if (typeof step.target === 'string') {
        const check = isElementReady(step.target)
        if (!check.ready) {
          tourLog.element(step.target, 'not-ready', check.reason)
          return { index, target: step.target, ready: false, reason: check.reason }
        } else {
          tourLog.element(step.target, 'ready')
          return { index, target: step.target, ready: true }
        }
      }
      return { index, target: 'body', ready: true }
    })

    let notReady = checks.filter(c => !c.ready)
    
    if (notReady.length === 0) {
      tourLog.info('All step targets are ready!')
      setLoadingProgress('All elements ready!')
      return updatedSteps // Return steps with updated selectors
    }

    tourLog.debug(`${notReady.length} step(s) not ready, waiting...`)
    setLoadingProgress(`Waiting for ${notReady.length} element(s) to load...`)

    // Wait up to 15 seconds for elements to become ready
    // Special handling for step 8 (my-bookings) - it may need more time
    const maxWait = 15000
    const checkInterval = 300 // Check every 300ms instead of 200ms to reduce checks
    const startTime = Date.now()

    return new Promise((resolve) => {
      const checkElements = setInterval(() => {
        const elapsed = Date.now() - startTime
        const stillNotReady = notReady.filter(({ target }) => {
          const element = document.querySelector(target) as HTMLElement
          
          // Try to scroll element into view if it exists (helps with layout)
          if (element) {
            // Smooth scroll into view if element is not visible
            const rect = element.getBoundingClientRect()
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight &&
                             rect.left >= 0 && rect.right <= window.innerWidth
            
            if (!isVisible && elapsed > 1000) {
              // After 1 second, try scrolling element into view
              element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
            }
            
            // Force layout recalculation
            void element.offsetHeight
          }
          
          const check = isElementReady(target)
          // Only log when element becomes ready (not on every check)
          if (check.ready) {
            const wasInNotReady = notReady.find(nr => nr.target === target)
            if (wasInNotReady) {
              tourLog.element(target, 'ready', 'became ready after waiting')
            }
          }
          return !check.ready
        })

        if (stillNotReady.length === 0) {
          clearInterval(checkElements)
          tourLog.info('All elements are now ready!')
          setLoadingProgress('All elements ready!')
          resolve(stepsToCheck)
          return
        }

        // Update notReady for next iteration
        notReady = stillNotReady

        if (elapsed >= maxWait) {
          clearInterval(checkElements)
          tourLog.warn(`Timeout: ${stillNotReady.length} element(s) still not ready:`)
          stillNotReady.forEach(({ target, reason }) => {
            tourLog.debug(`  - ${target}: ${reason}`)
          })
          setLoadingProgress(`Some elements not ready, continuing anyway...`)
          
          // Apply fallback for elements that are still not ready
          // BUT: Don't apply fallback for my-bookings - let it try again when we reach it
          const stepsWithFallbacks = [...updatedSteps]
          stillNotReady.forEach(({ index: stepIdx, target: targetSelector }) => {
            // Skip my-bookings - let it try again when we actually reach it
            if (targetSelector === '[data-tour="my-bookings"]') {
              tourLog.debug(`Step ${stepIdx} (${targetSelector}): Skipping fallback in initial check, will retry when step is reached`)
              return
            }
            
            if (updatedSteps[stepIdx] && updatedSteps[stepIdx].target !== 'body') {
              updatedSteps[stepIdx] = {
                ...updatedSteps[stepIdx],
                target: 'body',
                placement: 'center' as const,
                disableBeacon: true,
              }
              console.log(`✅ Applied fallback for step ${stepIdx} (${targetSelector})`)
            }
          })
          
          // Update state and return updated steps
          setSteps(updatedSteps)
          resolve(updatedSteps)
          return
        }

        setLoadingProgress(`Waiting for ${stillNotReady.length} element(s) to load...`)
              }, checkInterval)
      })
  }, [isElementReady, getSpecificSelector])

  const handleJoyrideCallback = useCallback((data: any) => {
    const { status, type, index, action, step } = data

    // Log all callbacks with tour prefix for easy filtering
    if (type === 'step:before' || type === 'step:after' || type === 'tour:start' || type === 'tour:end') {
      tourLog.step(index ?? -1, `${type} - ${action}`, { status, stepTarget: step?.target })
    } else {
    console.log('Joyride callback:', { status, type, index, stepIndex, action, step })
    }
    

    // Handle step progression - sync state with react-joyride's internal state
    if (type === 'step:before') {
      // Before showing a step - sync our state for display (step counter in button text)
      if (index !== undefined && index >= 0 && index < steps.length) {
        setStepIndex(index)
        // Log step details for debugging
        const currentStep = steps[index]
        tourLog.debug(`Step ${index} (${index + 1} of ${steps.length}): target="${currentStep?.target}", placement="${currentStep?.placement}"`)
      }
      
      // Define stepTarget once at the beginning - used for both tab switching and my-bookings handling
      const currentStepFromState = steps[index]
      const stepTarget = step?.target || currentStepFromState?.target
      
      // Handle enable checkboxes BEFORE react-joyride checks the next step's element
      // This ensures dependent elements are ready when react-joyride tries to show them
      if (typeof stepTarget === 'string' && stepTarget.includes('add-event-enable-')) {
        // Check if the next step is a dependent step that needs this checkbox enabled
        const nextIndex = index + 1
        if (nextIndex < steps.length) {
          const nextStep = steps[nextIndex]
          const nextStepTarget = nextStep?.target
          
          // Check if next step is booking-settings (depends on enable-booking)
          if (stepTarget.includes('add-event-enable-booking') && 
              typeof nextStepTarget === 'string' && 
              nextStepTarget.includes('add-event-booking-settings')) {
            const bookingCheckbox = document.querySelector('#bookingEnabled') as HTMLInputElement
            if (bookingCheckbox && !bookingCheckbox.checked) {
              tourLog.debug(`[step:before] Step ${index}: Enabling booking checkbox for next step ${nextIndex}`)
              setRun(false)
              bookingCheckbox.click()
              
              // Wait for next step's element to appear
              setTimeout(() => {
                let attempts = 0
                const maxAttempts = 50
                const checkInterval = setInterval(() => {
                  attempts++
                  const checkElement = document.querySelector(nextStepTarget) as HTMLElement
                  if (checkElement) {
                    const rect = checkElement.getBoundingClientRect()
                    const style = window.getComputedStyle(checkElement)
                    const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
                    
                    if (isVisible) {
                      clearInterval(checkInterval)
                      tourLog.debug(`✅ Step ${nextIndex} element now visible after ${attempts * 100}ms, resuming at step ${index}`)
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    } else if (attempts >= maxAttempts) {
                      clearInterval(checkInterval)
                      tourLog.warn(`⚠️ Step ${nextIndex} element exists but not visible after ${maxAttempts * 100}ms, resuming anyway`)
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    }
                  } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval)
                    tourLog.warn(`❌ Step ${nextIndex} element not found after ${maxAttempts * 100}ms, resuming anyway`)
                    setTimeout(() => {
                      setStepIndex(index)
                      setRun(true)
                    }, 100)
                  }
                }, 100)
              }, 300)
              return // Don't continue with normal flow
            }
          }
          
          // Check if next step is feedback-template (depends on enable-feedback)
          if (stepTarget.includes('add-event-enable-feedback') && 
              typeof nextStepTarget === 'string' && 
              nextStepTarget.includes('add-event-feedback-template')) {
            const feedbackCheckbox = document.querySelector('#feedbackEnabled') as HTMLInputElement
            if (feedbackCheckbox && !feedbackCheckbox.checked) {
              tourLog.debug(`[step:before] Step ${index}: Enabling feedback checkbox for next step ${nextIndex}`)
              setRun(false)
              feedbackCheckbox.click()
              
              // Wait for next step's element to appear
              setTimeout(() => {
                let attempts = 0
                const maxAttempts = 50
                const checkInterval = setInterval(() => {
                  attempts++
                  const checkElement = document.querySelector(nextStepTarget) as HTMLElement
                  if (checkElement) {
                    const rect = checkElement.getBoundingClientRect()
                    const style = window.getComputedStyle(checkElement)
                    const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
                    
                    if (isVisible) {
                      clearInterval(checkInterval)
                      tourLog.debug(`✅ Step ${nextIndex} element now visible after ${attempts * 100}ms, resuming at step ${index}`)
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    } else if (attempts >= maxAttempts) {
                      clearInterval(checkInterval)
                      tourLog.warn(`⚠️ Step ${nextIndex} element exists but not visible after ${maxAttempts * 100}ms, resuming anyway`)
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    }
                  } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval)
                    tourLog.warn(`❌ Step ${nextIndex} element not found after ${maxAttempts * 100}ms, resuming anyway`)
                    setTimeout(() => {
                      setStepIndex(index)
                      setRun(true)
                    }, 100)
                  }
                }, 100)
              }, 300)
              return // Don't continue with normal flow
            }
          }
          
          // Check if next step is certificate-template (depends on enable-certificates)
          if (stepTarget.includes('add-event-enable-certificates') && 
              typeof nextStepTarget === 'string' && 
              nextStepTarget.includes('add-event-certificate-template')) {
            const certificateCheckbox = document.querySelector('#autoGenerateCertificate') as HTMLInputElement
            if (certificateCheckbox && !certificateCheckbox.checked) {
              tourLog.debug(`[step:before] Step ${index}: Enabling certificate checkbox for next step ${nextIndex}`)
              setRun(false)
              certificateCheckbox.click()
              
              // Wait for next step's element to appear
              setTimeout(() => {
                let attempts = 0
                const maxAttempts = 50
                const checkInterval = setInterval(() => {
                  attempts++
                  const checkElement = document.querySelector(nextStepTarget) as HTMLElement
                  if (checkElement) {
                    const rect = checkElement.getBoundingClientRect()
                    const style = window.getComputedStyle(checkElement)
                    const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
                    
                    if (isVisible) {
                      clearInterval(checkInterval)
                      tourLog.debug(`✅ Step ${nextIndex} element now visible after ${attempts * 100}ms, resuming at step ${index}`)
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    } else if (attempts >= maxAttempts) {
                      clearInterval(checkInterval)
                      tourLog.warn(`⚠️ Step ${nextIndex} element exists but not visible after ${maxAttempts * 100}ms, resuming anyway`)
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    }
                  } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval)
                    tourLog.warn(`❌ Step ${nextIndex} element not found after ${maxAttempts * 100}ms, resuming anyway`)
                    setTimeout(() => {
                      setStepIndex(index)
                      setRun(true)
                    }, 100)
                  }
                }, 100)
              }, 300)
              return // Don't continue with normal flow
            }
          }
          
          // Enable attendance checkbox (no dependent steps, so just enable it)
          if (stepTarget.includes('add-event-enable-attendance')) {
            const attendanceCheckbox = document.querySelector('#qrAttendanceEnabled') as HTMLInputElement
            if (attendanceCheckbox && !attendanceCheckbox.checked) {
              tourLog.debug(`[step:before] Step ${index}: Enabling attendance checkbox (no dependent steps)`)
              attendanceCheckbox.click()
              // No pause needed - just enable it and continue
            }
          }
        }
      }
      
      // Handle tab switching for event-data tour
      if (typeof stepTarget === 'string') {
        // Map tab data-tour attributes to their corresponding section keys
        const tabMap: Record<string, string> = {
          'event-data-all-events-tab': 'all-events',
          'event-data-add-event-tab': 'add-event',
          'event-data-bulk-upload-tab': 'bulk-upload',
          'event-data-category-tab': 'categories',
          'event-data-format-tab': 'formats',
          'event-data-locations-tab': 'locations',
          'event-data-organizers-tab': 'organizers',
          'event-data-speakers-tab': 'speakers',
        }
        
        // Map Add Event form sub-tabs to their section keys
        const addEventFormTabMap: Record<string, string> = {
          'add-event-basic-information-tab': 'basic',
          'add-event-date-time-tab': 'date-time',
          'add-event-location-tab': 'location',
          'add-event-links-tab': 'links',
          'add-event-organizer-tab': 'organizer',
          'add-event-speakers-tab': 'speakers',
          'add-event-booking-tab': 'booking',
          'add-event-feedback-tab': 'feedback',
          'add-event-attendance-tab': 'attendance',
          'add-event-certificates-tab': 'certificates',
          'add-event-status-tab': 'status',
        }
        
        // Check if this step targets an Add Event form sub-tab
        for (const [dataTourAttr, formSectionKey] of Object.entries(addEventFormTabMap)) {
          if (stepTarget.includes(dataTourAttr) || stepTarget === `[data-tour="${dataTourAttr}"]`) {
            // First, ensure we're on the Add Event tab
            const addEventTab = document.querySelector('[data-tour="event-data-add-event-tab"]') as HTMLElement
            if (addEventTab) {
              // Check if Add Event tab is active by looking at the button or parent
              const addEventTabButton = addEventTab.closest('button') || addEventTab
              const isAddEventActive = addEventTabButton.classList.contains('bg-gray-700') || 
                                       addEventTab.getAttribute('aria-selected') === 'true' ||
                                       addEventTabButton.classList.contains('text-white')
              
              if (!isAddEventActive) {
                // Switch to Add Event tab first
                addEventTab.click()
                // Wait for tab switch, then switch to form sub-tab
                setTimeout(() => {
                  const formTabButton = document.querySelector(`[data-tour="${dataTourAttr}"]`) as HTMLElement
                  if (formTabButton) {
                    formTabButton.click()
                    tourLog.debug(`Switched to Add Event tab and form sub-tab: ${dataTourAttr}`)
                  } else {
                    tourLog.warn(`Form sub-tab button not found: ${dataTourAttr}`)
                  }
                }, 300)
              } else {
                // Already on Add Event tab, just switch to form sub-tab
                const formTabButton = document.querySelector(`[data-tour="${dataTourAttr}"]`) as HTMLElement
                if (formTabButton) {
                  // Check if this form tab is already active
                  const isFormTabActive = formTabButton.classList.contains('bg-blue-100') || 
                                         formTabButton.classList.contains('text-blue-700')
                  if (!isFormTabActive) {
                    formTabButton.click()
                    tourLog.debug(`Switched to form sub-tab: ${dataTourAttr}`)
                  }
                } else {
                  tourLog.warn(`Form sub-tab button not found: ${dataTourAttr}`)
                }
              }
            } else {
              tourLog.warn(`Add Event tab button not found`)
            }
            break
          }
        }
        
        // Check if this step targets a main tab button
        for (const [dataTourAttr, sectionKey] of Object.entries(tabMap)) {
          if (stepTarget.includes(dataTourAttr) || stepTarget === `[data-tour="${dataTourAttr}"]`) {
            // Find the tab button and click it to switch tabs
            const tabButton = document.querySelector(`[data-tour="${dataTourAttr}"]`) as HTMLElement
            if (tabButton) {
              // For add-event-tab, inject CSS to make tooltip fixed while maintaining arrow connection
              if (dataTourAttr === 'event-data-add-event-tab') {
                // Inject CSS that makes the floater fixed but preserves react-joyride's positioning logic
                const styleId = 'tour-add-event-tab-fixed'
                let styleElement = document.getElementById(styleId) as HTMLStyleElement
                
                if (!styleElement) {
                  styleElement = document.createElement('style')
                  styleElement.id = styleId
                  document.head.appendChild(styleElement)
                }
                
                // Make the floater fixed but let react-joyride calculate the position
                // This keeps the arrow and tooltip connected
                styleElement.textContent = `
                  .react-joyride__floater {
                    position: fixed !important;
                    z-index: 10000 !important;
                  }
                `
                
                // Store cleanup function
                ;(window as any).__tourScrollCleanup = () => {
                  if (styleElement && styleElement.parentNode) {
                    styleElement.parentNode.removeChild(styleElement)
                  }
                  delete (window as any).__tourScrollCleanup
                }
                
                // After switching to Add Event tab, also switch to Basic Information form sub-tab
                // This ensures the form is ready for the next step
                setTimeout(() => {
                  const basicInfoTab = document.querySelector('[data-tour="add-event-basic-information-tab"]') as HTMLElement
                  if (basicInfoTab) {
                    basicInfoTab.click()
                  }
                }, 200)
              }
              
              // Use a small delay to ensure the tab switch happens before the step is shown
              setTimeout(() => {
                tabButton.click()
              }, 100)
            }
            break
          }
        }
        
        // Check if this step targets an Add Event form element (not a tab button)
        // If so, ensure we're on the Add Event tab and the correct form sub-tab
        if (stepTarget.includes('add-event-') && !stepTarget.includes('tab')) {
          // Determine which form sub-tab this element belongs to
          let targetFormTab = 'basic' // default
          
          if (stepTarget.includes('date-time') || stepTarget.includes('all-day') || stepTarget.includes('time-tweaks')) {
            targetFormTab = 'date-time'
          } else if (stepTarget.includes('location') || stepTarget.includes('primary-location') || stepTarget.includes('other-locations')) {
            targetFormTab = 'location'
          } else if (stepTarget.includes('links')) {
            targetFormTab = 'links'
          } else if (stepTarget.includes('organizer')) {
            targetFormTab = 'organizer'
          } else if (stepTarget.includes('speakers') && !stepTarget.includes('tab')) {
            targetFormTab = 'speakers'
          } else if (stepTarget.includes('booking')) {
            targetFormTab = 'booking'
          } else if (stepTarget.includes('feedback')) {
            targetFormTab = 'feedback'
          } else if (stepTarget.includes('attendance')) {
            targetFormTab = 'attendance'
          } else if (stepTarget.includes('certificates') || stepTarget.includes('certificate')) {
            targetFormTab = 'certificates'
          } else if (stepTarget.includes('status')) {
            targetFormTab = 'status'
          }
          
          // Ensure we're on the Add Event tab
          const addEventTab = document.querySelector('[data-tour="event-data-add-event-tab"]') as HTMLElement
          if (addEventTab) {
            const addEventTabButton = addEventTab.closest('button') || addEventTab
            const isAddEventActive = addEventTabButton.classList.contains('bg-gray-700') || 
                                     addEventTab.getAttribute('aria-selected') === 'true'
            
            if (!isAddEventActive) {
              // Switch to Add Event tab first
              addEventTab.click()
              // Wait for tab switch, then switch to form sub-tab
              setTimeout(() => {
                const formTabButton = document.querySelector(`[data-tour="add-event-${targetFormTab}-tab"]`) as HTMLElement
                if (formTabButton) {
                  formTabButton.click()
                }
              }, 200)
            } else {
              // Already on Add Event tab, just switch to form sub-tab if needed
              const formTabButton = document.querySelector(`[data-tour="add-event-${targetFormTab}-tab"]`) as HTMLElement
              if (formTabButton) {
                // Check if this form tab is already active
                const isFormTabActive = formTabButton.classList.contains('bg-blue-100') || 
                                       formTabButton.classList.contains('text-blue-700')
                if (!isFormTabActive) {
                  formTabButton.click()
                }
              }
            }
          }
        }
      }
      
      // Special handling for my-bookings card - only if the step target is actually my-bookings
      // Only match EXACTLY [data-tour="my-bookings"], not other my-bookings-* selectors
      const isMyBookings = stepTarget === '[data-tour="my-bookings"]'
      
      // Only apply special handling if the step target is actually my-bookings
      // Don't apply based on step index alone, as different tours have different step counts
      if (isMyBookings) {
        // Check if this is the sidebar link (not the card) - if so, skip special handling
        // Check both the step target and the current step from state (which may have been converted)
        const isSidebarLink = (typeof stepTarget === 'string' && 
                              (stepTarget.includes('#sidebar-my-bookings-link') || 
                               stepTarget === '#sidebar-my-bookings-link')) ||
                             (typeof currentStepFromState?.target === 'string' &&
                              (currentStepFromState.target.includes('#sidebar-my-bookings-link') ||
                               currentStepFromState.target === '#sidebar-my-bookings-link'))
        
        // Also check if getSpecificSelector would convert it to sidebar link
        let wouldBeSidebarLink = false
        if (typeof stepTarget === 'string' && stepTarget === '[data-tour="my-bookings"]') {
          const convertedSelector = getSpecificSelector(stepTarget)
          wouldBeSidebarLink = convertedSelector === '#sidebar-my-bookings-link'
        }
      
      // Check if step already has a specific selector (data-tour-target) - if so, skip special handling
      // Check both the callback step and the state step to catch updates made in step:after
      const alreadyHasSpecificSelector = 
        (typeof step?.target === 'string' && step.target.includes('data-tour-target')) ||
        (typeof currentStepFromState?.target === 'string' && currentStepFromState.target.includes('data-tour-target'))
      
        // Only apply special handling for my-bookings if it's NOT the sidebar link (i.e., it's the card element)
        // Skip if it's the sidebar link (which is what we want for the tour)
        // Also skip if getSpecificSelector would convert it to the sidebar link
        if (!isSidebarLink && !wouldBeSidebarLink && !alreadyHasSpecificSelector) {
        // For step 8, always try to restore the original target, even if fallback was applied
        const originalTarget = '[data-tour="my-bookings"]'
        // Find the correct element (Card, not sidebar link)
        const allElements = document.querySelectorAll(originalTarget)
        let element: HTMLElement | null = null
        
        for (const el of Array.from(allElements)) {
          const htmlEl = el as HTMLElement
          // Skip anchor tags (sidebar links)
          if (htmlEl.tagName === 'A' || htmlEl.tagName === 'a') {
            continue
          }
          // Check if it's not in the sidebar
          const isInSidebar = htmlEl.closest('aside') || 
                             htmlEl.closest('[class*="sidebar"]') ||
                             htmlEl.closest('[class*="Sidebar"]')
          if (!isInSidebar) {
            element = htmlEl
            break
          }
        }
        
        // Fallback to first match if no better match found
        if (!element && allElements.length > 0) {
          element = allElements[0] as HTMLElement
        }
        
        if (element) {
          // Element exists - scroll it into view and wait for it to be ready
          tourLog.debug(`My-bookings: Attempting to restore original target and wait for element...`)
          
          // Get a more specific selector for this element (this may add data-tour-target attribute)
          let specificSelector = getSpecificSelector(originalTarget)
          
          // Check if element now has data-tour-target attribute (added by getSpecificSelector)
          if (element.hasAttribute('data-tour-target')) {
            const tourId = element.getAttribute('data-tour-target')
            specificSelector = `[data-tour-target="${tourId}"]`
            tourLog.debug(`My-bookings: Found element with data-tour-target, using selector "${specificSelector}"`)
          }
          
          const useSpecificSelector = specificSelector !== originalTarget
          
          if (useSpecificSelector) {
            tourLog.debug(`My-bookings: Using more specific selector "${specificSelector}" instead of "${originalTarget}"`)
          }
          
          // Pause tour while we wait
          setRun(false)
          
          // Scroll into view immediately
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
          
          // Wait a moment for scroll to complete
          setTimeout(() => {
            // Wait for element to become ready (up to 3 seconds)
            let attempts = 0
            const maxAttempts = 15 // 15 * 200ms = 3 seconds
            
            const checkReady = setInterval(() => {
              attempts++
              
              // Force layout recalculation
              void element.offsetHeight
              
              // Check using the specific selector if we have one
              const selectorToCheck = useSpecificSelector ? specificSelector : originalTarget
              const check = isElementReady(selectorToCheck)
              
              if (check.ready) {
                clearInterval(checkReady)
                tourLog.info(`My-bookings: Element is now ready after ${attempts * 200}ms, using selector "${selectorToCheck}"`)
                
                // Update step with the specific selector BEFORE resuming
                // This ensures the next step:before won't trigger this handler again
                setSteps((prevSteps: Step[]) => {
                  const updatedSteps = [...prevSteps]
                  // Use current step from state, not from getStepsForRole() to preserve custom steps
                  if (updatedSteps[index]) {
                    updatedSteps[index] = {
                      ...updatedSteps[index],
                      target: selectorToCheck, // Use the specific selector
                    }
                  }
                  return updatedSteps
                })
                
                // Wait for state update to complete, then resume tour at this step
                // Use a longer delay to ensure state is fully updated
                setTimeout(() => {
                  requestAnimationFrame(() => {
                    setStepIndex(index)
                    // Small delay before resuming to ensure react-joyride picks up the new selector
                    setTimeout(() => {
                      setRun(true)
                    }, 100)
                  })
                }, 200)
              } else if (attempts >= maxAttempts) {
                clearInterval(checkReady)
                tourLog.warn(`My-bookings: Element still not ready after ${attempts * 200}ms, keeping fallback`)
                // Keep fallback - resume tour with fallback
                setTimeout(() => {
                  setStepIndex(index)
                  setRun(true)
                }, 100)
              }
            }, 200)
          }, 500) // Wait 500ms for scroll to complete
          
          return // Don't continue with normal flow for my-bookings card
        } else {
          tourLog.warn(`My-bookings element not found, using fallback`)
        }
        }
      }
      
      // Normal handling for other steps
      if (step?.target && typeof step.target === 'string' && step.target !== 'body') {
          tourLog.debug(`[step:before] Step ${index} (${step.target}): Starting step:before callback`)
          
          
          let element = document.querySelector(step.target) as HTMLElement
        
        // Special handling for Add Event form elements
        // Check if element exists AND is visible (not just marked as ready by isElementReady)
        const isAddEventElement = step.target.includes('add-event-')
        if (isAddEventElement) {
          tourLog.debug(`[step:before] Step ${index} (${step.target}): Is Add Event element, checking visibility`)
          let elementExists = !!element
          let elementVisible = false
          if (element) {
            const rect = element.getBoundingClientRect()
            const style = window.getComputedStyle(element)
            elementVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
          }
          
          tourLog.debug(`Step ${index} (${step.target}): elementExists=${elementExists}, elementVisible=${elementVisible}`)
          
          
          if (!elementExists || !elementVisible) {
          // Element doesn't exist - it's in the Add Event tab which might not be active
          // OR it's a dependent step that requires a checkbox to be enabled
          // First check if this is a dependent step that needs a checkbox
          let isDependentStep = false
          let checkboxSelector = ''
          let checkboxName = ''
          
          // Check if we're on booking-related steps (but not the enable step itself)
          if (!step.target.includes('add-event-enable-booking') && 
              (step.target.includes('add-event-booking-settings') ||
               step.target.includes('add-event-who-can-book') ||
               step.target.includes('add-event-confirmation-checkboxes'))) {
            isDependentStep = true
            checkboxSelector = '#bookingEnabled'
            checkboxName = 'booking'
          }
          
          // Check if we're on feedback-related steps (but not the enable step itself)
          if (!step.target.includes('add-event-enable-feedback') && 
              step.target.includes('add-event-feedback-template')) {
            isDependentStep = true
            checkboxSelector = '#feedbackEnabled'
            checkboxName = 'feedback'
          }
          
          // Check if we're on attendance-related steps (but not the enable step itself)
          if (!step.target.includes('add-event-enable-attendance') && 
              step.target.includes('add-event-attendance')) {
            isDependentStep = true
            checkboxSelector = '#qrAttendanceEnabled'
            checkboxName = 'attendance'
          }
          
          // Check if we're on certificate-related steps (but not the enable step itself)
          if (!step.target.includes('add-event-enable-certificates') &&
              (step.target.includes('add-event-certificate-template') ||
               step.target.includes('add-event-auto-send-certificates') ||
               step.target.includes('add-event-certificates-after-feedback'))) {
            isDependentStep = true
            checkboxSelector = '#autoGenerateCertificate'
            checkboxName = 'certificate'
          }
          
          // If this is a dependent step, enable checkbox first BEFORE switching tabs
          if (isDependentStep) {
            const checkbox = document.querySelector(checkboxSelector) as HTMLInputElement
            if (checkbox && !checkbox.checked) {
              tourLog.debug(`Step ${index} (${step.target}): Element not found/visible, enabling ${checkboxName} checkbox first`)
              checkbox.click()
              // Give React a moment to start re-rendering
              setTimeout(() => {
                // Continue with tab switching
              }, 100)
            } else if (checkbox && checkbox.checked) {
              tourLog.debug(`Step ${index} (${step.target}): ${checkboxName} checkbox already enabled, element should appear soon`)
            }
          }
          
          // Pause tour, switch tabs, wait for element, then resume
          tourLog.debug(`Step ${index} (${step.target}): Element not found, pausing tour to switch tabs`)
          setRun(false)
          
          // Ensure Add Event tab is active and the correct form sub-tab is active
          const addEventTab = document.querySelector('[data-tour="event-data-add-event-tab"]') as HTMLElement
          if (addEventTab) {
            const addEventTabButton = addEventTab.closest('button') || addEventTab
            const isAddEventActive = addEventTabButton.classList.contains('bg-gray-700') || 
                                     addEventTabButton.classList.contains('text-white')
            
            if (!isAddEventActive) {
              // Switch to Add Event tab
              addEventTab.click()
              tourLog.debug(`Switching to Add Event tab for step ${index}`)
            }
            
            // Determine which form sub-tab this element belongs to
            let targetFormTab = 'basic'
            if (step.target.includes('date-time') || step.target.includes('all-day') || step.target.includes('time-tweaks')) {
              targetFormTab = 'date-time'
            } else if (step.target.includes('location') || step.target.includes('primary-location') || step.target.includes('other-locations')) {
              targetFormTab = 'location'
            } else if (step.target.includes('links')) {
              targetFormTab = 'links'
            } else if (step.target.includes('organizer')) {
              targetFormTab = 'organizer'
            } else if (step.target.includes('speakers') && !step.target.includes('tab')) {
              targetFormTab = 'speakers'
            } else if (step.target.includes('booking')) {
              targetFormTab = 'booking'
            } else if (step.target.includes('feedback')) {
              targetFormTab = 'feedback'
            } else if (step.target.includes('attendance')) {
              targetFormTab = 'attendance'
            } else if (step.target.includes('certificates') || step.target.includes('certificate')) {
              targetFormTab = 'certificates'
            } else if (step.target.includes('status')) {
              targetFormTab = 'status'
            }
            
            // Wait for Add Event tab to switch (if needed), then switch to form sub-tab
            // If this is a dependent step, wait longer for checkbox to take effect
            const delay = isAddEventActive ? (isDependentStep ? 200 : 100) : (isDependentStep ? 400 : 300)
            setTimeout(() => {
              const formTabButton = document.querySelector(`[data-tour="add-event-${targetFormTab}-tab"]`) as HTMLElement
              if (formTabButton) {
                const isFormTabActive = formTabButton.classList.contains('bg-blue-100') || 
                                       formTabButton.classList.contains('text-blue-700')
                if (!isFormTabActive) {
                  formTabButton.click()
                  tourLog.debug(`Switched to form sub-tab: ${targetFormTab} for step ${index}`)
                }
              }
              
              // Auto-enable checkboxes for dependent sections (double-check in case it wasn't enabled above)
              // Checkbox should already be enabled above if this is a dependent step, but verify here
              // Check if we're on booking-related steps (but not the enable step itself)
              if (!step.target.includes('add-event-enable-booking') && 
                  (step.target.includes('add-event-booking-settings') ||
                   step.target.includes('add-event-who-can-book') ||
                   step.target.includes('add-event-confirmation-checkboxes'))) {
                // isDependentStep is already set above
                const bookingCheckbox = document.querySelector('#bookingEnabled') as HTMLInputElement
                if (bookingCheckbox) {
                  if (!bookingCheckbox.checked) {
                    bookingCheckbox.click()
                    tourLog.debug('Auto-enabled booking checkbox for dependent step')
                  } else {
                    tourLog.debug('Booking checkbox already enabled, but element not visible yet - will wait')
                  }
                }
              }
              
              // Check if we're on feedback-related steps (but not the enable step itself)
              if (!step.target.includes('add-event-enable-feedback') && 
                  step.target.includes('add-event-feedback-template')) {
                isDependentStep = true
                const feedbackCheckbox = document.querySelector('#feedbackEnabled') as HTMLInputElement
                if (feedbackCheckbox) {
                  if (!feedbackCheckbox.checked) {
                    feedbackCheckbox.click()
                    tourLog.debug('Auto-enabled feedback checkbox for dependent step')
                  } else {
                    tourLog.debug('Feedback checkbox already enabled, but element not visible yet - will wait')
                  }
                }
              }
              
              // Check if we're on attendance-related steps (but not the enable step itself)
              if (!step.target.includes('add-event-enable-attendance') && 
                  step.target.includes('add-event-attendance')) {
                isDependentStep = true
                const attendanceCheckbox = document.querySelector('#qrAttendanceEnabled') as HTMLInputElement
                if (attendanceCheckbox) {
                  if (!attendanceCheckbox.checked) {
                    attendanceCheckbox.click()
                    tourLog.debug('Auto-enabled attendance checkbox for dependent step')
                  } else {
                    tourLog.debug('Attendance checkbox already enabled, but element not visible yet - will wait')
                  }
                }
              }
              
              // Check if we're on certificate-related steps (but not the enable step itself)
              if (!step.target.includes('add-event-enable-certificates') &&
                  (step.target.includes('add-event-certificate-template') ||
                   step.target.includes('add-event-auto-send-certificates') ||
                   step.target.includes('add-event-certificates-after-feedback'))) {
                isDependentStep = true
                const certificateCheckbox = document.querySelector('#autoGenerateCertificate') as HTMLInputElement
                if (certificateCheckbox) {
                  if (!certificateCheckbox.checked) {
                    certificateCheckbox.click()
                    tourLog.debug('Auto-enabled certificate checkbox for dependent step')
                  } else {
                    tourLog.debug('Certificate checkbox already enabled, but element not visible yet - will wait')
                  }
                }
              }
              
              // Wait for checkbox to take effect and element to appear
              // If this is a dependent step (checkbox should be enabled), wait longer for React to re-render
              const initialDelay = isDependentStep ? 500 : 200
              const maxAttempts = isDependentStep ? 50 : 20 // 50 * 100ms = 5 seconds for dependent steps
              
              setTimeout(() => {
                tourLog.debug(`Starting to check for element ${step.target} (step ${index}), isDependentStep=${isDependentStep}`)
                let attempts = 0
                const checkInterval = setInterval(() => {
                  attempts++
                  const checkElement = document.querySelector(step.target) as HTMLElement
                  if (checkElement) {
                    // Check if element is actually visible, not just exists
                    const rect = checkElement.getBoundingClientRect()
                    const style = window.getComputedStyle(checkElement)
                    const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
                    
                    tourLog.debug(`Step ${index} (${step.target}): attempt ${attempts}, exists=true, visible=${isVisible}, dimensions=${rect.width}x${rect.height}, display=${style.display}, visibility=${style.visibility}`)
                    
                    if (isVisible) {
                      clearInterval(checkInterval)
                      tourLog.debug(`✅ Element found and visible for step ${index} after ${attempts * 100}ms, resuming tour`)
                      // Resume tour at this step
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    } else if (attempts >= maxAttempts) {
                      clearInterval(checkInterval)
                      tourLog.warn(`⚠️ Step ${index} (${step.target}) element exists but not visible after ${maxAttempts * 100}ms`)
                      // Still try to resume - element exists, might be a visibility issue
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    }
                  } else {
                    if (attempts % 5 === 0) { // Log every 5 attempts to avoid spam
                      tourLog.debug(`Step ${index} (${step.target}): attempt ${attempts}, element not found yet`)
                    }
                    if (attempts >= maxAttempts) {
                      clearInterval(checkInterval)
                      // Still not found - apply fallback
                      tourLog.warn(`❌ Step ${index} (${step.target}) still not found after ${maxAttempts * 100}ms (tab switch + checkbox enable), applying fallback`)
                      setSteps((prevSteps: Step[]) => {
                        const updatedSteps = [...prevSteps]
                        if (updatedSteps[index]) {
                          updatedSteps[index] = {
                            ...updatedSteps[index],
                            target: 'body',
                            placement: 'center' as const,
                            disableBeacon: true,
                          }
                        }
                        return updatedSteps
                      })
                      // Resume with fallback
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    }
                  }
                }, 100)
              }, initialDelay)
            }, delay)
            
            return // Don't continue with normal flow
          }
          }
        }
        
        if (!element) {
          // Target doesn't exist - apply fallback immediately (for non-Add Event elements)
          const stepToUpdate = steps[index]
          if (stepToUpdate && stepToUpdate.target !== 'body') {
            tourLog.warn(`Step ${index} (${step.target}) not found in step:before, applying fallback`)
            setSteps((prevSteps: Step[]) => {
              const updatedSteps = [...prevSteps]
              if (updatedSteps[index]) {
                updatedSteps[index] = {
                  ...updatedSteps[index],
                  target: 'body',
                  placement: 'center' as const,
                  disableBeacon: true,
                }
              }
              return updatedSteps
            })
            // Return early - react-joyride will retry with the updated step
            return
          }
        } else {
          // Element exists - check if it's ready
          void element.offsetHeight // Force layout
          const check = isElementReady(step.target)
          
          // Check if element is visible
          let elementVisible = false
          if (element) {
            const rect = element.getBoundingClientRect()
            const style = window.getComputedStyle(element)
            elementVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
          }
          
          // Check if this is a dependent step that requires a checkbox to be enabled
          // If element exists but isn't visible, it might be because the checkbox isn't enabled
          if (isAddEventElement && !elementVisible) {
            tourLog.debug(`Step ${index} (${step.target}): Element exists but not visible, checking if it's a dependent step`)
            let needsCheckbox = false
            let checkboxSelector = ''
            let checkboxName = ''
            
            // Check if we're on booking-related steps (but not the enable step itself)
            if (!step.target.includes('add-event-enable-booking') && 
                (step.target.includes('add-event-booking-settings') ||
                 step.target.includes('add-event-who-can-book') ||
                 step.target.includes('add-event-confirmation-checkboxes'))) {
              needsCheckbox = true
              checkboxSelector = '#bookingEnabled'
              checkboxName = 'booking'
              tourLog.debug(`Step ${index} (${step.target}): Detected as booking-dependent step`)
            }
            
            // Check if we're on feedback-related steps (but not the enable step itself)
            if (!step.target.includes('add-event-enable-feedback') && 
                step.target.includes('add-event-feedback-template')) {
              needsCheckbox = true
              checkboxSelector = '#feedbackEnabled'
              checkboxName = 'feedback'
            }
            
            // Check if we're on attendance-related steps (but not the enable step itself)
            if (!step.target.includes('add-event-enable-attendance') && 
                step.target.includes('add-event-attendance')) {
              needsCheckbox = true
              checkboxSelector = '#qrAttendanceEnabled'
              checkboxName = 'attendance'
            }
            
            // Check if we're on certificate-related steps (but not the enable step itself)
            if (!step.target.includes('add-event-enable-certificates') &&
                (step.target.includes('add-event-certificate-template') ||
                 step.target.includes('add-event-auto-send-certificates') ||
                 step.target.includes('add-event-certificates-after-feedback'))) {
              needsCheckbox = true
              checkboxSelector = '#autoGenerateCertificate'
              checkboxName = 'certificate'
            }
            
            // If this is a dependent step and element isn't visible, enable checkbox and wait
            if (needsCheckbox) {
              const checkbox = document.querySelector(checkboxSelector) as HTMLInputElement
              if (checkbox) {
                const wasChecked = checkbox.checked
                if (!wasChecked) {
                  tourLog.debug(`Step ${index} (${step.target}): Element exists but not visible, enabling ${checkboxName} checkbox`)
                  setRun(false)
                  checkbox.click()
                  
                  // Wait for element to become visible
                  setTimeout(() => {
                    let attempts = 0
                    const maxAttempts = 40 // 4 seconds
                    const checkInterval = setInterval(() => {
                      attempts++
                      const checkElement = document.querySelector(step.target) as HTMLElement
                      if (checkElement) {
                        const rect = checkElement.getBoundingClientRect()
                        const style = window.getComputedStyle(checkElement)
                        const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
                        
                        if (isVisible) {
                          clearInterval(checkInterval)
                          tourLog.debug(`✅ Step ${index} (${step.target}): Element now visible after enabling ${checkboxName} checkbox, resuming`)
                          setTimeout(() => {
                            setStepIndex(index)
                            setRun(true)
                          }, 100)
                        } else if (attempts >= maxAttempts) {
                          clearInterval(checkInterval)
                          tourLog.warn(`⚠️ Step ${index} (${step.target}): Element still not visible after enabling ${checkboxName} checkbox`)
                          setTimeout(() => {
                            setStepIndex(index)
                            setRun(true)
                          }, 100)
                        }
                      } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval)
                        tourLog.warn(`❌ Step ${index} (${step.target}): Element not found after enabling ${checkboxName} checkbox`)
                        setTimeout(() => {
                          setStepIndex(index)
                          setRun(true)
                        }, 100)
                      }
                    }, 100)
                  }, 300)
                  return // Don't continue with normal flow
                } else {
                  tourLog.debug(`Step ${index} (${step.target}): ${checkboxName} checkbox already enabled but element not visible - might be rendering`)
                  // Checkbox is enabled but element not visible - might still be rendering
                  // Wait a bit and check again
                  setRun(false)
                  setTimeout(() => {
                    let attempts = 0
                    const maxAttempts = 40
                    const checkInterval = setInterval(() => {
                      attempts++
                      const checkElement = document.querySelector(step.target) as HTMLElement
                      if (checkElement) {
                        const rect = checkElement.getBoundingClientRect()
                        const style = window.getComputedStyle(checkElement)
                        const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
                        
                        if (isVisible) {
                          clearInterval(checkInterval)
                          tourLog.debug(`✅ Step ${index} (${step.target}): Element now visible (checkbox was already enabled), resuming`)
                          setTimeout(() => {
                            setStepIndex(index)
                            setRun(true)
                          }, 100)
                        } else if (attempts >= maxAttempts) {
                          clearInterval(checkInterval)
                          tourLog.warn(`⚠️ Step ${index} (${step.target}): Element still not visible even though ${checkboxName} checkbox is enabled`)
                          setTimeout(() => {
                            setStepIndex(index)
                            setRun(true)
                          }, 100)
                        }
                      } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval)
                        tourLog.warn(`❌ Step ${index} (${step.target}): Element not found even though ${checkboxName} checkbox is enabled`)
                        setTimeout(() => {
                          setStepIndex(index)
                          setRun(true)
                        }, 100)
                      }
                    }, 100)
                  }, 200)
                  return // Don't continue with normal flow
                }
              }
            }
          }
          
          // Auto-enable checkboxes for dependent sections when element is found and visible
          if (isAddEventElement && elementVisible) {
            // Enable booking if we're on booking-related steps (but not the enable step itself)
            if (step.target.includes('add-event-booking-settings') ||
                step.target.includes('add-event-who-can-book') ||
                step.target.includes('add-event-confirmation-checkboxes')) {
              // For dependent steps, enable booking and wait for sections to appear
              const bookingCheckbox = document.querySelector('#bookingEnabled') as HTMLInputElement
              if (bookingCheckbox && !bookingCheckbox.checked) {
                bookingCheckbox.click()
                tourLog.debug('Auto-enabled booking checkbox for dependent step')
                // Pause tour and wait for React to re-render dependent sections
                setRun(false)
                setTimeout(() => {
                  // Check if the target element is now visible
                  let attempts = 0
                  const maxAttempts = 10
                  const checkInterval = setInterval(() => {
                    attempts++
                    const checkElement = document.querySelector(step.target) as HTMLElement
                    if (checkElement) {
                      const rect = checkElement.getBoundingClientRect()
                      const style = window.getComputedStyle(checkElement)
                      const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
                      if (isVisible) {
                        clearInterval(checkInterval)
                        tourLog.debug('Dependent section is now visible after enabling booking')
                        setTimeout(() => {
                          setStepIndex(index)
                          setRun(true)
                        }, 100)
                      } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval)
                        tourLog.warn('Dependent section still not visible after enabling booking')
                        setStepIndex(index)
                        setRun(true)
                      }
                    } else if (attempts >= maxAttempts) {
                      clearInterval(checkInterval)
                      tourLog.warn('Target element not found after enabling booking')
                      setStepIndex(index)
                      setRun(true)
                    }
                  }, 200)
                }, 200)
                return // Don't continue with normal flow
              }
            }
            
            // Enable feedback if we're on feedback-related steps (but not the enable step itself)
            if (step.target.includes('add-event-feedback-template')) {
              const feedbackCheckbox = document.querySelector('#feedbackEnabled') as HTMLInputElement
              if (feedbackCheckbox && !feedbackCheckbox.checked) {
                feedbackCheckbox.click()
                tourLog.debug('Auto-enabled feedback checkbox for dependent step')
                setRun(false)
                setTimeout(() => {
                  let attempts = 0
                  const maxAttempts = 10
                  const checkInterval = setInterval(() => {
                    attempts++
                    const checkElement = document.querySelector(step.target) as HTMLElement
                    if (checkElement) {
                      clearInterval(checkInterval)
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    } else if (attempts >= maxAttempts) {
                      clearInterval(checkInterval)
                      setStepIndex(index)
                      setRun(true)
                    }
                  }, 200)
                }, 200)
                return
              }
            }
            
            // Enable certificates if we're on certificate-related steps (but not the enable step itself)
            if (step.target.includes('add-event-certificate-template') ||
                step.target.includes('add-event-auto-send-certificates') ||
                step.target.includes('add-event-certificates-after-feedback')) {
              const certificateCheckbox = document.querySelector('#autoGenerateCertificate') as HTMLInputElement
              if (certificateCheckbox && !certificateCheckbox.checked) {
                certificateCheckbox.click()
                tourLog.debug('Auto-enabled certificate checkbox for dependent step')
                setRun(false)
                setTimeout(() => {
                  let attempts = 0
                  const maxAttempts = 10
                  const checkInterval = setInterval(() => {
                    attempts++
                    const checkElement = document.querySelector(step.target) as HTMLElement
                    if (checkElement) {
                      clearInterval(checkInterval)
                      setTimeout(() => {
                        setStepIndex(index)
                        setRun(true)
                      }, 100)
                    } else if (attempts >= maxAttempts) {
                      clearInterval(checkInterval)
                      setStepIndex(index)
                      setRun(true)
                    }
                  }, 200)
                }, 200)
                return
              }
            }
          }
          
          // Special logging for pagination step
          if (step.target === '[data-tour="event-data-pagination"]') {
            const rect = element.getBoundingClientRect()
            tourLog.info(`🔍 Pagination step ${index}: Element found, ready=${check.ready}, reason=${check.reason || 'ready'}, dimensions=${rect.width}x${rect.height}, visible=${rect.width > 0 && rect.height > 0}`)
          }
          
          if (!check.ready) {
            // Element exists but not ready - apply fallback
            const stepForFallback = steps[index]
            if (stepForFallback && stepForFallback.target !== 'body') {
              tourLog.warn(`Step ${index} (${step.target}) not ready in step:before: ${check.reason}, applying fallback`)
              setSteps((prevSteps: Step[]) => {
                const updatedSteps = [...prevSteps]
                if (updatedSteps[index]) {
                  updatedSteps[index] = {
                    ...updatedSteps[index],
                    target: 'body',
                    placement: 'center' as const,
                    disableBeacon: true,
                  }
                }
                return updatedSteps
              })
              // Return early - react-joyride will retry with the updated step
              return
            }
          } else {
            tourLog.step(index, 'Element is ready', step.target)
          }
        }
      } else if (step?.target === 'body') {
        // Step using fallback - this is a normal fallback case, not a dependent step
        // Dependent steps are now handled in step:before of the enable steps
        tourLog.step(index, 'Targets body (always available)')
      }
    } else if (type === 'step:after' && (action === 'next' || action === 'prev')) {
      // Note: Checkbox enabling is now handled in step:before to ensure elements are ready
      // before react-joyride checks them. This prevents steps from being skipped.
      
      
      // Clean up fixed tooltip CSS if we were on the add-event-tab step
      if (typeof step?.target === 'string' && step.target.includes('event-data-add-event-tab')) {
        // Use the cleanup function if it exists
        if ((window as any).__tourScrollCleanup) {
          ;(window as any).__tourScrollCleanup()
        }
        
        // Special handling: When moving from Add Event Tab step to Basic Information step
        // Ensure the Add Event tab is active and Basic Information form sub-tab is active
        const nextIndex = index + 1
        tourLog.debug(`Step ${index} (Add Event Tab) completed, checking next step ${nextIndex}`)
        if (nextIndex < steps.length) {
          const nextStep = steps[nextIndex]
          tourLog.debug(`Next step ${nextIndex} target: ${nextStep?.target}`)
          if (nextStep?.target && typeof nextStep.target === 'string' && 
              (nextStep.target.includes('add-event-basic-information-tab') || 
               nextStep.target.includes('add-event-title') ||
               nextStep.target.includes('add-event-'))) {
            // Pause tour to allow tab switching to complete
            setRun(false)
            tourLog.debug('Pausing tour after Add Event Tab step to switch tabs')
            
            // Ensure Add Event tab is active
            const addEventTab = document.querySelector('[data-tour="event-data-add-event-tab"]') as HTMLElement
            tourLog.debug(`Add Event tab found: ${!!addEventTab}`)
            if (addEventTab) {
              const addEventTabButton = addEventTab.closest('button') || addEventTab
              const isAddEventActive = addEventTabButton.classList.contains('bg-gray-700') || 
                                       addEventTabButton.classList.contains('text-white')
              
              tourLog.debug(`Add Event tab active: ${isAddEventActive}`)
              
              if (!isAddEventActive) {
                addEventTab.click()
                tourLog.debug('Clicked Add Event tab')
              }
              
              // Wait for tab switch, then ensure Basic Information form sub-tab is active
              // Need to wait longer for React to render the form content
              const tabSwitchDelay = isAddEventActive ? 500 : 700
              tourLog.debug(`Waiting ${tabSwitchDelay}ms before checking form sub-tab`)
              
              // Retry logic to find the Basic Information tab
              let attempts = 0
              const maxAttempts = 10
              const checkForBasicInfoTab = () => {
                attempts++
                tourLog.debug(`Checking for Basic Information form sub-tab (attempt ${attempts}/${maxAttempts})`)
                const basicInfoTab = document.querySelector('[data-tour="add-event-basic-information-tab"]') as HTMLElement
                tourLog.debug(`Basic Information tab found: ${!!basicInfoTab}`)
                
                if (basicInfoTab) {
                  const isBasicInfoActive = basicInfoTab.classList.contains('bg-blue-100') || 
                                           basicInfoTab.classList.contains('text-blue-700')
                  tourLog.debug(`Basic Information tab active: ${isBasicInfoActive}`)
                  
                  if (!isBasicInfoActive) {
                    basicInfoTab.click()
                    tourLog.debug('Switched to Basic Information form sub-tab after Add Event tab step')
                  }
                  
                  // Wait a bit more for the form content to render, then resume tour
                  setTimeout(() => {
                    tourLog.debug(`Checking for element: ${nextStep.target}`)
                    const nextStepElement = document.querySelector(nextStep.target as string) as HTMLElement
                    tourLog.debug(`Element found: ${!!nextStepElement}`)
                    
                    if (nextStepElement) {
                      const rect = nextStepElement.getBoundingClientRect()
                      const style = window.getComputedStyle(nextStepElement)
                      const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
                      tourLog.debug(`Element visible: ${isVisible}, dimensions: ${rect.width}x${rect.height}`)
                      
                      if (isVisible) {
                        tourLog.debug(`Element for step ${nextIndex} found and visible, resuming tour`)
                        setStepIndex(nextIndex)
                        setRun(true)
                      } else {
                        tourLog.warn(`Element for step ${nextIndex} found but not visible, will retry in step:before`)
                        setStepIndex(nextIndex)
                        setRun(true)
                      }
                    } else {
                      tourLog.warn(`Element for step ${nextIndex} (${nextStep.target}) not found after tab switch, will retry in step:before`)
                      // Resume anyway - step:before will handle it
                      setStepIndex(nextIndex)
                      setRun(true)
                    }
                  }, 300)
                } else if (attempts < maxAttempts) {
                  // Retry after 200ms
                  setTimeout(checkForBasicInfoTab, 200)
                } else {
                  tourLog.warn('Basic Information form sub-tab button not found after all attempts')
                  // Resume anyway - step:before will handle it
                  setStepIndex(nextIndex)
                  setRun(true)
                }
              }
              
              setTimeout(checkForBasicInfoTab, tabSwitchDelay)
            } else {
              // Add Event tab not found - resume anyway
              tourLog.warn('Add Event tab not found')
              setStepIndex(nextIndex)
              setRun(true)
            }
          }
        }
      }
      
      // After clicking next on step 0 (welcome popup), do the loading check before proceeding
      // Only trigger this for welcome popup steps (target === 'body' indicates welcome popup)
      // Calendar tour's step 0 is sidebar link, not welcome popup, so this won't trigger
      const isWelcomePopup = index === 0 && stepIndex === 0 && step?.target === 'body'
      
      if (isWelcomePopup) {
        // User clicked "Start Tour" on first popup - now do the loading check
        console.log('🚀 User clicked Start Tour, beginning loading check...')
        
        // Pause tour temporarily
        setRun(false)
        
                // Do the loading check
        setIsLoadingTour(true)
        setLoadingProgress('Starting your tour, hold on...')
        
        // Wait a moment
        setTimeout(async () => {
          // Use current steps from state (preserves custom steps if set via startTourWithSteps)
          // Only use getStepsForRole() if steps are empty (fallback)
          const currentSteps = steps.length > 0 ? steps : getStepsForRole()
          
          // Wait for all steps to be ready (returns steps with fallbacks applied)
          const finalSteps = await waitForAllStepsReady(currentSteps)
          
          // Update steps state with any fallbacks that were applied
          setSteps(finalSteps)
          
          // Small delay before continuing
          await new Promise(resolve => setTimeout(resolve, 200))
          
          setIsLoadingTour(false)
          
          // Advance to step 1 (skip step 0 since user already saw the welcome popup)
          setStepIndex(1)
          setRun(true)
        }, 300)
        
        return
      }
      
      // For other steps, check if the next step's target exists and is ready
      const nextIndex = index + 1
      if (nextIndex < steps.length) {
        const nextStep = steps[nextIndex]
        if (nextStep?.target && typeof nextStep.target === 'string' && nextStep.target !== 'body') {
          // Special handling for my-bookings - apply specific selector early
          // Only apply if the next step's target is EXACTLY my-bookings, not based on step index
          const isNextMyBookings = nextStep.target === '[data-tour="my-bookings"]'
          
          // Check if it would be converted to sidebar link (skip if it's already a sidebar link or other selector)
          let wouldBeSidebarLink = false
          if (isNextMyBookings && typeof nextStep.target === 'string') {
            const convertedSelector = getSpecificSelector(nextStep.target)
            wouldBeSidebarLink = convertedSelector === '#sidebar-my-bookings-link'
          }
          
          // Only apply proactive selector if the target is actually my-bookings
          if (isNextMyBookings && wouldBeSidebarLink && 
              typeof nextStep.target === 'string' && 
              !nextStep.target.includes('data-tour-target') &&
              !nextStep.target.includes('#sidebar-my-bookings-link')) {
            // For my-bookings, apply the specific selector proactively in step:after
            // This ensures react-joyride uses the correct selector when navigating to my-bookings step
            const originalTarget = '[data-tour="my-bookings"]'
            const specificSelector = getSpecificSelector(originalTarget)
            
            if (specificSelector !== originalTarget) {
              tourLog.debug(`Proactively applying specific selector for my-bookings step ${nextIndex}: "${specificSelector}"`)
              setSteps((prevSteps: Step[]) => {
                const updatedSteps = [...prevSteps]
                if (updatedSteps[nextIndex]) {
                  updatedSteps[nextIndex] = {
                    ...updatedSteps[nextIndex],
                    target: specificSelector,
                  }
                }
                return updatedSteps
              })
              // Wait a moment for state update, then check if element is ready with new selector
              setTimeout(() => {
                const check = isElementReady(specificSelector)
                if (check.ready) {
                  tourLog.debug(`Next step ${nextIndex} (my-bookings) is ready with specific selector "${specificSelector}"`)
                } else {
                  tourLog.warn(`Next step ${nextIndex} (my-bookings) not ready with specific selector: ${check.reason}`)
                }
              }, 100)
              return // Skip the normal check for my-bookings step
            }
          }
          
          const check = isElementReady(nextStep.target)
          
          if (!check.ready) {
            // Preemptively apply fallback for next step
            setSteps((prevSteps: Step[]) => {
              const updatedSteps = [...prevSteps]
              if (updatedSteps[nextIndex] && updatedSteps[nextIndex].target !== 'body') {
                updatedSteps[nextIndex] = {
                  ...updatedSteps[nextIndex],
                  target: 'body',
                  placement: 'center' as const,
                  disableBeacon: true,
                }
                console.log(`⚠️ Next step ${nextIndex} (${nextStep.target}) not ready: ${check.reason}, preemptively applied fallback`)
              }
              return updatedSteps
            })
          } else {
            console.log(`✅ Next step ${nextIndex} (${nextStep.target}) is ready`)
          }
        }
      }
    }

    // Handle error when target is not found - use fallback immediately (don't pause tour)
    if (type === 'error:target_not_found' && step?.target) {
      tourLog.error(`Step ${index} target not found: ${step.target}`)
      // Check if we already applied fallback for this step
      const currentStep = steps[index]
      if (currentStep && currentStep.target === 'body') {
        // Already using fallback, just continue
        tourLog.debug(`Step ${index} already using fallback, continuing`)
        return
      }

      // Check if element exists and get detailed status
      if (typeof step.target === 'string' && step.target !== 'body') {
        const check = isElementReady(step.target)
        
        if (!check.ready) {
          tourLog.warn(`Step ${index} (${step.target}) not ready: ${check.reason}, applying fallback`)
        } else {
          // Element exists and is ready - this shouldn't happen with error:target_not_found
          // But use fallback anyway to be safe
          tourLog.warn(`Step ${index} (${step.target}) exists but react-joyride couldn't find it, using fallback`)
        }
      } else {
        tourLog.warn(`Step ${index} target invalid, using fallback: ${step.target}`)
      }

      // Apply fallback and force react-joyride to retry this step
      // Check if fallback is already applied
      const stepToCheck = steps[index]
      if (stepToCheck && stepToCheck.target === 'body') {
        console.log(`✅ Step ${index} already using fallback, continuing`)
        // Still need to force retry - pause and resume
        setRun(false)
        setTimeout(() => {
          setStepIndex(index)
          requestAnimationFrame(() => {
            setTimeout(() => {
              setRun(true)
            }, 100)
          })
        }, 100)
        return
      }

      // Apply fallback
      setSteps((prevSteps: Step[]) => {
        const updatedSteps = [...prevSteps]
        if (updatedSteps[index]) {
          updatedSteps[index] = {
            ...updatedSteps[index],
            target: 'body',
            placement: 'center' as const,
            disableBeacon: true,
          }
          console.log(`✅ Fallback applied for step ${index}, retrying...`)
        }
        return updatedSteps
      })
      
      // Pause tour, then resume at this step to force react-joyride to retry with fallback
      setRun(false)
      setTimeout(() => {
        setStepIndex(index)
        // Use requestAnimationFrame to ensure state updates are processed
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              setRun(true)
              console.log(`🔄 Retrying step ${index} with fallback (center placement)`)
            }, 100)
          })
        })
      }, 150)
      
      return
    }

    // Handle close button click - always set never_show to prevent auto-start
    if (action === 'close' || type === 'tooltip:close') {
      // Restore scrolling if it was locked
      if ((window as any).__tourScrollCleanup) {
        ;(window as any).__tourScrollCleanup()
        delete (window as any).__tourScrollCleanup
      }
      
      // Immediately stop the tour
      setWaitingForElement(false)
      setRun(false)
      setStepIndex(0)
      
      // Reset custom steps flag
      usingCustomStepsRef.current = false
      
      // Clear any waiting timeout
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current)
        waitingTimeoutRef.current = null
      }
      
      // Update database: set never_show=true and skipped=true
      // This prevents auto-start on future page loads
      fetch('/api/onboarding/never-show', {
        method: 'POST',
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Failed to set never_show flag:', response.status, errorData)
          } else {
            const data = await response.json().catch(() => ({}))
            console.log('Successfully set never_show flag:', data)
          }
        })
        .catch(error => {
          console.error('Error setting never_show flag:', error)
        })
      
      return
    }

    // Handle finished status
    if (status === 'finished') {
      // Restore scrolling if it was locked
      if ((window as any).__tourScrollCleanup) {
        ;(window as any).__tourScrollCleanup()
        delete (window as any).__tourScrollCleanup
      }
      
      tourLog.info(`Tour finished at step ${index} of ${steps.length} total steps`)
      // Clear any waiting timeout
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current)
        waitingTimeoutRef.current = null
      }
      
      // Reset custom steps flag
      usingCustomStepsRef.current = false
      
      setWaitingForElement(false)
      setRun(false)
      setStepIndex(0)
      
      // Check if we're in a multi-page tour chain (for meded_team)
      if (userRole === 'meded_team' && typeof window !== 'undefined') {
        const isMultiPageTour = sessionStorage.getItem('mededMultiPageTour')
        if (isMultiPageTour === 'true') {
          // Determine current page and navigate to next
          const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '')
          let nextPath: string | null = null
          
          // Check if we're on dashboard (exact match or main dashboard, not profile pages)
          if (currentPath === '/dashboard' || (currentPath?.startsWith('/dashboard') && !currentPath?.includes('/profile'))) {
            // Dashboard tour finished, go to calendar
            nextPath = '/calendar'
            // Enable personalized view for calendar tour
            sessionStorage.setItem('enablePersonalizedView', 'true')
          } else if (currentPath === '/calendar' || currentPath === '/events') {
            // Calendar tour finished, go to events list
            nextPath = '/events-list'
            // Enable personalized view for events list tour
            sessionStorage.setItem('enablePersonalizedView', 'true')
          } else if (currentPath === '/events-list') {
            // Events list tour finished, go to formats
            nextPath = '/formats'
          } else if (currentPath === '/formats') {
            // Formats tour finished, go to my bookings
            nextPath = '/my-bookings'
          } else if (currentPath === '/my-bookings') {
            // My bookings tour finished, go to my attendance
            nextPath = '/my-attendance'
          } else if (currentPath === '/my-attendance') {
            // My attendance tour finished, go to my certificates
            nextPath = '/mycertificates'
          } else if (currentPath === '/mycertificates') {
            // My certificates tour finished, go to event data
            nextPath = '/event-data'
          } else if (currentPath === '/event-data') {
            // Event data tour finished, end the multi-page tour
            sessionStorage.removeItem('mededMultiPageTour')
            sessionStorage.removeItem('enablePersonalizedView')
            tourLog.info('Multi-page tour completed!')
          }
          
          // Navigate to next page and start tour
          if (nextPath) {
            tourLog.info(`Multi-page tour: Navigating to ${nextPath}`)
            // Set flag to start tour after navigation
            sessionStorage.setItem('startTourAfterNavigation', Date.now().toString())
            // Store the tour type to start (page name)
            const tourType = (nextPath === '/calendar' || nextPath === '/events') ? 'calendar' :
                           nextPath === '/events-list' ? 'events-list' :
                           nextPath === '/formats' ? 'formats' :
                           nextPath === '/my-bookings' ? 'my-bookings' :
                           nextPath === '/my-attendance' ? 'my-attendance' :
                           nextPath === '/mycertificates' ? 'my-certificates' :
                           nextPath === '/event-data' ? 'event-data' : null
            if (tourType) {
              sessionStorage.setItem('nextTourType', tourType)
            }
            // Navigate
            router.push(nextPath)
            return // Don't update database yet, wait for final tour
          } else if (currentPath === '/event-data') {
            // Final tour completed, update database
            sessionStorage.removeItem('mededMultiPageTour')
            sessionStorage.removeItem('enablePersonalizedView')
          }
        }
      }
      
      // Update database: set completed=true (only if not in multi-page tour or final tour)
      if (!(userRole === 'meded_team' && typeof window !== 'undefined' && sessionStorage.getItem('mededMultiPageTour') === 'true')) {
      fetch('/api/onboarding/complete', {
        method: 'POST',
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Failed to set completed flag:', response.status, errorData)
          } else {
            const data = await response.json().catch(() => ({}))
            console.log('Successfully set completed flag:', data)
          }
        })
        .catch(error => {
          console.error('Error setting completed flag:', error)
        })
      }
      
      return
    }

    // Handle skipped status - always set never_show to prevent auto-start
    if (status === 'skipped') {
      // Restore scrolling if it was locked
      if ((window as any).__tourScrollCleanup) {
        ;(window as any).__tourScrollCleanup()
        delete (window as any).__tourScrollCleanup
      }
      
      // Immediately stop the tour
      setWaitingForElement(false)
      setRun(false)
      setStepIndex(0)
      
      // Reset custom steps flag
      usingCustomStepsRef.current = false
      
      // Clear any waiting timeout
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current)
        waitingTimeoutRef.current = null
      }
      
      // Update database: set never_show=true and skipped=true
      fetch('/api/onboarding/never-show', {
        method: 'POST',
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Failed to set never_show flag:', response.status, errorData)
          } else {
            const data = await response.json().catch(() => ({}))
            console.log('Successfully set never_show flag:', data)
          }
        })
        .catch(error => {
          console.error('Error setting never_show flag:', error)
        })
      
      return
    }
  }, [steps, stepIndex, isElementReady, getStepsForRole, getSpecificSelector])

  const startTour = useCallback(async (skipLoadingCheck = false) => {
    // Only allow tour on desktop
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      console.log('Tour is only available on desktop devices')
      return
    }

    // If skipLoadingCheck is true, just start the tour (for auto-start, showing step 0 first)
    if (skipLoadingCheck) {
      setStepIndex(0)
      setRun(true)
      return
    }

    // Otherwise, do the full loading check (when user clicks "Start Tour" button)
    setIsLoadingTour(true)
    setLoadingProgress('Starting your tour, hold on...')
    
    // Wait a moment for initial render
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Get current steps
    const currentSteps = getStepsForRole()
    
    // Wait for all steps to be ready (returns steps with fallbacks applied)
    const finalSteps = await waitForAllStepsReady(currentSteps)
    
    // Update steps state with any fallbacks that were applied
    setSteps(finalSteps)
    
    // Small delay before starting to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 200))
    
    setIsLoadingTour(false)
    setStepIndex(0)
    setRun(true)
  }, [getStepsForRole, waitForAllStepsReady, isElementReady])

  const startTourWithSteps = useCallback(async (customSteps: Step[], skipLoadingCheck = false) => {
    // Only allow tour on desktop
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      console.log('Tour is only available on desktop devices')
      return
    }

    // Mark that we're using custom steps
    usingCustomStepsRef.current = true

    // If skipLoadingCheck is true, just start the tour (for auto-start, showing step 0 first)
    if (skipLoadingCheck) {
      setSteps(customSteps)
      setStepIndex(0)
      setRun(true)
      return
    }

    // Otherwise, do the full loading check
    setIsLoadingTour(true)
    setLoadingProgress('Starting your tour, hold on...')
    
    // Wait a moment for initial render
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Wait for all steps to be ready (returns steps with fallbacks applied)
    const finalSteps = await waitForAllStepsReady(customSteps)
    
    // Update steps state with any fallbacks that were applied
    setSteps(finalSteps)
    
    // Small delay before starting to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 200))
    
    setIsLoadingTour(false)
    setStepIndex(0)
    setRun(true)
  }, [waitForAllStepsReady, isElementReady])

  const skipTour = useCallback(() => {
    fetch('/api/onboarding/skip', {
      method: 'POST',
    }).catch(console.error)
    
    // Clear any waiting timeout
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current)
      waitingTimeoutRef.current = null
    }
    
    // Reset custom steps flag
    usingCustomStepsRef.current = false
    
    setWaitingForElement(false)
    setRun(false)
    setStepIndex(0)
  }, [])

  // Custom locale with step counter in Next button
  const customLocale = useMemo(() => {
    // Check if we're in a multi-page tour and on the last step
    const isMultiPageTour = typeof window !== 'undefined' && sessionStorage.getItem('mededMultiPageTour') === 'true'
    const isLastStep = stepIndex === steps.length - 1
    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '')
    const isDashboardLastStep = isLastStep && (currentPath === '/dashboard' || (currentPath?.startsWith('/dashboard') && !currentPath?.includes('/profile')))
    const isCalendarLastStep = isLastStep && (currentPath === '/calendar' || currentPath === '/events')
    
    // Determine button text based on current page in multi-page tour
    let lastButtonText = 'Finish Tour'
    if (isMultiPageTour && isLastStep) {
      if (isDashboardLastStep) {
        lastButtonText = 'Move to Calendar'
      } else if (isCalendarLastStep) {
        lastButtonText = 'Move to Events'
      } else if (currentPath === '/events-list') {
        lastButtonText = 'Move to Formats'
      } else if (currentPath === '/formats') {
        lastButtonText = 'Move to My Bookings'
      } else if (currentPath === '/my-bookings') {
        lastButtonText = 'Move to My Attendance'
      } else if (currentPath === '/my-attendance') {
        lastButtonText = 'Move to My Certificates'
      } else if (currentPath === '/mycertificates') {
        // Only show "Move to Event Data" for admin or meded_team users
        const currentUserRole = session?.user?.role || userRole || 'student'
        if (currentUserRole === 'admin' || currentUserRole === 'meded_team') {
          lastButtonText = 'Move to Event Data'
        } else {
          lastButtonText = 'Finish Tour'
        }
      }
    }
    
    return {
    back: '← Previous',
    close: 'Close',
      last: lastButtonText,
    next: stepIndex === 0 ? 'Start Tour' : 'Next',
    skip: 'Skip Tour',
    }
  }, [stepIndex, steps.length, pathname, session, userRole])

  return (
    <OnboardingContext.Provider value={{ startTour, startTourWithSteps, skipTour }}>
      {children}
      
      {/* Loading overlay */}
      {isLoadingTour && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md mx-4">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starting Your Tour</h3>
              <p className="text-gray-600 mb-4">{loadingProgress}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: loadingProgress.includes('ready') ? '100%' : '60%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {steps.length > 0 && isDesktop && (
        <Joyride
          steps={steps}
          run={run}
          continuous
          showProgress={false}
                     showSkipButton
           callback={handleJoyrideCallback}
           disableCloseOnEsc={false}
           hideCloseButton={false}
           disableScrolling={false}
           disableOverlayClose={false}
           floaterProps={{
             disableAnimation: false,
           }}
          styles={{
                                                   options: {
               primaryColor: '#9333EA',
               textColor: '#374151',
               overlayColor: 'rgba(0, 0, 0, 0.7)',
               arrowColor: '#9333EA',
               zIndex: 10000,
             },
            tooltip: {
              borderRadius: 24,
              padding: 0,
              maxWidth: 650,
              minWidth: 500,
              background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(147, 51, 234, 0.15)',
              border: '2px solid rgba(147, 51, 234, 0.1)',
              overflow: 'hidden',
            },
            tooltipContainer: {
              textAlign: 'left',
              padding: '40px',
            },
            tooltipTitle: {
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '20px',
              lineHeight: '1.3',
              letterSpacing: '-0.5px',
            },
                                      tooltipContent: {
               fontSize: '16px',
               lineHeight: '1.8',
               color: '#4B5563',
               padding: '0',
               marginBottom: '8px',
             },
            buttonNext: {
              backgroundColor: '#9333EA',
              backgroundImage: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
              borderRadius: 12,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: '700',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgba(147, 51, 234, 0.4), 0 4px 6px -2px rgba(147, 51, 234, 0.3)',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
            },
            buttonBack: {
              color: '#FFFFFF',
              backgroundColor: '#6B7280',
              borderRadius: 12,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: '700',
              border: 'none',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
            buttonSkip: {
              color: '#6B7280',
              fontSize: 14,
              fontWeight: '600',
              textDecoration: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
            },
                                                                                          spotlight: {
               borderRadius: 12,
               backgroundColor: 'rgba(255, 255, 255, 0)',
               boxShadow: '0 0 0 4px rgba(147, 51, 234, 0.7), 0 0 0 9999px rgba(0, 0, 0, 0.7)',
               opacity: 1,
               mixBlendMode: 'normal',
             },
                                                   tooltipFooter: {
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between',
               gap: '12px',
               paddingTop: '20px',
               paddingBottom: '20px',
               paddingLeft: '20px',
               paddingRight: '20px',
               marginTop: '20px',
               marginBottom: '10px',
               borderTop: '1px solid #E5E7EB',
             },
                                                                overlay: {
               mixBlendMode: 'normal',
               backgroundColor: 'rgba(0, 0, 0, 0.7)',
             },
          }}
          locale={customLocale}
        />
      )}
    </OnboardingContext.Provider>
  )
}
