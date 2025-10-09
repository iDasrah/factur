import { statusColors, statusLabels } from "@/lib/constants"

interface StatusBadgeProps {
  status: keyof typeof statusColors;
}

const StatusBadge = ({status}: StatusBadgeProps) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
        {statusLabels[status]}
    </span>
  )
}

export default StatusBadge