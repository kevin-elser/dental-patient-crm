import { cn } from "@/lib/utils"

type PatientInitialsProps = {
  firstName: string | null
  lastName: string | null
  colorIndex: number
  className?: string
}

function getInitials(firstName: string | null, lastName: string | null) {
  const firstInitial = firstName?.[0] || ''
  const lastInitial = lastName?.[0] || ''
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

export function PatientInitials({ 
  firstName, 
  lastName, 
  colorIndex,
  className 
}: PatientInitialsProps) {
  const normalizedIndex = ((colorIndex - 1) % 8) + 1

  return (
    <div 
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full",
        className
      )}
      style={{
        backgroundColor: `hsl(var(--patient-${normalizedIndex}))`,
      }}
    >
      <span 
        className="text-sm font-bold"
        style={{
          color: `hsl(var(--patient-i${normalizedIndex}))`
        }}
      >
        {getInitials(firstName, lastName)}
      </span>
    </div>
  )
} 