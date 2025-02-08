"use client"

import { 
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider 
} from "@/components/ui/sidebar"
import { 
  HomeIcon, 
  MessageSquare, 
  Phone, 
  Calendar, 
  CreditCard, 
  FileText, 
  Printer, 
  Users, 
  Star, 
  BarChart, 
  Megaphone 
} from "lucide-react"
import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

// Route mapping configuration
const ROUTE_CONFIG = {
  home: {
    path: "/home",
    defaultSubmenu: "dashboard",
    submenuItems: {
      dashboard: "/home/dashboard"
    }
  },
  calls: {
    path: "/calls",
    defaultSubmenu: "recent",
    submenuItems: {
      "recent-calls": "/calls/recent",
      "missed-calls": "/calls/missed",
      "call-history": "/calls/history"
    }
  },
  messages: {
    path: "/messages",
    defaultSubmenu: "received",
    submenuItems: {
      received: "/messages/received",
      sent: "/messages/sent",
      templates: "/messages/templates"
    }
  },
  schedule: {
    path: "/schedule",
    defaultSubmenu: "day",
    submenuItems: {
      day: "/schedule/day",
      week: "/schedule/week",
      month: "/schedule/month"
    }
  },
  patients: {
    path: "/patients",
    defaultSubmenu: "patient-list",
    submenuItems: {
      "patient-list": "/patients/list",
      "add-patient": "/patients/add",
      "patient-groups": "/patients/groups"
    }
  },
  analytics: {
    path: "/analytics",
    defaultSubmenu: "overview",
    submenuItems: {
      overview: "/analytics/overview",
      reports: "/analytics/reports",
      insights: "/analytics/insights"
    }
  },
  marketing: {
    path: "/marketing",
    defaultSubmenu: "campaigns",
    submenuItems: {
      campaigns: "/marketing/campaigns",
      "marketing-templates": "/marketing/templates"
    }
  }
}

