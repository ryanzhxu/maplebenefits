# Canadian Benefits Eligibility Checker — Claude Code Prompt

## Project Vision

Build a web app where Canadian residents can discover, assess eligibility for, and learn how to apply for government benefits. The core experience is a guided workflow: users answer questions about their situation, and the app tells them exactly which benefits they qualify for, estimated amounts, and step-by-step application instructions.

This is NOT a chatbot — it's a deterministic, rule-based eligibility engine with structured UI flows. All logic runs client-side. No AI API calls. No backend for MVP.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State management:** React state / Zustand for the assessment workflow
- **Data:** Structured TypeScript files (no database for MVP)
- **Deployment target:** Vercel
- **No backend / no database / no auth for MVP**

---

## Architecture

### Data Model

All benefits data is defined as TypeScript objects in `/src/data/benefits/`. Each benefit has:

```typescript
interface Benefit {
  id: string;                          // e.g., "dtc", "ccb", "safer"
  name: string;                        // e.g., "Disability Tax Credit"
  shortName: string;                   // e.g., "DTC"
  category: BenefitCategory;           // "disability" | "seniors" | "family" | "housing" | "health" | "income-support" | "tax-credits"
  level: "federal" | "provincial-bc";
  description: string;                 // 2-3 sentence plain-language description
  estimatedValue: string;              // e.g., "Up to $1,900/year in tax savings" or formula-based
  eligibilityCriteria: EligibilityRule[];  // the decision tree
  applicationSteps: ApplicationStep[];
  requiredDocuments: string[];
  applicationUrl?: string;             // direct link to official form/portal
  officialInfoUrl: string;             // link to government info page
  processingTime?: string;             // e.g., "6-8 weeks"
  paymentFrequency?: string;           // e.g., "Monthly", "Quarterly", "Annual tax credit"
  tags: string[];                      // for search: ["disability", "hearing", "vision", "walking"]
  relatedBenefits: string[];           // IDs of benefits that are often applied for together
  lastUpdated: string;                 // ISO date — when this benefit's data was last verified
}

interface EligibilityRule {
  id: string;
  question: string;                    // plain-language question shown to user
  helpText?: string;                   // additional context shown below the question
  inputType: "yes-no" | "number" | "select" | "multi-select" | "date" | "text";
  options?: { value: string; label: string }[];  // for select/multi-select
  evaluate: (answer: any, context: AssessmentContext) => "eligible" | "ineligible" | "continue" | "maybe";
  weight?: number;                     // for "maybe" results — how strong is this signal
  skipIf?: (context: AssessmentContext) => boolean;  // skip this question if already answered via shared context
  disqualifyMessage?: string;          // shown if this rule makes them ineligible
}

interface ApplicationStep {
  order: number;
  title: string;                       // e.g., "Download Form T2201"
  description: string;                 // detailed instructions
  actionUrl?: string;                  // link to form/portal
  tips?: string[];                     // practical tips from real experience
  estimatedTime?: string;              // e.g., "10 minutes", "Requires doctor visit"
}

interface AssessmentContext {
  // Shared answers across all benefit assessments — ask once, reuse everywhere
  age?: number;
  dateOfBirth?: string;
  residency: "citizen" | "pr" | "refugee" | "work-permit" | "student" | "other";
  province: string;                    // "BC" for MVP, expandable later
  yearsInCanada?: number;
  yearsInProvince?: number;
  maritalStatus: "single" | "married" | "common-law" | "separated" | "divorced" | "widowed";
  hasChildren: boolean;
  numberOfChildren?: number;
  childrenAges?: number[];
  employmentStatus: "employed" | "self-employed" | "unemployed" | "retired" | "unable-to-work";
  annualIncome?: number;
  familyIncome?: number;
  hasDisability: boolean;
  disabilityTypes?: ("vision" | "hearing" | "walking" | "mental" | "speaking" | "feeding" | "dressing" | "eliminating" | "life-sustaining-therapy")[];
  hasDTC?: boolean;
  isHomeowner: boolean;
  monthlyRent?: number;
  rentAsPercentOfIncome?: number;
  hasPrivateDentalInsurance: boolean;
  hasPrivateHealthInsurance: boolean;
  receivesProvincialAssistance: boolean;
  // ... extensible as needed
}
```

### Benefits to Include (MVP Scope — Federal + BC)

