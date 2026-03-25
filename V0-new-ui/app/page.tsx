"use client"

import Link from "next/link"
import { Play, ArrowRight, Sparkles, Layers, Zap, Film, Monitor, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n, LanguageSwitcher } from "@/lib/i18n"

function Navbar() {
  const { t } = useI18n()
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Film className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">ScenePilotix</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.pricing")}
            </Link>
            <Link href="/templates" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.templates")}
            </Link>
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.features")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              {t("nav.login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {t("nav.getStarted")}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  const { t } = useI18n()
  
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-16">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[100px]" />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t("hero.badge")}</span>
        </div>
        <h1 className="mb-6 text-balance text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          {t("hero.title")}
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
          {t("hero.subtitle")}
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90">
              {t("hero.cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="h-12 px-8 text-base border-border hover:bg-secondary">
            <Play className="mr-2 h-4 w-4" />
            {t("hero.demo")}
          </Button>
        </div>
      </div>
      <div className="mt-20 w-full max-w-6xl">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl shadow-primary/5">
          <div className="flex h-10 items-center gap-2 border-b border-border/60 bg-secondary/50 px-4">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-chart-4/60" />
              <div className="h-3 w-3 rounded-full bg-chart-2/60" />
            </div>
            <span className="ml-4 text-xs text-muted-foreground">{t("hero.workspace")}</span>
          </div>
          <div className="aspect-video bg-gradient-to-br from-card via-secondary/30 to-card">
            <div className="flex h-full">
              <div className="w-56 border-r border-border/40 bg-sidebar/80 p-4">
                <div className="mb-3 text-xs font-medium text-primary">{t("hero.flowControl")}</div>
                <div className="space-y-2">
                  {[t("workspace.shot"), t("workspace.director"), t("workspace.camera"), t("workspace.scene"), t("workspace.subject")].map((item) => (
                    <div key={item} className="rounded-md bg-secondary/60 px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-secondary">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 p-6">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                      <Film className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t("hero.canvasPreview")}</p>
                  </div>
                </div>
              </div>
              <div className="w-64 border-l border-border/40 bg-sidebar/80 p-4">
                <div className="mb-3 text-xs font-medium text-primary">{t("hero.entityEdit")}</div>
                <div className="space-y-2">
                  {[t("workspace.background"), t("workspace.subject"), t("workspace.lighting"), t("workspace.style")].map((item) => (
                    <div key={item} className="rounded-md bg-secondary/60 px-3 py-2 text-sm text-secondary-foreground transition-colors hover:bg-secondary">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const { t } = useI18n()
  
  const features = [
    {
      icon: Layers,
      title: t("feature.sceneComposition"),
      description: t("feature.sceneCompositionDesc"),
    },
    {
      icon: Zap,
      title: t("feature.realTimeGeneration"),
      description: t("feature.realTimeGenerationDesc"),
    },
    {
      icon: Monitor,
      title: t("feature.professionalWorkspace"),
      description: t("feature.professionalWorkspaceDesc"),
    },
    {
      icon: Palette,
      title: t("feature.styleControl"),
      description: t("feature.styleControlDesc"),
    },
    {
      icon: Film,
      title: t("feature.shotManagement"),
      description: t("feature.shotManagementDesc"),
    },
    {
      icon: Sparkles,
      title: t("feature.aiDirector"),
      description: t("feature.aiDirectorDesc"),
    },
  ]

  return (
    <section id="features" className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{t("features.title")}</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t("features.subtitle")}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/60 bg-card/50 p-6 transition-all hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function VideoSection() {
  const { t } = useI18n()
  
  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{t("video.title")}</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t("video.subtitle")}
          </p>
        </div>
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl shadow-primary/5">
            <div className="relative aspect-video bg-gradient-to-br from-secondary via-card to-secondary">
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30">
                  <Play className="h-8 w-8 pl-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const { t } = useI18n()
  
  const plans = [
    {
      name: t("pricing.starter"),
      price: "$29",
      period: t("pricing.perMonth"),
      description: t("pricing.starterDesc"),
      features: [
        t("pricing.feature.generations100"),
        t("pricing.feature.720p"),
        t("pricing.feature.basicTemplates"),
        t("pricing.feature.emailSupport"),
      ],
      cta: t("pricing.startTrial"),
      highlighted: false,
    },
    {
      name: t("pricing.pro"),
      price: "$99",
      period: t("pricing.perMonth"),
      description: t("pricing.proDesc"),
      features: [
        t("pricing.feature.unlimitedGen"),
        t("pricing.feature.4k"),
        t("pricing.feature.allTemplates"),
        t("pricing.feature.prioritySupport"),
        t("pricing.feature.apiAccess"),
      ],
      cta: t("pricing.getStarted"),
      highlighted: true,
    },
    {
      name: t("pricing.enterprise"),
      price: t("pricing.custom"),
      period: "",
      description: t("pricing.enterpriseDesc"),
      features: [
        t("pricing.feature.everythingPro"),
        t("pricing.feature.customModels"),
        t("pricing.feature.dedicatedSupport"),
        t("pricing.feature.sla"),
        t("pricing.feature.onPremise"),
      ],
      cta: t("pricing.contactSales"),
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{t("pricing.title")}</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t("pricing.subtitle")}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-8 transition-all ${
                plan.highlighted
                  ? "border-primary/50 bg-gradient-to-b from-primary/10 to-card shadow-lg shadow-primary/10"
                  : "border-border/60 bg-card/50 hover:border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button
                  className={`w-full ${plan.highlighted ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const { t } = useI18n()
  
  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-12 text-center md:p-20">
          <div className="absolute left-0 top-0 h-[300px] w-[300px] rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[200px] w-[200px] rounded-full bg-accent/20 blur-[80px]" />
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
              {t("cta.subtitle")}
            </p>
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90">
                {t("cta.button")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useI18n()
  
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Film className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">ScenePilotix</span>
          </div>
          <nav className="flex gap-6">
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.pricing")}
            </Link>
            <Link href="/templates" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.templates")}
            </Link>
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("footer.docs")}
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            © 2026 ScenePilotix. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <VideoSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
