# Haulage AI - PRD

## Original problem statement
AI-native logistics operating system for Indian freight. Two parts: (A) 28-page marketing website, (B) logged-in dashboard demo at /app with seeded mock data. Seven modules: Back-Office Automation, Voice AI (Hindi/Gujarati), Freight & Capacity Matching, Warehouse Vision, Compliance & Finance, Control Tower, Reverse Logistics. Multi-prompt build (6 prompts). Direct, operations-focused voice; India-aware (Mumbai, Delhi, Bhiwandi, Narela, GST, e-way bill, LR, POD, WhatsApp); all metrics/testimonials/logos visibly labeled "Placeholder".

## Stack & architecture
- React 19 + react-router-dom 7 + Tailwind + shadcn/ui + lucide-react (frontend, port 3000)
- FastAPI + Motor/MongoDB (backend, port 8001, /api prefix)
- Single theme source: /app/frontend/src/index.css (CSS variables, light + .dark) + tailwind.config.js mappings; darkMode "class"; theme init script in public/index.html applies saved/system theme before first paint (localStorage key: haulage-theme)
- Shared components: /app/frontend/src/components/site/ (ui.jsx, blocks.jsx, mockups.jsx, Navbar.jsx, Footer.jsx, Logo.jsx) + /app/frontend/src/components/SiteLayout.jsx
- Typed content: /app/frontend/src/content/site.js (modules, roles, nav, footer, FAQs, metrics, testimonials)
- Demo auth: /app/frontend/src/auth.jsx (sessionStorage, any email/password, role switcher); NOT real auth per spec

## User personas
- Transporters & Fleet Owners, Shippers & Brands, 3PLs & Warehouses, Finance Teams (marketing audiences)
- Dashboard roles: Ops Manager, Dispatcher, Warehouse Lead, Finance, Owner

## Core requirements (static)
- 28 routes listed in spec + /app dashboard; unique title + meta description per page
- Identical Navbar/Footer on every marketing page; 3 exact status tags (Handled by AI / Needs approval / Needs a human) identical everywhere
- Dark mode from the start, WCAG AA contrast both themes, borders instead of shadows in dark
- Buttons: primary "Book a Demo" (/contact), secondary "See it in action"; page-specific labels as spec'd
- No real third-party integrations unless a later prompt says so

## Implemented (2026-06, Prompt 1)
- Theme file + design tokens (light/dark), ThemeToggle, before-paint script
- All shared components incl. StatusTag, MockupCard, ControlTower/VoiceAI/PlatformDiagram mockups (styled divs), FeatureBlock, MetricsBand, FaqAccordion, RoleTabs, etc.
- Navbar + Footer wired to all routes; routing skeleton: unbuilt pages render "Coming next" in real layout
- Pages: Home (/), Product overview (/product), Contact/Book a Demo (/contact, /book-a-demo), Login (/login)
- Contact form -> POST /api/contact -> MongoDB contact_submissions (name, work_email, phone, company, role, monthly_volume, challenges, language, message, consent, created_at); validation + success state w/ calendar embed placeholder; no email sending (by spec)
- /app dashboard shell: guarded by demo auth, role switcher, theme toggle, KPI cards + exceptions table with StatusTags (mock data)
- /app/memory/test_credentials.md updated

## Implemented (2026-06, Prompt 2)
- One reusable ModulePage template (/src/pages/ModulePage.jsx) fed by 7 typed content objects in /src/content/modules.js; route /product/:slug (unknown slug redirects to /product)
- Template sections: Hero, IntegrationStrip (per-module logos), ProblemCards, StepRow, optional extra, 4 alternating FeatureBlocks, BeforeAfterTable, MetricsBand, CaseTeaserCard, TrustBlock, Testimonial, FaqAccordion (6), RelatedModules (3), FinalCtaBanner
- 35 compact styled-div mockups in /src/components/site/moduleMockups.jsx (keyed MODULE_MOCKUPS) with the 3 status tags
- Voice AI extra: language band with native Hindi/Gujarati script + English translations, "pending native-speaker review" note, language chips
- blocks.jsx extended: IntegrationStrip(logos,caption), CaseTeaserCard(copy,ctaLabel), TrustBlock(heading,points), RelatedModules(slugs); Container spreads rest props (testids)
- Testing agent iteration_2: frontend 100%, all sections/tags/routes verified, dark mode + mobile OK

## Backlog (next prompts)
- P0: Role/solutions pages template (Prompt 3)
- P1: How It Works, Case Study, Integrations, Trust & Security, Pricing, About, Resources hub, Blog index+article, ROI Calculator, Guides, Legal pages
- P2: Full dashboard demo with seeded mock data per module