**Federal:**
1. Disability Tax Credit (DTC) — Form T2201
2. Canada Disability Benefit (CDB)
3. Canada Child Benefit (CCB) + Child Disability Benefit
4. Canada Caregiver Credit (CCC)
5. Canada Groceries and Essentials Benefit (CGEB, formerly GST/HST credit)
6. Canadian Dental Care Plan (CDCP)
7. CPP Disability Benefit (CPP-D)
8. CPP Retirement Pension
9. Old Age Security (OAS)
10. Guaranteed Income Supplement (GIS)
11. Employment Insurance (EI) — Regular + Sickness
12. Canada Workers Benefit (CWB)
13. Registered Disability Savings Plan (RDSP)
14. Medical Expense Tax Credit
15. Eligible Dependant Amount (Line 30400)
16. Canada Carbon Rebate

**BC Provincial:**
17. BC Persons with Disabilities (PWD) Assistance
18. BC Income Assistance
19. Fair PharmaCare
20. MSP Supplementary Benefits
21. Shelter Aid for Elderly Renters (SAFER)
22. BC Housing Registry (subsidized housing)
23. BC Rental Assistance Program (RAP)
24. BC Seniors Supplement
25. BC Bus Pass Program (for PWD recipients)
26. BC Homeowner Grant
27. WorkBC Assistive Technology Services
28. BC Family Benefit
29. BC Climate Action Tax Credit (verify current status — may have been cancelled)

---

## User Flows

### Flow 1: Browse Benefits (Informational)
```
Home → Browse by Category (Disability / Seniors / Family / Housing / Health / Income Support / Tax Credits)
  → Benefit Detail Page (description, eligibility summary, estimated value, how to apply, required documents, processing time, official links)
```

### Flow 2: Single Benefit Eligibility Check
```
Benefit Detail Page → "Check if I qualify" button
  → Guided Q&A (3-10 questions specific to this benefit)
  → Result: Eligible ✅ / Not Eligible ❌ / Possibly Eligible ⚠️ (with explanation)
  → If eligible: Show application steps + required documents + direct links
```

### Flow 3: Full Assessment (the flagship feature)
```
Home → "Find all benefits I qualify for" button
  → Intake questionnaire (15-25 questions covering demographics, income, disability, housing, family)
  → The engine evaluates ALL benefits against the shared context
  → Results dashboard: list of benefits they likely qualify for, sorted by estimated value
  → Each result expandable to show: why they qualify, estimated amount, and step-by-step application instructions
  → Option to generate a printable action plan (summary of all benefits + steps)
```

### Flow 4: "I'm helping someone" mode
```
Same as Flow 3, but framed as: "I'm helping a family member"
  → Adjusts language: "Does the person you're helping have..." instead of "Do you have..."
  → At the end, also shows benefits the HELPER can claim (e.g., DTC transfer, CCC, Medical Expense Credit)
```

---

## Pages

1. **`/`** — Landing page. Hero with value prop. Two CTAs: "Browse Benefits" and "Find What You Qualify For". Stats (e.g., "Covering 29 federal and BC benefits").
2. **`/benefits`** — Browse all benefits. Filter by category, level (federal/provincial), tags. Search. Card grid layout.
3. **`/benefits/[id]`** — Benefit detail page. Full info + "Check if I qualify" button.
4. **`/assess`** — Full assessment flow. Step-by-step questionnaire → results dashboard.
5. **`/assess/results`** — Results page showing all matched benefits with action plans.
6. **`/about`** — Disclaimer (not legal/financial advice), data sources, last updated dates.

---

## UI/UX Guidelines

- **Language:** Plain, approachable Canadian English. No jargon. Explain acronyms on first use.
- **Tone:** Helpful and encouraging, not bureaucratic. "You likely qualify" not "Eligibility criteria met."
- **Accessibility:** WCAG 2.1 AA minimum. Screen reader friendly. Keyboard navigable.
- **Mobile-first:** Many users will be on phones. The assessment flow must work well on small screens.
- **Progress indicator:** Show assessment progress (Step 3 of 12) during the questionnaire.
- **Skip logic:** If a question is irrelevant based on prior answers, skip it automatically. Don't ask seniors about child benefits. Don't ask homeowners about rental assistance.
- **Help text:** Every question should have an optional "What does this mean?" expandable explanation.
- **Bilingual consideration:** Structure text so that French translation can be added later (externalize strings). Don't hard-code English strings in components.
- **Trust signals:** Show "Last verified: [date]" on each benefit. Link to official government sources. Clear disclaimer that this is informational, not legal advice.

---

## Design Direction

