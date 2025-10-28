// Public layout - no authentication required
// Authentication is handled in the page component to preserve URL parameters
export default function ScanAttendanceSmartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
