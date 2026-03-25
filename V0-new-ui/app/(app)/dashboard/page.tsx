"use client"

import Link from "next/link"
import { Plus, Play, MoreHorizontal, Sparkles, Clock, Film, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n"

const recentProjects = [
  {
    id: "1",
    name: "Product Launch Teaser",
    shots: 12,
    lastEdited: "2 hours ago",
    status: "In Progress",
  },
  {
    id: "2",
    name: "Brand Story Video",
    shots: 8,
    lastEdited: "Yesterday",
    status: "Completed",
  },
  {
    id: "3",
    name: "Tutorial Series Intro",
    shots: 5,
    lastEdited: "3 days ago",
    status: "Draft",
  },
  {
    id: "4",
    name: "Social Media Campaign",
    shots: 15,
    lastEdited: "1 week ago",
    status: "Completed",
  },
]

const recentShots = [
  { id: "1", name: "Hero Shot - Product Close-up", project: "Product Launch Teaser", time: "1 hour ago" },
  { id: "2", name: "Opening Scene - Wide Angle", project: "Brand Story Video", time: "3 hours ago" },
  { id: "3", name: "Logo Reveal Animation", project: "Tutorial Series Intro", time: "Yesterday" },
  { id: "4", name: "Call to Action Frame", project: "Social Media Campaign", time: "2 days ago" },
]

const templates = [
  { id: "1", name: "Product Showcase", category: "Commercial" },
  { id: "2", name: "Cinematic Opener", category: "Film" },
  { id: "3", name: "Social Ad", category: "Marketing" },
  { id: "4", name: "Documentary Style", category: "Film" },
]

export default function DashboardPage() {
  const { t } = useI18n()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.welcome")}, John</p>
        </div>
        <Link href="/workspace">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            {t("dashboard.newProject")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card/50 p-5 transition-colors hover:bg-card">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <div className="rounded-lg bg-primary/10 p-2">
              <Film className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm">{t("dashboard.projects")}</span>
          </div>
          <div className="text-3xl font-bold">24</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/50 p-5 transition-colors hover:bg-card">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm">{t("nav.generate")}</span>
          </div>
          <div className="text-3xl font-bold">847</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/50 p-5 transition-colors hover:bg-card">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <div className="rounded-lg bg-primary/10 p-2">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm">Credits</span>
          </div>
          <div className="text-3xl font-bold">2,340</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/50 p-5 transition-colors hover:bg-card">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <div className="rounded-lg bg-primary/10 p-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm">{t("dashboard.usage")}</span>
          </div>
          <div className="text-3xl font-bold">156</div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{t("dashboard.projects")}</h2>
            <Link href="/history" className="text-sm text-primary hover:underline">
              {t("dashboard.viewAll")}
            </Link>
          </div>
          <div className="space-y-2">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/50 p-4 transition-all hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.shots} shots · {project.lastEdited}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      project.status === "Completed"
                        ? "bg-chart-2/20 text-chart-2"
                        : project.status === "In Progress"
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {project.status}
                  </span>
                  <Link href="/workspace">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                      <Play className="h-4 w-4" />
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>{t("common.edit")}</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">{t("common.delete")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Recent Shots */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{t("dashboard.recentShots")}</h2>
              <Link href="/history" className="text-sm text-primary hover:underline">
                {t("dashboard.viewAll")}
              </Link>
            </div>
            <div className="space-y-2">
              {recentShots.map((shot) => (
                <div
                  key={shot.id}
                  className="rounded-xl border border-border/60 bg-card/50 p-3 transition-all hover:border-primary/30 hover:bg-card"
                >
                  <div className="mb-1 text-sm font-medium">{shot.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {shot.project} · {shot.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{t("dashboard.quickTemplates")}</h2>
              <Link href="/templates" className="text-sm text-primary hover:underline">
                {t("dashboard.viewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href="/workspace"
                  className="rounded-xl border border-border/60 bg-card/50 p-3 transition-all hover:border-primary/30 hover:bg-card"
                >
                  <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-xs font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.category}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Usage */}
          <div className="rounded-xl border border-border/60 bg-card/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">{t("dashboard.usage")}</span>
              <span className="text-xs text-muted-foreground">156 / Unlimited</span>
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-accent" />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("pricing.pro")} · {t("pricing.feature.unlimitedGen")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
