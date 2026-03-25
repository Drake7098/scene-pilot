"use client"

import Link from "next/link"
import {
  Film,
  LayoutDashboard,
  Clapperboard,
  FolderOpen,
  Clock,
  CreditCard,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n, LanguageSwitcher } from "@/lib/i18n"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useI18n()

  const navigation = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav.workspace"), href: "/workspace", icon: Clapperboard },
    { name: t("nav.templates"), href: "/templates", icon: FolderOpen },
    { name: t("nav.history"), href: "/history", icon: Clock },
  ]

  const bottomNavigation = [
    { name: t("nav.billing"), href: "/billing", icon: CreditCard },
    { name: t("nav.account"), href: "/account", icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-border/50 bg-sidebar">
        {/* Logo */}
        <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-border/50 px-6 transition-colors hover:bg-sidebar-accent">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Film className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">ScenePilotix</span>
        </Link>

        {/* New Project Button */}
        <div className="p-4">
          <Link href="/workspace">
            <Button className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
              <Plus className="h-4 w-4" />
              {t("dashboard.newProject")}
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-border/50 p-3">
          {bottomNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
          <div className="mt-2 px-3">
            <LanguageSwitcher />
          </div>
        </div>

        {/* User */}
        <div className="border-t border-border/50 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-xs font-medium text-primary">
                  JD
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">John Doe</div>
                  <div className="text-xs text-muted-foreground">{t("pricing.pro")}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/account">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("account.title")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t("nav.billing")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.logout")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
