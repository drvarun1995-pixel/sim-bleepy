import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  height?: string
  width?: string
}

export function LoadingSkeleton({ className, height = "h-4", width = "w-full" }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        height,
        width,
        className
      )}
    />
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <LoadingSkeleton height="h-4" width="w-3/4" />
      <LoadingSkeleton height="h-4" width="w-1/2" />
      <LoadingSkeleton height="h-20" width="w-full" />
    </div>
  )
}

export function EventCardSkeleton() {
  return (
    <div className="p-4 border border-gray-200 rounded-lg animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <LoadingSkeleton height="h-4" width="w-16" />
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <LoadingSkeleton height="h-5" width="w-32" />
            <LoadingSkeleton height="h-5" width="w-20" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <LoadingSkeleton height="h-4" width="w-24" />
            <div className="flex flex-wrap gap-1">
              <LoadingSkeleton height="h-5" width="w-16" />
              <LoadingSkeleton height="h-5" width="w-20" />
            </div>
          </div>
        </div>
        <LoadingSkeleton height="h-5" width="w-5" />
      </div>
    </div>
  )
}
