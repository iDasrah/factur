import {Link} from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {useState} from "react";
import { navLinks } from "@/lib/navigation";

const BottomNav = () => {
    const [isOpen, setIsOpen] = useState(false);

    const links = [navLinks.dashboard, navLinks.customers, navLinks.documents];
    const addLinks = [navLinks.newCustomer, navLinks.newDocument];

    return (
        <>
            {isOpen && <button type="button" className="fixed inset-0 md:hidden z-40" onClick={() => setIsOpen(false)}></button>}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-1 border-gray-200 h-16 flex justify-around items-center z-50 overflow-hidden md:hidden">
                {links.map((link) => (
                    <Link key={link.name} to={link.path} className="flex flex-col items-center rounded-full active:bg-gray-200 transition-colors duration-150 p-4">
                        <link.icon />
                        <p className="text-xs">{link.name}</p>
                    </Link>
                ))}
            </div>
            <button type="button" className="fixed bottom-18 right-2 bg-blue-500 rounded-full p-4 active:scale-95 active:bg-blue-700 transition-all duration-150 md:hidden" onClick={() => setIsOpen(!isOpen)}>
                <Plus color="white" size={24} />
            </button>
            <div className={`${!isOpen && 'hidden'} fixed bottom-18 right-2 rounded-lg bg-blue-500 z-50 overflow-hidden md:hidden`}>
                {addLinks.map((link) => (
                    <Link key={link.name} to={link.path} className="bottomNav-addLink" onClick={() => setIsOpen(false)}>
                        <link.icon />
                        <p>{link.name}</p>
                    </Link>
                ))}
            </div>
        </>

    )
}
export default BottomNav

