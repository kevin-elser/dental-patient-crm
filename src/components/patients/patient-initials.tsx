import { cn } from "@/lib/utils"

type PatientInitialsProps = {
  firstName: string | null
  lastName: string | null
  colorIndex: number
  className?: string
}

const getInitials = (firstName: string | null, lastName: string | null) => {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase()
}

export function PatientInitials({ 
  firstName, 
  lastName, 
  colorIndex,
  className 
}: PatientInitialsProps) {
  const bgColorClass = `bg-patient-${((colorIndex - 1) % 8) + 1}`
  
  return (
    <div 
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full",
        bgColorClass,
        className
      )}
    >
      <span className="text-sm font-bold text-white">
        {getInitials(firstName, lastName)}
      </span>
    </div>
  )
} 