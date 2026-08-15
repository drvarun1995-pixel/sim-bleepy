import { describe, expect, it } from 'vitest'
import { parsePublicFyImagePath } from '@/lib/fy-public-image-path'

describe('parsePublicFyImagePath', () => {
  it('allows general and legacy fy1/fy2 copies of public guide images', () => {
    expect(
      parsePublicFyImagePath(
        'foundation-year/general/prescribing/fy1-potassium-prescribing-hypokalaemia/images/featured-bleepy-unique.webp'
      )
    ).toEqual({
      cohort: 'general',
      pageSlug: 'fy1-potassium-prescribing-hypokalaemia',
    })
    expect(
      parsePublicFyImagePath(
        'foundation-year/fy1/clerking-shifts/fy1-potassium-prescribing-hypokalaemia/images/causes-of-hypokalaemia.png'
      )
    ).toEqual({
      cohort: 'fy1',
      pageSlug: 'fy1-potassium-prescribing-hypokalaemia',
    })
  })

  it('blocks basildon and members-only slugs', () => {
    expect(
      parsePublicFyImagePath(
        'foundation-year/basildon/local-systems/ward-wifi-guide/images/a.png'
      )
    ).toBeNull()
    expect(
      parsePublicFyImagePath(
        'foundation-year/general/prescribing/fy1-iv-fluid-prescribing/images/a.png'
      )
    ).toBeNull()
  })
})
