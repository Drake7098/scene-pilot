"use client"

import { CreditCard, Download, Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const currentPlan = {
  name: "Pro",
  price: "$99",
  period: "/month",
  features: [
    "Unlimited generations",
    "4K video export",
    "All templates",
    "Priority support",
    "API access",
    "Custom style training",
  ],
  nextBilling: "April 23, 2026",
}

const invoices = [
  { id: "INV-001", date: "Mar 23, 2026", amount: "$99.00", status: "Paid" },
  { id: "INV-002", date: "Feb 23, 2026", amount: "$99.00", status: "Paid" },
  { id: "INV-003", date: "Jan 23, 2026", amount: "$99.00", status: "Paid" },
  { id: "INV-004", date: "Dec 23, 2025", amount: "$99.00", status: "Paid" },
]

const plans = [
  {
    name: "Starter",
    price: "$29",
    current: false,
  },
  {
    name: "Pro",
    price: "$99",
    current: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    current: false,
  },
]

export default function BillingPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and billing information</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Current Plan */}
          <div className="rounded-lg border border-border/60 bg-card/50 p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-lg font-medium">Current Plan</h2>
                  <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
                    Active
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your next billing date is {currentPlan.nextBilling}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold">{currentPlan.price}</div>
                <div className="text-sm text-muted-foreground">{currentPlan.period}</div>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              {currentPlan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline">Change Plan</Button>
              <Button variant="ghost" className="text-muted-foreground">
                Cancel Subscription
              </Button>
            </div>
          </div>

          {/* Plan Comparison */}
          <div className="rounded-lg border border-border/60 bg-card/50 p-6">
            <h2 className="mb-4 text-lg font-medium">Compare Plans</h2>
            <div className="grid grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-lg border p-4 ${
                    plan.current ? "border-foreground/20 bg-card" : "border-border/60 bg-card/30"
                  }`}
                >
                  <div className="mb-2 text-sm font-medium">{plan.name}</div>
                  <div className="mb-4">
                    <span className="text-2xl font-semibold">{plan.price}</span>
                    {plan.price !== "Custom" && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {plan.current ? (
                    <Button disabled className="w-full" variant="outline" size="sm">
                      Current Plan
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" size="sm">
                      {plan.price === "Custom" ? "Contact Sales" : "Switch"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invoices */}
          <div className="rounded-lg border border-border/60 bg-card/50 p-6">
            <h2 className="mb-4 text-lg font-medium">Billing History</h2>
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-input/30 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{invoice.id}</div>
                      <div className="text-xs text-muted-foreground">{invoice.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{invoice.amount}</span>
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                      {invoice.status}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Method */}
          <div className="rounded-lg border border-border/60 bg-card/50 p-6">
            <h2 className="mb-4 text-sm font-medium">Payment Method</h2>
            <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-input/30 p-3">
              <div className="flex h-10 w-14 items-center justify-center rounded bg-foreground text-xs font-bold text-background">
                VISA
              </div>
              <div>
                <div className="text-sm font-medium">•••• •••• •••• 4242</div>
                <div className="text-xs text-muted-foreground">Expires 12/28</div>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full" size="sm">
              Update Payment Method
            </Button>
          </div>

          {/* Usage This Month */}
          <div className="rounded-lg border border-border/60 bg-card/50 p-6">
            <h2 className="mb-4 text-sm font-medium">Usage This Month</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Generations</span>
                  <span className="font-medium">156 / Unlimited</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-1/3 rounded-full bg-accent" />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Storage Used</span>
                  <span className="font-medium">4.2 GB / 50 GB</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-[8%] rounded-full bg-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Need More? */}
          <div className="rounded-lg border border-border/60 bg-card/50 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <Zap className="h-5 w-5 text-foreground" />
            </div>
            <h2 className="mb-2 text-sm font-medium">Need More Credits?</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Purchase additional credits without changing your plan.
            </p>
            <Button variant="outline" className="w-full" size="sm">
              Buy Credits
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
