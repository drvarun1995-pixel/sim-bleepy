import { memo } from "react"

export const TableIcon = memo(
  ({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        width="24"
        height="24"
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3 3C2.44772 3 2 3.44772 2 4V20C2 20.5523 2.44772 21 3 21H21C21.5523 21 22 20.5523 22 20V4C22 3.44772 21.5523 3 21 3H3ZM4 9V5H10V9H4ZM12 9V5H20V9H12ZM4 15V11H10V15H4ZM12 15V11H20V15H12ZM4 19V15H10V19H4ZM12 19V15H20V19H12Z"
          fill="currentColor"
        />
      </svg>
    )
  }
)

TableIcon.displayName = "TableIcon"

