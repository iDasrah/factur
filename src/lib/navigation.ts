import { File, FilePlus, Home, User, UserPlus } from "lucide-react";

export const navLinks = {
    dashboard:{
        path: '/',
        name: 'Tableau de bord',
        icon: Home,
    },
    customers:{
        path: '/customers',
        name: 'Clients',
        icon: User,
    },
    documents: {
        path: '/documents',
        name: 'Documents',
        icon: File,
    },
    newDocument: {
        path: '/documents/new',
        name: 'Nouveau document',
        icon: FilePlus,
    },
    newCustomer: {
        path: '/customers/new',
        name: 'Nouveau client',
        icon: UserPlus,
    }
};