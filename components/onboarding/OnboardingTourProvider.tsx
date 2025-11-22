'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { tourSteps } from '@/lib/onboarding/tourSteps'
import { OnboardingContext } from './OnboardingContext'
import type { Step } from 'react-joyride'

// Dynamically import Joyride to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride'), { ssr: false })

interface OnboardingTourProviderProps {
  children: React.ReactNode
  userRole?: string | null
}

export function OnboardingTourProvider({ children, userRole }: OnboardingTourProviderProps) {
  const { data: session } = useSession()
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
    
    if (!element) {
      return { ready: false, reason: 'Element not found in DOM' }
    }

    if (!document.contains(element)) {
      return { ready: false, reason: 'Element not attached to DOM' }
    }

    // Get computed styles first
    const styles = window.getComputedStyle(element)
    const display = styles.display
    const visibility = styles.visibility
    const opacity = parseFloat(styles.opacity)
    
    // If element is hidden by CSS, it's not ready
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
      
      console.log(`🔍 Checking ${selector}:`, {
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
        console.warn(`⚠️ ${selector} matched a sidebar link instead of content element. Looking for better match...`)
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
              console.log(`✅ ${selector}: Parent flex has dimensions and element has visible children, considering ready`)
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
          console.log(`✅ ${selector}: Main element has rendered children, considering ready`)
          return { ready: true }
        }
      }
      
      // For main elements, if scrollHeight > 0, it's ready (has content)
      if (scrollHeight > 0 || scrollWidth > 0) {
        console.log(`✅ ${selector}: Main element has scroll dimensions (${scrollWidth}x${scrollHeight}), considering ready`)
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
          console.log(`✅ ${selector}: Card has content and scroll dimensions, considering ready`)
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
          console.log(`✅ ${selector}: Flex/Grid element has visible children, considering ready`)
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
    
    return selector
  }, [])

  // Function to wait for all step targets to be ready and apply fallbacks
  const waitForAllStepsReady = useCallback(async (stepsToCheck: Step[]): Promise<Step[]> => {
    console.log('🔍 Checking all tour step targets...')
    setLoadingProgress('Checking page elements...')
    
    // First, update step targets to use more specific selectors where needed
    const updatedSteps = stepsToCheck.map((step, index) => {
      if (typeof step.target === 'string' && 
          (step.target === '[data-tour="dashboard-main"]' || step.target === '[data-tour="my-bookings"]')) {
        const specificSelector = getSpecificSelector(step.target)
        if (specificSelector !== step.target) {
          console.log(`🔧 Step ${index}: Using more specific selector "${specificSelector}" instead of "${step.target}"`)
          return { ...step, target: specificSelector }
        }
      }
      return step
    })
    
    const checks = updatedSteps.map((step, index) => {
      if (typeof step.target === 'string') {
        const check = isElementReady(step.target)
        if (!check.ready) {
          console.log(`❌ Step ${index} (${step.target}): ${check.reason}`)
          return { index, target: step.target, ready: false, reason: check.reason }
        } else {
          console.log(`✅ Step ${index} (${step.target}): Ready`)
          return { index, target: step.target, ready: true }
        }
      }
      return { index, target: 'body', ready: true }
    })

    let notReady = checks.filter(c => !c.ready)
    
    if (notReady.length === 0) {
      console.log('✅ All step targets are ready!')
      setLoadingProgress('All elements ready!')
      return updatedSteps // Return steps with updated selectors
    }

    console.log(`⏳ ${notReady.length} step(s) not ready, waiting...`)
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
              console.log(`✅ ${target} is now ready`)
            }
          }
          return !check.ready
        })

        if (stillNotReady.length === 0) {
          clearInterval(checkElements)
          console.log('✅ All elements are now ready!')
          setLoadingProgress('All elements ready!')
          resolve(stepsToCheck)
          return
        }

        // Update notReady for next iteration
        notReady = stillNotReady

        if (elapsed >= maxWait) {
          clearInterval(checkElements)
          console.log(`⚠️ Timeout: ${stillNotReady.length} element(s) still not ready:`)
          stillNotReady.forEach(({ target, reason }) => {
            console.log(`  - ${target}: ${reason}`)
          })
          setLoadingProgress(`Some elements not ready, continuing anyway...`)
          
          // Apply fallback for elements that are still not ready
          // BUT: Don't apply fallback for step 8 (my-bookings) - let it try again when we reach it
          const stepsWithFallbacks = [...updatedSteps]
          stillNotReady.forEach(({ index: stepIdx, target: targetSelector }) => {
            // Skip step 8 - let it try again when we actually reach it
            if (stepIdx === 8 || targetSelector === '[data-tour="my-bookings"]') {
              console.log(`⏸️ Step ${stepIdx} (${targetSelector}): Skipping fallback in initial check, will retry when step is reached`)
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

    console.log('Joyride callback:', { status, type, index, stepIndex, action, step })

    // Handle step progression - sync state with react-joyride's internal state
    if (type === 'step:before') {
      // Before showing a step - sync our state for display (step counter in button text)
      if (index !== undefined && index >= 0 && index < steps.length) {
        setStepIndex(index)
      }
      
      // Special handling for step 8 (my-bookings card) - only if we're looking for the card, not the sidebar link
      const isStep8 = index === 8
      const currentStepFromState = steps[index]
      const stepTarget = step?.target || currentStepFromState?.target
      // Only match EXACTLY [data-tour="my-bookings"], not other my-bookings-* selectors
      const isMyBookings = stepTarget === '[data-tour="my-bookings"]'
      
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
      if ((isStep8 || (isMyBookings && !isSidebarLink && !wouldBeSidebarLink)) && !alreadyHasSpecificSelector) {
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
          console.log(`🔄 Step 8: Attempting to restore original target and wait for element...`)
          
          // Get a more specific selector for this element (this may add data-tour-target attribute)
          let specificSelector = getSpecificSelector(originalTarget)
          
          // Check if element now has data-tour-target attribute (added by getSpecificSelector)
          if (element.hasAttribute('data-tour-target')) {
            const tourId = element.getAttribute('data-tour-target')
            specificSelector = `[data-tour-target="${tourId}"]`
            console.log(`🔧 Step 8: Found element with data-tour-target, using selector "${specificSelector}"`)
          }
          
          const useSpecificSelector = specificSelector !== originalTarget
          
          if (useSpecificSelector) {
            console.log(`🔧 Step 8: Using more specific selector "${specificSelector}" instead of "${originalTarget}"`)
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
                console.log(`✅ Step 8: Element is now ready after ${attempts * 200}ms, using selector "${selectorToCheck}"`)
                
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
                console.log(`⚠️ Step 8: Element still not ready after ${attempts * 200}ms, keeping fallback`)
                // Keep fallback - resume tour with fallback
                setTimeout(() => {
                  setStepIndex(index)
                  setRun(true)
                }, 100)
              }
            }, 200)
          }, 500) // Wait 500ms for scroll to complete
          
          return // Don't continue with normal flow for step 8
        } else {
          console.log(`⚠️ Step 8: Element not found, using fallback`)
        }
      }
      
      // Normal handling for other steps
      if (step?.target && typeof step.target === 'string' && step.target !== 'body') {
        const element = document.querySelector(step.target) as HTMLElement
        if (!element) {
          // Target doesn't exist - apply fallback immediately
          const stepToUpdate = steps[index]
          if (stepToUpdate && stepToUpdate.target !== 'body') {
            console.log(`⚠️ Step ${index} (${step.target}) not found in step:before, applying fallback`)
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
          
          if (!check.ready) {
            // Element exists but not ready - apply fallback
            const stepForFallback = steps[index]
            if (stepForFallback && stepForFallback.target !== 'body') {
              console.log(`⚠️ Step ${index} (${step.target}) not ready in step:before: ${check.reason}, applying fallback`)
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
            console.log(`✅ Step ${index} (${step.target}) is ready`)
          }
        }
      } else if (step?.target === 'body') {
        // Step already using fallback - this is fine, just log it
        console.log(`✅ Step ${index} targets body (always available)`)
      }
    } else if (type === 'step:after' && action === 'next') {
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
          // Special handling for step 8 (my-bookings) - apply specific selector early
          // Only apply if it's EXACTLY the my-bookings target, not other my-bookings-* targets
          const isNextStep8 = nextIndex === 8
          const isNextMyBookings = nextStep.target === '[data-tour="my-bookings"]'
          
          // Check if it would be converted to sidebar link (skip if it's already a sidebar link or other selector)
          let wouldBeSidebarLink = false
          if (isNextMyBookings && typeof nextStep.target === 'string') {
            const convertedSelector = getSpecificSelector(nextStep.target)
            wouldBeSidebarLink = convertedSelector === '#sidebar-my-bookings-link'
          }
          
          if ((isNextStep8 || (isNextMyBookings && wouldBeSidebarLink)) && 
              typeof nextStep.target === 'string' && 
              !nextStep.target.includes('data-tour-target') &&
              !nextStep.target.includes('#sidebar-my-bookings-link')) {
            // For step 8, apply the specific selector proactively in step:after
            // This ensures react-joyride uses the correct selector when navigating to step 8
            const originalTarget = '[data-tour="my-bookings"]'
            const specificSelector = getSpecificSelector(originalTarget)
            
            if (specificSelector !== originalTarget) {
              console.log(`🔧 Proactively applying specific selector for step 8: "${specificSelector}"`)
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
                  console.log(`✅ Next step ${nextIndex} is ready with specific selector "${specificSelector}"`)
                } else {
                  console.log(`⚠️ Next step ${nextIndex} not ready with specific selector: ${check.reason}`)
                }
              }, 100)
              return // Skip the normal check for step 8
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
      // Check if we already applied fallback for this step
      const currentStep = steps[index]
      if (currentStep && currentStep.target === 'body') {
        // Already using fallback, just continue
        console.log(`✅ Step ${index} already using fallback, continuing`)
        return
      }

      // Check if element exists and get detailed status
      if (typeof step.target === 'string' && step.target !== 'body') {
        const check = isElementReady(step.target)
        
        if (!check.ready) {
          console.log(`⏳ Step ${index} (${step.target}) not ready: ${check.reason}, applying fallback`)
        } else {
          // Element exists and is ready - this shouldn't happen with error:target_not_found
          // But use fallback anyway to be safe
          console.log(`⚠️ Step ${index} (${step.target}) exists but react-joyride couldn't find it, using fallback`)
        }
      } else {
        console.log(`⚠️ Step ${index} target invalid, using fallback: ${step.target}`)
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
      
      // Update database: set completed=true
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
      
      return
    }

    // Handle skipped status - always set never_show to prevent auto-start
    if (status === 'skipped') {
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
  const customLocale = useMemo(() => ({
    back: '← Previous',
    close: 'Close',
    last: 'Finish Tour',
    next: stepIndex === 0 ? 'Start Tour' : 'Next',
    skip: 'Skip Tour',
  }), [stepIndex])

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
