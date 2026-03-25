"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Search,
  Film,
  Calendar,
  Download,
  MoreHorizontal,
  Grid,
  List,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const historyItems = [
  {
    id: "1",
    prompt: "A cinematic close-up shot of a premium product placed on a reflective surface with dramatic studio lighting",
    date: "Mar 23, 2026",
    time: "2:45 PM",
    project: "Product Launch Teaser",
    format: "Video",
    resolution: "4K",
  },
  {
    id: "2",
    prompt: "Wide angle establishing shot of a modern office space with natural lighting streaming through windows",
    date: "Mar 23, 2026",
    time: "1:30 PM",
    project: "Brand Story Video",
    format: "Video",
    resolution: "4K",
  },
  {
    id: "3",
    prompt: "Dramatic low-angle shot of a character silhouette against a sunset sky",
    date: "Mar 22, 2026",
    time: "5:15 PM",
    project: "Music Video Concept",
    format: "Image",
    resolution: "4K",
  },
  {
    id: "4",
    prompt: "Aerial drone shot smoothly descending over a coastal city at golden hour",
    date: "Mar 22, 2026",
    time: "3:00 PM",
    project: "Travel Documentary",
    format: "Video",
    resolution: "1080p",
  },
  {
    id: "5",
    prompt: "Macro close-up of coffee being poured into a ceramic cup with steam rising",
    date: "Mar 21, 2026",
    time: "11:00 AM",
    project: "Food Commercial",
    format: "Video",
    resolution: "4K",
  },
  {
    id: "6",
    prompt: "Smooth dolly shot through a modern art gallery with sculptures and paintings",
    date: "Mar 21, 2026",
    time: "9:30 AM",
    project: "Gallery Tour",
    format: "Video",
    resolution: "4K",
  },
  {
    id: "7",
    prompt: "Portrait shot of a professional in a studio environment with soft lighting",
    date: "Mar 20, 2026",
    time: "4:00 PM",
    project: "Corporate Headshots",
    format: "Image",
    resolution: "4K",
  },
  {
    id: "8",
    prompt: "Dynamic tracking shot following a sports car on a mountain road",
    date: "Mar 20, 2026",
    time: "2:15 PM",
    project: "Automotive Ad",
    format: "Video",
    resolution: "4K",
  },
]

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your generation history
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search history..." className="bg-input pl-10" />
        </div>

        <Select defaultValue="all">
          <SelectTrigger className="w-36 bg-input">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-32 bg-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex rounded-md border border-border/60 bg-input p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-sm p-1.5 ${viewMode === "grid" ? "bg-secondary" : ""}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-sm p-1.5 ${viewMode === "list" ? "bg-secondary" : ""}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* History List */}
      {viewMode === "list" ? (
        <div className="space-y-2">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-4 rounded-lg border border-border/60 bg-card/50 p-4 transition-colors hover:border-border hover:bg-card"
            >
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-secondary">
                <Film className="h-6 w-6 text-muted-foreground/50" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="mb-1 line-clamp-1 text-sm">{item.prompt}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.project}</span>
                  <span>·</span>
                  <span>{item.date}</span>
                  <span>·</span>
                  <span>{item.time}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {item.format}
                </span>
                <span className="text-xs text-muted-foreground">{item.resolution}</span>
              </div>

              <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <Link href="/result">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Prompt
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-lg border border-border/60 bg-card/50 p-4 transition-colors hover:border-border hover:bg-card"
            >
              <div className="relative mb-4 aspect-video overflow-hidden rounded-md bg-secondary">
                <div className="flex h-full items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                  <Link href="/result">
                    <Button variant="secondary" size="sm" className="h-7 w-7 p-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" className="h-7 w-7 p-0">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="mb-2 line-clamp-2 text-sm">{item.prompt}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.project}</span>
                <span>{item.date}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                  {item.format}
                </span>
                <span className="text-xs text-muted-foreground">{item.resolution}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      <div className="mt-8 flex justify-center">
        <Button variant="outline">Load More</Button>
      </div>
    </div>
  )
}
