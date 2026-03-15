# Billing Regression Checklist

Last updated: 2026-03-15

## 1. Free template

- [ ] Apply free template
- [ ] No credits deducted
- [ ] May log use, but credits unchanged

## 2. Standard template first use

- [ ] cost = 3
- [ ] Balance decreases by 3
- [ ] `project.meta.billing.appliedTemplateCharges` has record
- [ ] `billingTransactions` has entry

## 3. Same template in same project again

- [ ] No repeat charge
- [ ] UI shows "当前项目已使用，不重复扣费"

## 4. Same template in new project

- [ ] Charged again
- [ ] Balance decreases

## 5. Premium template

- [ ] cost = 5
- [ ] If insufficient balance, block apply and show modal
- [ ] Modal has "购买 Credits" to open billing

## 6. Refresh persistence

- [ ] Template already charged in current project
- [ ] After refresh, still shows "当前项目已使用，不重复扣费"
- [ ] No second charge

## 7. applyMode

- [ ] layout_only / layout_plus_style / full_workflow
- [ ] Same template in same project = no repeat charge for any mode
- [ ] Cost same for all modes

## 8. Generation charge (reserved)

- [ ] `estimateGenerationCost` returns a number
- [ ] Not wired to real generation
- [ ] Template flow unchanged
