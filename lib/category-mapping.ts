// Utility for mapping specific categories to broader categories on dashboard

interface CategoryMapping {
  [key: string]: string;
}

// Map specific year-based categories to broader categories
const CATEGORY_MAPPING: CategoryMapping = {
  // ARU year mappings
  'ARU Year 1': 'ARU',
  'ARU Year 2': 'ARU', 
  'ARU Year 3': 'ARU',
  'ARU Year 4': 'ARU',
  'ARU Year 5': 'ARU',
  
  // UCL year mappings
  'UCL Year 1': 'UCL',
  'UCL Year 2': 'UCL',
  'UCL Year 3': 'UCL', 
  'UCL Year 4': 'UCL',
  'UCL Year 5': 'UCL',
  'UCL Year 6': 'UCL',
  
  // Foundation year mappings
  'Foundation Year 1': 'Foundation Year Doctor',
  'Foundation Year 2': 'Foundation Year Doctor',
  'FY1': 'Foundation Year Doctor',
  'FY2': 'Foundation Year Doctor',
  
  // Keep other categories as-is (don't map them)
};

/**
 * Maps specific categories to broader categories for dashboard display
 * @param categories - Array of category objects with name property
 * @returns Array of mapped category objects with broader names
 */
export function mapCategoriesForDashboard(categories: Array<{ id: string; name: string; color?: string }>): Array<{ id: string; name: string; color?: string }> {
  if (!categories || categories.length === 0) {
    return [];
  }

  // Group categories by their mapped name to avoid duplicates
  const mappedCategories = new Map<string, { id: string; name: string; color?: string }>();
  
  categories.forEach(category => {
    const mappedName = CATEGORY_MAPPING[category.name] || category.name;
    
    // Only add if we haven't seen this mapped category yet
    if (!mappedCategories.has(mappedName)) {
      mappedCategories.set(mappedName, {
        id: mappedName.toLowerCase().replace(/\s+/g, '-'), // Create consistent ID based on mapped name
        name: mappedName,
        color: category.color || getDefaultColorForMappedCategory(mappedName)
      });
    }
  });

  return Array.from(mappedCategories.values());
}

/**
 * Gets a default color for mapped categories
 */
function getDefaultColorForMappedCategory(mappedName: string): string {
  const defaultColors: { [key: string]: string } = {
    'ARU': '#3B82F6', // Blue
    'UCL': '#8B5CF6', // Purple  
    'Foundation Year Doctor': '#F59E0B', // Amber
  };
  
  return defaultColors[mappedName] || '#6B7280'; // Default gray
}

/**
 * Gets the display name for a category on dashboard
 * @param categoryName - Original category name
 * @returns Mapped category name or original if no mapping exists
 */
export function getDashboardCategoryName(categoryName: string): string {
  return CATEGORY_MAPPING[categoryName] || categoryName;
}
