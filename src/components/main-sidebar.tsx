"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSubmenu,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  HomeIcon,
  MessageSquare,
  Phone,
  Calendar,
  Users,
} from "lucide-react"

const ROUTE_CONFIG = {
  home: {
    name: "Home",
    path: "/home",
    defaultSubmenu: "dashboard",
    submenuItems: {
      dashboard: "/home/dashboard",
    },
    icon: <HomeIcon />,
  },
  calls: {
    name: "Calls",
    path: "/calls",
    defaultSubmenu: "recent-calls",
    submenuItems: {
      "recent-calls": "/calls/recent",
      "missed-calls": "/calls/missed",
      "call-history": "/calls/history",
    },
    icon: <Phone />,
  },
  messages: {
    name: "Messages",
    path: "/messages",
    defaultSubmenu: "all",
    submenuItems: {
      all: "/messages/all",
      scheduled: "/messages/scheduled",
      templates: "/messages/templates",
    },
    icon: <MessageSquare />,
  },
  schedule: {
    name: "Schedule",
    path: "/schedule",
    defaultSubmenu: "day",
    submenuItems: {
      day: "/schedule/day",
      week: "/schedule/week",
      month: "/schedule/month",
    },
    icon: <Calendar />,
  },
  patients: {
    name: "Patients",
    path: "/patients",
    defaultSubmenu: "patient-list",
    submenuItems: {
      "patient-list": "/patients/list",
      "patient-groups": "/patients/groups",
    },
    icon: <Users />,
  },
}

function MainSidebarContent() {
  const pathname = usePathname()
  const { setActiveSubmenu } = useSidebar()
  const [activeSubmenuKey, setActiveSubmenuKey] = React.useState<string | null>(null)

  // Determine active section based on current route
  const activeSection = React.useMemo(() => {
    const section = Object.entries(ROUTE_CONFIG).find(([_, config]) => 
      pathname.startsWith(config.path)
    )
    return section ? section[0] : "home"
  }, [pathname])

  // Get the number of submenu items for the current section
  const submenuItemCount = React.useMemo(() => {
    const currentSection = ROUTE_CONFIG[activeSection as keyof typeof ROUTE_CONFIG]
    return Object.keys(currentSection.submenuItems).length
  }, [activeSection])

  // Generate submenu content
  const generateSubmenu = React.useCallback((section: keyof typeof ROUTE_CONFIG) => {
    const currentSection = ROUTE_CONFIG[section]
    return (
      <>
        {Object.entries(currentSection.submenuItems).map(([subKey, subPath]) => (
          <Link key={subKey} href={subPath}>
            <SidebarMenuButton 
              variant="submenu"
              size="submenu"
              isActive={pathname === subPath}
            >
              {subKey.replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase())}
            </SidebarMenuButton>
          </Link>
        ))}
      </>
    )
  }, [pathname])

  // Set initial submenu and update on section change
  React.useEffect(() => {
    const currentSection = ROUTE_CONFIG[activeSection as keyof typeof ROUTE_CONFIG]
    if (currentSection) {
      const submenuItem = Object.entries(currentSection.submenuItems).find(([_, path]) => 
        pathname === path
      )
      setActiveSubmenuKey(submenuItem ? submenuItem[0] : currentSection.defaultSubmenu)
      setActiveSubmenu(generateSubmenu(activeSection as keyof typeof ROUTE_CONFIG), currentSection.name)
    }
  }, [pathname, activeSection, setActiveSubmenu, generateSubmenu])

  const handleMouseEnter = (route: typeof ROUTE_CONFIG[keyof typeof ROUTE_CONFIG]) => {
    setActiveSubmenu(generateSubmenu(route.name.toLowerCase() as keyof typeof ROUTE_CONFIG), route.name)
  }

  const handleMouseLeave = (key: string) => {
    if (key !== activeSection) {
      const activeRoute = ROUTE_CONFIG[activeSection as keyof typeof ROUTE_CONFIG]
      setActiveSubmenu(generateSubmenu(activeSection as keyof typeof ROUTE_CONFIG), activeRoute.name)
    }
  }

  return (
    <div className="flex h-full">
      <Sidebar>
        <SidebarHeader>
          <div className="text-center font-semibold">LOGO</div>
        </SidebarHeader>
        <SidebarContent className="mt-1">
          <SidebarMenu>
            {Object.entries(ROUTE_CONFIG).map(([key, route]) => {
              const isActive = key === activeSection
              return (
                <SidebarMenuItem
                  key={key}
                  title={route.name}
                  isActive={isActive}
                  onMouseEnter={() => handleMouseEnter(route)}
                  onMouseLeave={() => handleMouseLeave(key)}
                >
                  <Link href={route.submenuItems[route.defaultSubmenu as keyof typeof route.submenuItems]}>
                    <SidebarMenuButton 
                      tooltip={route.name}
                      isActive={isActive}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {route.icon}
                        <span className="text-xs font-medium">{route.name}</span>
                      </div>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarSubmenu submenuItemCount={submenuItemCount} />
    </div>
  )
}

export function MainSidebar() {
  return (
    <div className="h-screen">
      <SidebarProvider defaultOpen>
        <MainSidebarContent />
      </SidebarProvider>
    </div>
  )
}
