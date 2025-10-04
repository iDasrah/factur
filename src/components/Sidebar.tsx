import {Link} from "@tanstack/react-router";
import {File, FilePlus, LayoutDashboard, UserPlus, Users} from "lucide-react";

const Sidebar = () => {
    const sections = [
        {
            name: "Général",
            links: [
                {
                    path: "/",
                    name: "Tableau de bord",
                    icon: <LayoutDashboard />,
                },
                {
                    path: "/",
                    name: "Clients",
                    icon: <Users />
                },
                {
                    path: "/",
                    name: "Documents",
                    icon: <File />,
                }
            ]
        },
        {
            name: "Outils",
            links: [
                {
                    path: "/",
                    name: "Nouveau document",
                    icon: <FilePlus />,
                },
                {
                    path: "/",
                    name: "Nouveau client",
                    icon: <UserPlus />,
                }
            ]
        }
    ]

    return (
        <div className="hidden bg-white border-r-2 border-gray-200 md:flex flex-col md:min-w-20 lg:min-w-64 md:min-h-screen">
            <h1 className="flex font-semibold text-blue-600 text-3xl w-full justify-center p-3 lg:justify-start lg:pl-7 lg:py-4 border-b-2 border-gray-200 select-none">F<span className="hidden lg:block">actur</span></h1>
            {
                sections.map((section) => (
                  <section className="sidebar-section" key={section.name}>
                      <h2 className="sidebar-section-title">{section.name.toUpperCase()}</h2>
                      {section.links.map((link) => (
                          <Link key={link.name} to={link.path} className="sidebar-link">
                              {link.icon}
                              <p className="sidebar-link-text">
                                  {link.name}
                              </p>
                          </Link>
                      ))}
                  </section>
                ))
            }
        </div>
    )
}
export default Sidebar