export function MainSidebar() {
  const pathname = usePathname()
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null)

  // Determine active section based on current route
  const activeSection = React.useMemo(() => {
    const section = Object.entries(ROUTE_CONFIG).find(([_, config]) => 
      pathname.startsWith(config.path)
    )
    return section ? section[0] : "home"
  }, [pathname])

  // Determine active submenu based on current route
  React.useEffect(() => {
    const currentSection = ROUTE_CONFIG[activeSection as keyof typeof ROUTE_CONFIG]
    if (currentSection) {
      const submenuItem = Object.entries(currentSection.submenuItems).find(([_, path]) => 
        pathname === path
      )
      setActiveSubmenu(submenuItem ? submenuItem[0] : currentSection.defaultSubmenu)
    }
  }, [pathname, activeSection])

  const handleSubmenuClick = (itemName: string) => {
    setActiveSubmenu(activeSubmenu === itemName ? null : itemName)
  }

  return (
    <div className="fixed left-0 top-0 z-30 h-screen">
      <SidebarProvider defaultOpen>
        <Sidebar className="h-screen border-r">
          <SidebarHeader className="flex justify-center p-2">
            <div className="text-foreground/70 text-center font-semibold">LOGO</div>
          </SidebarHeader>
          <SidebarContent className="mt-1">
            <SidebarMenu>
              <SidebarMenuItem
                title="Home"
                isActive={activeSection === "home"}
                submenu={
                  <>
                    <Link href={ROUTE_CONFIG.home.submenuItems.dashboard}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "dashboard"}
                        onClick={() => handleSubmenuClick("dashboard")}
                      >
                        Dashboard
                      </SidebarMenuButton>
                    </Link>
                  </>
                }
              >
                <Link href={ROUTE_CONFIG.home.submenuItems.dashboard}>
                  <SidebarMenuButton 
                    tooltip="Home" 
                    isActive={activeSection === "home"}
                  >
                    <HomeIcon />
                    <span>Home</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem
                title="Calls"
                isActive={activeSection === "calls"}
                submenu={
                  <>
                    <Link href={ROUTE_CONFIG.calls.submenuItems["recent-calls"]}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "recent-calls"}
                        onClick={() => handleSubmenuClick("recent-calls")}
                      >
                        Recent Calls
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.calls.submenuItems["missed-calls"]}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "missed-calls"}
                        onClick={() => handleSubmenuClick("missed-calls")}
                      >
                        Missed Calls
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.calls.submenuItems["call-history"]}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "call-history"}
                        onClick={() => handleSubmenuClick("call-history")}
                      >
                        Call History
                      </SidebarMenuButton>
                    </Link>
                  </>
                }
              >
                <Link href={ROUTE_CONFIG.calls.submenuItems["recent-calls"]}>
                  <SidebarMenuButton 
                    tooltip="Calls"
                    isActive={activeSection === "calls"}
                  >
                    <Phone />
                    <span>Calls</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem
                title="Messages"
                isActive={activeSection === "messages"}
                submenu={
                  <>
                    <Link href={ROUTE_CONFIG.messages.submenuItems.received}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "received"}
                        onClick={() => handleSubmenuClick("received")}
                      >
                        Received
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.messages.submenuItems.sent}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "sent"}
                        onClick={() => handleSubmenuClick("sent")}
                      >
                        Sent
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.messages.submenuItems.templates}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "templates"}
                        onClick={() => handleSubmenuClick("templates")}
                      >
                        Templates
                      </SidebarMenuButton>
                    </Link>
                  </>
                }
              >
                <Link href={ROUTE_CONFIG.messages.submenuItems.received}>
                  <SidebarMenuButton 
                    tooltip="Messages"
                    isActive={activeSection === "messages"}
                  >
                    <MessageSquare />
                    <span>Messages</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem
                title="Schedule"
                isActive={activeSection === "schedule"}
                submenu={
                  <>
                    <Link href={ROUTE_CONFIG.schedule.submenuItems.day}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "day"}
                        onClick={() => handleSubmenuClick("day")}
                      >
                        Day View
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.schedule.submenuItems.week}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "week"}
                        onClick={() => handleSubmenuClick("week")}
                      >
                        Week View
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.schedule.submenuItems.month}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "month"}
                        onClick={() => handleSubmenuClick("month")}
                      >
                        Month View
                      </SidebarMenuButton>
                    </Link>
                  </>
                }
              >
                <Link href={ROUTE_CONFIG.schedule.submenuItems.day}>
                  <SidebarMenuButton 
                    tooltip="Schedule"
                    isActive={activeSection === "schedule"}
                  >
                    <Calendar />
                    <span>Schedule</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem
                title="Patients"
                isActive={activeSection === "patients"}
                submenu={
                  <>
                    <Link href={ROUTE_CONFIG.patients.submenuItems["patient-list"]}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "patient-list"}
                        onClick={() => handleSubmenuClick("patient-list")}
                      >
                        Patient List
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.patients.submenuItems["add-patient"]}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "add-patient"}
                        onClick={() => handleSubmenuClick("add-patient")}
                      >
                        Add Patient
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.patients.submenuItems["patient-groups"]}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "patient-groups"}
                        onClick={() => handleSubmenuClick("patient-groups")}
                      >
                        Patient Groups
                      </SidebarMenuButton>
                    </Link>
                  </>
                }
              >
                <Link href={ROUTE_CONFIG.patients.submenuItems["patient-list"]}>
                  <SidebarMenuButton 
                    tooltip="Patients"
                    isActive={activeSection === "patients"}
                  >
                    <Users />
                    <span>Patients</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem
                title="Analytics"
                isActive={activeSection === "analytics"}
                submenu={
                  <>
                    <Link href={ROUTE_CONFIG.analytics.submenuItems.overview}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "overview"}
                        onClick={() => handleSubmenuClick("overview")}
                      >
                        Overview
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.analytics.submenuItems.reports}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "reports"}
                        onClick={() => handleSubmenuClick("reports")}
                      >
                        Reports
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.analytics.submenuItems.insights}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "insights"}
                        onClick={() => handleSubmenuClick("insights")}
                      >
                        Insights
                      </SidebarMenuButton>
                    </Link>
                  </>
                }
              >
                <Link href={ROUTE_CONFIG.analytics.submenuItems.overview}>
                  <SidebarMenuButton 
                    tooltip="Analytics"
                    isActive={activeSection === "analytics"}
                  >
                    <BarChart />
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem
                title="Marketing"
                isActive={activeSection === "marketing"}
                submenu={
                  <>
                    <Link href={ROUTE_CONFIG.marketing.submenuItems.campaigns}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "campaigns"}
                        onClick={() => handleSubmenuClick("campaigns")}
                      >
                        Campaigns
                      </SidebarMenuButton>
                    </Link>
                    <Link href={ROUTE_CONFIG.marketing.submenuItems["marketing-templates"]}>
                      <SidebarMenuButton 
                        variant="submenu"
                        size="submenu"
                        isActive={activeSubmenu === "marketing-templates"}
                        onClick={() => handleSubmenuClick("marketing-templates")}
                      >
                        Templates
                      </SidebarMenuButton>
                    </Link>
                  </>
                }
              >
                <Link href={ROUTE_CONFIG.marketing.submenuItems.campaigns}>
                  <SidebarMenuButton 
                    tooltip="Marketing"
                    isActive={activeSection === "marketing"}
                  >
                    <Megaphone />
                    <span>Marketing</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  )
} 