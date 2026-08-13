export interface CohortIdentifier {
  university: string
  year: string
}

/** Parse "ARU Year 4", "UCL Year 6", "Foundation Year 1", or "ARU-4". */
export function parseCohortIdentifier(identifier: string): CohortIdentifier | null {
  const parts = identifier.trim().split(/\s+/)

  if (parts.length < 3) {
    const dashParts = identifier.split('-')
    if (dashParts.length === 2) {
      return {
        university: dashParts[0].trim(),
        year: dashParts[1].trim(),
      }
    }
    return null
  }

  if (parts[0] === 'Foundation' && parts[1] === 'Year') {
    return {
      university: 'Foundation',
      year: parts[2],
    }
  }

  if (parts[1] === 'Year') {
    return {
      university: parts[0],
      year: parts[2],
    }
  }

  return null
}
