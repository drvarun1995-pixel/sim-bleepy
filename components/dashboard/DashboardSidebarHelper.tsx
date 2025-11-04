import Link from 'next/link'
import { cn } from '@/utils'
import { getTourAttribute } from '@/lib/onboarding/tourAttributes'

interface NavigationLinkProps {
  item: {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }
  isActive: boolean
  isCollapsed?: boolean
  onClick?: () => void
}

export function NavigationLink({ item, isActive, isCollapsed, onClick }: NavigationLinkProps) {
  const tourAttr = getTourAttribute(item.name)
  
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        isActive
          ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
          : 'text-white hover:bg-gray-800 hover:text-gray-100',
        'group flex items-center text-base font-medium transition-colors duration-200 relative rounded-r-lg',
        isCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'
      )}
      title={isCollapsed ? item.name : ''}
      data-tour={tourAttr}
    >
      <item.icon
        className={cn(
          isActive
            ? 'text-blue-400'
            : 'text-white group-hover:text-gray-300',
          'flex-shrink-0 h-6 w-6',
          !isCollapsed && 'mr-4'
        )}
        aria-hidden="true"
      />
      {!isCollapsed && <span className="flex-1">{item.name}</span>}
    </Link>
  )
}
