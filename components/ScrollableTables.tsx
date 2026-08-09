'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const SKIP_SELECTOR = [
  '.scroll-table-shell',
  '.ProseMirror',
  '[contenteditable="true"]',
  '[data-no-scroll-table]',
  '.rdt_Table',
  '[role="grid"]',
].join(',')

function shouldSkipTable(table: HTMLTableElement): boolean {
  if (table.closest(SKIP_SELECTOR)) return true

  const parent = table.parentElement
  if (!parent) return true

  // Already in our scroll wrapper
  if (
    parent.classList.contains('scroll-table-scroll') ||
    parent.classList.contains('fy-table-scroll')
  ) {
    return false
  }

  // Leave intentionally managed overflow containers alone
  if (
    parent.classList.contains('overflow-x-auto') ||
    parent.classList.contains('overflow-auto') ||
    parent.classList.contains('overflow-x-scroll')
  ) {
    return true
  }

  return false
}

function ensureScrollWrapper(table: HTMLTableElement): HTMLElement | null {
  const parent = table.parentElement
  if (!parent) return null

  if (
    parent.classList.contains('scroll-table-scroll') ||
    parent.classList.contains('fy-table-scroll')
  ) {
    parent.classList.add('scroll-table-scroll')
    return parent
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'scroll-table-scroll fy-table-scroll'
  parent.insertBefore(wrapper, table)
  wrapper.appendChild(table)
  return wrapper
}

function enhanceScrollEl(scrollEl: HTMLElement): (() => void) | null {
  if (scrollEl.closest('.scroll-table-shell')) return null
  const table = scrollEl.querySelector('table')
  if (!table || !scrollEl.parentNode) return null

  const shell = document.createElement('div')
  shell.className = 'scroll-table-shell fy-table-shell'
  shell.setAttribute('data-can-scroll-left', 'false')
  shell.setAttribute('data-can-scroll-right', 'false')

  const hint = document.createElement('div')
  hint.className = 'scroll-table-hint fy-table-scroll-hint'
  hint.innerHTML =
    '<span class="scroll-table-hint-icon fy-table-scroll-hint-icon" aria-hidden="true">↔</span><span>Scroll sideways for more</span>'

  const topScroll = document.createElement('div')
  topScroll.className = 'scroll-table-scroll-top fy-table-scroll-top'
  topScroll.setAttribute('aria-hidden', 'true')
  const spacer = document.createElement('div')
  spacer.className = 'scroll-table-spacer fy-table-scroll-spacer'
  topScroll.appendChild(spacer)

  const body = document.createElement('div')
  body.className = 'scroll-table-body fy-table-body'

  const fadeLeft = document.createElement('div')
  fadeLeft.className = 'scroll-table-fade scroll-table-fade-left fy-table-fade fy-table-fade-left'
  fadeLeft.setAttribute('aria-hidden', 'true')
  const fadeRight = document.createElement('div')
  fadeRight.className = 'scroll-table-fade scroll-table-fade-right fy-table-fade fy-table-fade-right'
  fadeRight.setAttribute('aria-hidden', 'true')

  const btnLeft = document.createElement('button')
  btnLeft.type = 'button'
  btnLeft.className = 'scroll-table-arrow scroll-table-arrow-left fy-table-arrow fy-table-arrow-left'
  btnLeft.setAttribute('aria-label', 'Scroll table left')
  btnLeft.textContent = '‹'

  const btnRight = document.createElement('button')
  btnRight.type = 'button'
  btnRight.className = 'scroll-table-arrow scroll-table-arrow-right fy-table-arrow fy-table-arrow-right'
  btnRight.setAttribute('aria-label', 'Scroll table right')
  btnRight.textContent = '›'

  scrollEl.parentNode.insertBefore(shell, scrollEl)
  scrollEl.classList.add('scroll-table-scroll', 'fy-table-scroll')
  body.appendChild(scrollEl)
  body.appendChild(fadeLeft)
  body.appendChild(fadeRight)
  body.appendChild(btnLeft)
  body.appendChild(btnRight)
  shell.appendChild(hint)
  shell.appendChild(topScroll)
  shell.appendChild(body)

  let syncing = false

  const updateEdges = () => {
    const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth
    const canScroll = maxScroll > 2
    shell.classList.toggle('is-scrollable', canScroll)
    shell.setAttribute('data-can-scroll-left', String(canScroll && scrollEl.scrollLeft > 2))
    shell.setAttribute(
      'data-can-scroll-right',
      String(canScroll && scrollEl.scrollLeft < maxScroll - 2)
    )
  }

  const syncSizes = () => {
    spacer.style.width = `${Math.max(table.scrollWidth, scrollEl.scrollWidth)}px`
    updateEdges()
  }

  const onTopScroll = () => {
    if (syncing) return
    syncing = true
    scrollEl.scrollLeft = topScroll.scrollLeft
    updateEdges()
    syncing = false
  }

  const onBottomScroll = () => {
    if (syncing) return
    syncing = true
    topScroll.scrollLeft = scrollEl.scrollLeft
    updateEdges()
    syncing = false
  }

  const scrollByAmount = (dir: -1 | 1) => {
    const amount = Math.max(160, Math.floor(scrollEl.clientWidth * 0.7)) * dir
    scrollEl.scrollBy({ left: amount, behavior: 'smooth' })
  }

  topScroll.addEventListener('scroll', onTopScroll, { passive: true })
  scrollEl.addEventListener('scroll', onBottomScroll, { passive: true })
  const onLeft = () => scrollByAmount(-1)
  const onRight = () => scrollByAmount(1)
  btnLeft.addEventListener('click', onLeft)
  btnRight.addEventListener('click', onRight)

  const ro = new ResizeObserver(syncSizes)
  ro.observe(scrollEl)
  ro.observe(table)
  window.addEventListener('resize', syncSizes)
  // Allow layout to settle after client navigations / CMS HTML inject
  requestAnimationFrame(syncSizes)
  setTimeout(syncSizes, 120)

  return () => {
    topScroll.removeEventListener('scroll', onTopScroll)
    scrollEl.removeEventListener('scroll', onBottomScroll)
    btnLeft.removeEventListener('click', onLeft)
    btnRight.removeEventListener('click', onRight)
    ro.disconnect()
    window.removeEventListener('resize', syncSizes)
    if (shell.parentNode) {
      shell.parentNode.insertBefore(scrollEl, shell)
      shell.remove()
    }
  }
}

/**
 * Site-wide horizontal table scroll UX:
 * top scrollbar, teal hint, edge fades, and arrow controls.
 */
export function ScrollableTables() {
  const pathname = usePathname()

  useEffect(() => {
    const cleanups = new Map<HTMLElement, () => void>()

    const enhanceAll = () => {
      const root = document.body
      if (!root) return

      // Wrap bare overflowing content tables
      root.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
        if (shouldSkipTable(table)) return

        const alreadyWrapped =
          table.parentElement?.classList.contains('scroll-table-scroll') ||
          table.parentElement?.classList.contains('fy-table-scroll')

        if (!alreadyWrapped) {
          // Only wrap if it will need horizontal scroll
          const provisional = table.scrollWidth > table.clientWidth + 2
          const parentWidth = table.parentElement?.clientWidth ?? 0
          const widerThanParent = parentWidth > 0 && table.scrollWidth > parentWidth + 2
          if (!provisional && !widerThanParent) return
        }

        const wrapper = ensureScrollWrapper(table)
        if (!wrapper || cleanups.has(wrapper)) return
        const cleanup = enhanceScrollEl(wrapper)
        if (cleanup) cleanups.set(wrapper, cleanup)
      })

      // Enhance existing scroll wrappers (e.g. FY processContent)
      root
        .querySelectorAll<HTMLElement>('.scroll-table-scroll, .fy-table-scroll')
        .forEach((scrollEl) => {
          if (cleanups.has(scrollEl) || scrollEl.closest('.scroll-table-shell')) return
          const cleanup = enhanceScrollEl(scrollEl)
          if (cleanup) cleanups.set(scrollEl, cleanup)
        })
    }

    let timer: ReturnType<typeof setTimeout> | null = null
    let enhancing = false
    const runEnhance = () => {
      enhancing = true
      try {
        enhanceAll()
      } finally {
        requestAnimationFrame(() => {
          enhancing = false
        })
      }
    }
    const schedule = (mutations?: MutationRecord[]) => {
      // Ignore our own wrapper mutations to avoid enhance ↔ observe feedback loops
      if (enhancing) return
      if (
        mutations &&
        mutations.every((m) => {
          const t = m.target as Element | null
          return !!t?.closest?.('.scroll-table-shell, .fy-table-shell')
        })
      ) {
        return
      }
      if (timer) clearTimeout(timer)
      timer = setTimeout(runEnhance, 120)
    }
    const onResize = () => schedule()

    runEnhance()

    const mo = new MutationObserver((mutations) => schedule(mutations))
    mo.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', onResize)

    return () => {
      if (timer) clearTimeout(timer)
      mo.disconnect()
      window.removeEventListener('resize', onResize)
      cleanups.forEach((fn) => fn())
      cleanups.clear()
    }
  }, [pathname])

  return null
}