- Clean, modern, trustworthy — think gov.uk meets Linear
- Color palette: Blues and whites for trust. Green for "eligible" results. Amber for "maybe". Red/gray for "not eligible."
- Typography: System font stack or Inter. Readable at all sizes.
- Cards for benefits. Stepper/wizard for the assessment flow.
- No decorative clutter. Every element serves a purpose.

---

## Implementation Plan

### Phase 1: Foundation (start here)
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up the data model (types, interfaces)
3. Create 5 benefits as seed data with full eligibility rules and application steps:
   - DTC, CGEB, CDCP, SAFER, CCB (mix of federal and BC, different categories)
4. Build the Browse Benefits page (`/benefits`) with category filters
5. Build the Benefit Detail page (`/benefits/[id]`)

### Phase 2: Single Benefit Eligibility
6. Build the eligibility question flow component (reusable stepper/wizard)
7. Implement the rule evaluation engine
8. Wire up "Check if I qualify" on benefit detail pages
9. Build the result display (eligible/ineligible/maybe with explanation)

### Phase 3: Full Assessment
10. Design the shared assessment context and intake questionnaire
11. Build the full assessment flow (`/assess`)
12. Implement cross-benefit evaluation (run all benefit rules against shared context)
13. Build the results dashboard with matched benefits sorted by value
14. Add printable action plan generation

### Phase 4: Complete Benefits Data
15. Add all remaining federal benefits (CDB, PWD, CPP-D, OAS, GIS, CCC, etc.)
16. Add all remaining BC provincial benefits
17. Cross-reference related benefits (e.g., DTC unlocks CDB, RDSP, PWD shortcut)
18. Add "I'm helping someone" mode

### Phase 5: Polish
19. Landing page
20. About/disclaimer page
21. SEO optimization (meta tags, structured data for each benefit)
22. Mobile optimization pass
23. Accessibility audit
24. Performance optimization

---

## Key Technical Decisions

- **Rule engine:** Pure functions. Each benefit's eligibility is a function that takes `AssessmentContext` and returns `{ eligible: boolean; confidence: "definite" | "likely" | "possible"; reason: string; estimatedAmount?: string }`. No side effects. Easy to test.
- **Shared context:** The full assessment collects answers once. Individual benefit checks can also build a partial context. The rule engine works with whatever context is available and marks results as "need more info" when a required field is missing.
- **Benefit dependencies:** Some benefits gate others (DTC → CDB, DTC → RDSP, PWD → BC Bus Pass). Model this as `prerequisites: string[]` on each benefit. The results page shows the dependency chain: "Apply for DTC first — it unlocks 3 more benefits."
- **Amount estimation:** Where possible, compute estimated amounts from user inputs (income-tested benefits like CCB, CGEB). Where not possible (e.g., CPP-D depends on contribution history), show a range.
- **Data freshness:** Each benefit has a `lastUpdated` date. Show a warning banner if data is older than 6 months. Link to official source for verification.

---

## Constraints

- All eligibility logic must be auditable — no black boxes. Users should be able to see WHY they qualified or didn't.
- Never store personal information. All assessment data stays in the browser session. No cookies, no analytics tracking of answers.
- Always link to official government sources. Never present this app as authoritative over the government.
- Include a persistent disclaimer: "This tool provides general guidance only. It is not legal, financial, or tax advice. Always verify with the relevant government agency."

---

## Example: How a Benefit's Eligibility Rules Work

Here's how the SAFER benefit would be modeled:

