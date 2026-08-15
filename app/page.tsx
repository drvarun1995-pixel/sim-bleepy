import dynamic from 'next/dynamic'
import { HomeHero } from '@/components/home/HomeHero'

const HomePageBelowFold = dynamic(
  () => import('@/components/home/HomePageBelowFold'),
  { ssr: true }
)

export default function HomePage() {
  return (
    <div className="bleepy-home bg-[#060818] min-h-screen overflow-x-hidden">
      <HomeHero />
      <HomePageBelowFold />
    </div>
  )
}
