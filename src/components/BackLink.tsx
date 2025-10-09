import { Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

interface BackLinkProps {
    to: string;
    label: string;
}

const BackLink = ({ to, label }: BackLinkProps) => {
  return (
    <Link to={to} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft size={20}/>
        {label}
    </Link>
  )
}

export default BackLink