```typescript
const safer: Benefit = {
  id: "safer",
  name: "Shelter Aid for Elderly Renters",
  shortName: "SAFER",
  category: "housing",
  level: "provincial-bc",
  description: "Monthly cash payments to help BC seniors aged 60+ with low to moderate incomes afford their rent.",
  estimatedValue: "Varies — use BC Housing SAFER calculator for estimate",
  eligibilityCriteria: [
    {
      id: "safer-age",
      question: "Are you 60 years of age or older?",
      inputType: "yes-no",
      evaluate: (answer) => answer === "yes" ? "continue" : "ineligible",
      disqualifyMessage: "SAFER is available to BC residents aged 60 and older.",
    },
    {
      id: "safer-bc-residency",
      question: "Have you lived in British Columbia for the full 12 months before today?",
      inputType: "yes-no",
      evaluate: (answer) => answer === "yes" ? "continue" : "ineligible",
      disqualifyMessage: "You must have lived in BC for 12 continuous months to qualify.",
      skipIf: (ctx) => ctx.yearsInProvince !== undefined && ctx.yearsInProvince >= 1,
    },
    {
      id: "safer-rent-ratio",
      question: "Do you pay more than 30% of your gross monthly income toward rent?",
      helpText: "For example, if your monthly income is $2,000 and your rent is $700 or more, you pay more than 30%.",
      inputType: "yes-no",
      evaluate: (answer) => answer === "yes" ? "continue" : "ineligible",
      disqualifyMessage: "SAFER helps renters who pay more than 30% of their income toward rent.",
      skipIf: (ctx) => {
        if (ctx.monthlyRent && ctx.annualIncome) {
          const monthlyIncome = ctx.annualIncome / 12;
          return ctx.monthlyRent / monthlyIncome > 0.3;
        }
        return false;
      },
    },
    {
      id: "safer-income-cap",
      question: "Is your gross monthly household income less than $3,333?",
      helpText: "That's about $40,000 per year before taxes.",
      inputType: "yes-no",
      evaluate: (answer) => answer === "yes" ? "continue" : "ineligible",
      disqualifyMessage: "SAFER is for households with gross income under $40,000/year.",
      skipIf: (ctx) => ctx.annualIncome !== undefined && ctx.annualIncome < 40000,
    },
    {
      id: "safer-no-provincial-assistance",
      question: "Do you currently receive BC income assistance or disability assistance (PWD)?",
      helpText: "This includes payments through the BC Employment and Assistance Act.",
      inputType: "yes-no",
      evaluate: (answer) => answer === "no" ? "eligible" : "ineligible",
      disqualifyMessage: "SAFER is not available to people already receiving BC income or disability assistance.",
      skipIf: (ctx) => ctx.receivesProvincialAssistance === false,
    },
  ],
  applicationSteps: [
    {
      order: 1,
      title: "Download the SAFER application form",
      description: "Get form HOU-035 from the BC Housing website.",
      actionUrl: "https://www.bchousing.org/publications/SAFER-Application-Form.pdf",
      estimatedTime: "2 minutes",
    },
    {
      order: 2,
      title: "Gather supporting documents",
      description: "You'll need: proof of age (passport, birth certificate, or PR card), proof of rent (tenancy agreement or rent receipt), income tax information (Notice of Assessment or consent for CRA release), and banking info for direct deposit (void cheque).",
      estimatedTime: "30 minutes",
    },
    {
      order: 3,
      title: "Complete and sign the form",
      description: "Fill out all sections. For income verification, we recommend checking Option 1 (Consent Granted) so CRA sends your info directly to BC Housing — saves you from attaching tax documents.",
      estimatedTime: "20 minutes",
    },
    {
      order: 4,
      title: "Submit your application",
      description: "Upload via bchousing.org/PUF, mail to 101-4555 Kingsway, Burnaby BC V5H 4V8, or fax to 604-439-4729.",
      actionUrl: "https://www.bchousing.org/puf",
      tips: [
        "Incomplete applications are held for up to 90 days then cancelled — submit everything at once.",
        "Benefits start from the first of the month your application is received, so submit early in the month.",
        "You must reapply every year to continue receiving SAFER.",
      ],
    },
  ],
  requiredDocuments: [
    "Proof of age and status (passport, PR card, or birth certificate)",
    "Proof of rent (tenancy agreement, rent receipt, or landlord declaration)",
    "Income tax info (CRA consent or Notice of Assessment + tax return)",
    "Direct deposit info (void cheque or bank preauthorized debit form)",
    "T5007 tax slip from BC Bus Pass Program (if applicable)",
  ],
  applicationUrl: "https://www.bchousing.org/publications/SAFER-Application-Form.pdf",
  officialInfoUrl: "https://www.bchousing.org/housing-assistance/rental-assistance-programs/SAFER",
  processingTime: "4-6 weeks after receiving complete application",
  paymentFrequency: "Monthly (last business day of each month)",
  tags: ["seniors", "housing", "rent", "60+", "low-income"],
  relatedBenefits: ["bc-housing-registry", "oas", "gis"],
  lastUpdated: "2026-08-31",
};
```

---

## Getting Started

1. `npx create-next-app@latest benefits-checker --typescript --tailwind --app --src-dir`
2. Start with Phase 1: data model + 5 seed benefits + browse page
3. Each benefit should be its own file in `/src/data/benefits/[id].ts`
4. Build the reusable eligibility stepper component early — it's the core UX
5. Test with real scenarios (use the family cases from this conversation as test cases)
