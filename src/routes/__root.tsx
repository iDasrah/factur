import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import type {ReactNode} from "react";
import BottomNav from "@/components/BottomNav.tsx";
import Sidebar from "@/components/Sidebar.tsx";
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="md:min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="w-full pb-20 md:pb-0">
            <h1 className="font-bold text-blue-600 text-center text-4xl mt-4 md:hidden">Factur</h1>
            {children}
        </main>
        <BottomNav />
        <Scripts />
      </body>
    </html>
  )
}
