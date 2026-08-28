import { requirePersonalPortfolioUser } from '@/lib/portfolio-access'

export async function requireTeachingPortfolioUser() {
  return requirePersonalPortfolioUser('Teaching Portfolio')
}
