"use client"

import Link from "next/link"
import { Film, Check, ArrowRight } from "lucide-react"
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
            <Link href="/pricing" className="text-sm text-primary font-medium">
              {t("nav.pricing")}
            </Link>
            <Link href="/templates" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.templates")}
            </Link>
            <Link href="/#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
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

export default function PricingPage() {
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
        "Standard processing speed",
        "Community access",
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
        "Fast processing speed",
        t("pricing.feature.apiAccess"),
        "Custom style training",
        "Collaboration tools",
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
        "SSO & advanced security",
        "Custom integrations",
        "Volume discounts",
      ],
      cta: t("pricing.contactSales"),
      highlighted: false,
    },
  ]

  const faqs = [
    {
      question: "What happens when I exceed my generation limit?",
      answer:
        "You can purchase additional generation credits or upgrade to a higher tier. Your existing work will always remain accessible.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, you can cancel your subscription at any time. You will retain access until the end of your billing period.",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "We offer a 14-day money-back guarantee for all new subscriptions. Contact support for assistance.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, and wire transfer for Enterprise plans.",
    },
  ]

  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            {t("pricing.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("pricing.subtitle")}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-8 transition-all ${
                  plan.highlighted
                    ? "border-primary/50 bg-gradient-to-b from-primary/10 to-card shadow-lg shadow-primary/10"
                    : "border-border/60 bg-card/50 hover:border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                        <Check className="h-3 w-3 shrink-0 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    className={`w-full ${plan.highlighted ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight">
            FAQ
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-border/60 bg-card/50 p-6 transition-colors hover:bg-card">
                <h3 className="mb-2 font-semibold">{faq.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-12 text-center">
            <div className="absolute left-0 top-0 h-[200px] w-[200px] rounded-full bg-primary/20 blur-[80px]" />
            <div className="absolute bottom-0 right-0 h-[150px] w-[150px] rounded-full bg-accent/20 blur-[60px]" />
            <div className="relative">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
                Try ScenePilotix free for 14 days. No credit card required.
              </p>
              <Link href="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {t("pricing.startTrial")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Film className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold">ScenePilotix</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 ScenePilotix. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
