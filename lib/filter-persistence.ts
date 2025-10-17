/**
 * Utility functions for persisting filter states in localStorage
 */

export interface FilterState {
  searchQuery?: string;
  categoryFilter?: string;
  formatFilter?: string;
  locationFilter?: string;
  organizerFilter?: string;
  speakerFilter?: string;
  timeFilter?: string;
  viewMode?: string;
  itemsPerPage?: number;
  sortBy?: string;
  showPersonalizedOnly?: boolean;
}

/**
 * Save filter state to localStorage
 */
export function saveFiltersToStorage(pageKey: string, filters: FilterState): void {
  try {
    const key = `filters_${pageKey}`;
    localStorage.setItem(key, JSON.stringify(filters));
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error);
  }
}

/**
 * Load filter state from localStorage
 */
export function loadFiltersFromStorage(pageKey: string): FilterState {
  try {
    const key = `filters_${pageKey}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error);
    return {};
  }
}

/**
 * Clear filter state from localStorage
 */
export function clearFiltersFromStorage(pageKey: string): void {
  try {
    const key = `filters_${pageKey}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear filters from localStorage:', error);
  }
}

/**
 * Hook for managing filter persistence
 */
export function useFilterPersistence(pageKey: string) {
  const saveFilters = (filters: FilterState) => saveFiltersToStorage(pageKey, filters);
  const loadFilters = () => loadFiltersFromStorage(pageKey);
  const clearFilters = () => clearFiltersFromStorage(pageKey);

  return { saveFilters, loadFilters, clearFilters };
}
