"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Sparkles, Grid, List, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categories = [
  { id: "all", name: "All Templates" },
  { id: "commercial", name: "Commercial" },
  { id: "film", name: "Film" },
  { id: "marketing", name: "Marketing" },
  { id: "social", name: "Social Media" },
  { id: "product", name: "Product" },
]

const templates = [
  {
    id: "1",
    name: "Product Showcase",
    category: "Commercial",
    description: "Professional product reveal with dramatic lighting",
    shots: 8,
    popular: true,
  },
  {
    id: "2",
    name: "Cinematic Opener",
    category: "Film",
    description: "Epic title sequence with camera movement",
    shots: 5,
    popular: true,
  },
  {
    id: "3",
    name: "Social Ad",
    category: "Marketing",
    description: "Engaging social media advertisement format",
    shots: 3,
    popular: false,
  },
  {
    id: "4",
    name: "Documentary Style",
    category: "Film",
    description: "Natural lighting with interview setup",
    shots: 6,
    popular: false,
  },
  {
    id: "5",
    name: "Tech Product Launch",
    category: "Product",
    description: "Sleek presentation for tech products",
    shots: 10,
    popular: true,
  },
  {
    id: "6",
    name: "Brand Story",
    category: "Marketing",
    description: "Emotional narrative for brand storytelling",
    shots: 12,
    popular: false,
  },
  {
    id: "7",
    name: "Instagram Reel",
    category: "Social Media",
    description: "Vertical format optimized for reels",
    shots: 4,
    popular: true,
  },
  {
    id: "8",
    name: "YouTube Intro",
    category: "Social Media",
    description: "Attention-grabbing channel intro",
    shots: 2,
    popular: false,
  },
  {
    id: "9",
    name: "Fashion Lookbook",
    category: "Commercial",
    description: "Editorial style fashion presentation",
    shots: 15,
    popular: false,
  },
  {
    id: "10",
    name: "Food Commercial",
    category: "Commercial",
    description: "Appetizing food photography shots",
    shots: 6,
    popular: true,
  },
  {
    id: "11",
    name: "Real Estate Tour",
    category: "Commercial",
    description: "Smooth property walkthrough",
    shots: 8,
    popular: false,
  },
  {
    id: "12",
    name: "Music Video",
    category: "Film",
    description: "Dynamic shots for music videos",
    shots: 20,
    popular: false,
  },
]

export default function TemplatesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter(
          (t) => t.category.toLowerCase() === selectedCategory
        )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Start with a professionally designed template
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search templates..." className="bg-input pl-10" />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-44 bg-input">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
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

      {/* Category Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              selectedCategory === cat.id
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <Link
              key={template.id}
              href="/workspace"
              className="group rounded-lg border border-border/60 bg-card/50 p-4 transition-colors hover:border-border hover:bg-card"
            >
              <div className="relative mb-4 aspect-video overflow-hidden rounded-md bg-secondary">
                <div className="flex h-full items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                </div>
                {template.popular && (
                  <div className="absolute top-2 right-2 rounded-full bg-accent/90 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    Popular
                  </div>
                )}
              </div>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-medium">{template.name}</h3>
              </div>
              <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                {template.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-secondary px-2 py-0.5">
                  {template.category}
                </span>
                <span>{template.shots} shots</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <Link
              key={template.id}
              href="/workspace"
              className="group flex items-center gap-4 rounded-lg border border-border/60 bg-card/50 p-4 transition-colors hover:border-border hover:bg-card"
            >
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-secondary">
                <Sparkles className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-medium">{template.name}</h3>
                  {template.popular && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {template.category}
                </span>
                <div className="mt-1 text-xs text-muted-foreground">
                  {template.shots} shots
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 opacity-0 group-hover:opacity-100"
              >
                Use Template
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
