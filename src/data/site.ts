// Single source of truth for regulatory identifiers, contact details, nav,
// and configurable integrations. Components and pages must read from here —
// never hardcode ARN/EUIN/phone/email/commission figures inline.
// See docs/wiki/regulatory-compliance.md for provenance of every value below.

export const distributor = {
  name: 'Abhijit Sinha',
  arn: 'ARN-367596',
  euin: 'E703717',
  certification: 'NISM Series V-A Certified',
  officeCity: 'Navi Mumbai',
  email: 'support@abhijitsinha.in',
  phone: '+91-8976539234',
  phoneHref: 'tel:+918976539234',
  whatsappNumber: '918976539234', // country code, no '+' or separators
  // Confirmed against Important Docs/ARN Registration.pdf ("ARN Validity 11-AUG-2026 to 01-JUL-2029").
  arnValidity: '11/08/2026 to 01/07/2029',
  linkedin: 'https://www.linkedin.com/in/abhijit-sinha-243b7243/',
} as const;

// Further mailboxes referenced in the original specs but not yet provisioned
// on the domain. Everything routes to distributor.email until these exist.
// (support@abhijitsinha.in is live and is distributor.email.)
export const plannedMailboxes = {
  contact: 'contact@abhijitsinha.in',
  compliance: 'compliance@abhijitsinha.in',
} as const;

export const statutory = {
  riskWarning:
    'Mutual fund investments are subject to market risks, read all scheme related documents carefully.',
  regularPlanNotice:
    'All mutual fund transactions are executed in Regular Plans. Distribution commissions are received directly from Asset Management Companies as per statutory limits.',
  distributorDisclaimer:
    'Abhijit Sinha is an AMFI-registered Mutual Fund Distributor (ARN-367596). Content on this website is for educational and distribution purposes only.',
} as const;

export type NavItem = { label: string; href: string };

export const nav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Knowledge Corner', href: '/knowledge-corner' },
  { label: 'Disclosures', href: '/disclosures' },
  { label: 'Investor Services', href: '/investor-services' },
];

export const primaryCta: NavItem = { label: 'Schedule a Meeting', href: '/schedule' };

export const footerQuickLinks: NavItem[] = [
  ...nav,
  primaryCta,
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Use', href: '/terms' },
];

export const redressalLinks = [
  { label: 'CAMS Online', href: 'https://mycams.camsonline.com' },
  { label: 'KFintech', href: 'https://mfs.kfintech.com/investor' },
  { label: 'SEBI SCORES 2.0', href: 'https://scores.sebi.gov.in/' },
] as const;

// Scheduler is deliberately provider-agnostic: the specs mention Cal.com /
// Calendly, but Abhijit may end up on Google Calendar Appointment Schedules
// instead. Swapping providers is only ever this one config edit — see
// src/components/SchedulerEmbed.astro and docs/wiki/page-schedule.md.
export type SchedulerProvider = 'cal' | 'calendly' | 'google' | 'none';
export const scheduler: { provider: SchedulerProvider; url: string } = {
  provider: 'none',
  url: '',
};

export type RtaPortalRow = {
  provider: string;
  coveredAmcs: string;
  portalLabel: string;
  portalUrl: string;
  services: string;
};

export const rtaPortals: RtaPortalRow[] = [
  {
    provider: 'CAMS (Computer Age Management Services)',
    coveredAmcs: 'HDFC, ICICI Prudential, SBI, Aditya Birla Sun Life, Kotak, DSP, and others',
    portalLabel: 'mycams.camsonline.com',
    portalUrl: 'https://mycams.camsonline.com',
    services: 'Instant CAS, Nominee Update, Bank Change, SIP Pause',
  },
  {
    provider: 'KFintech (KFin Technologies)',
    coveredAmcs: 'Axis, Nippon India, UTI, Mirae Asset, Bandhan, Invesco, and others',
    portalLabel: 'mfs.kfintech.com/investor',
    portalUrl: 'https://mfs.kfintech.com/investor',
    services: 'e-CAS Download, Capital Gains Statement, Folio Consolidation',
  },
  {
    provider: 'MF Central (Unified Platform)',
    coveredAmcs: 'All AMCs combined (Joint initiative of CAMS & KFintech)',
    portalLabel: 'mfcentral.com',
    portalUrl: 'https://mfcentral.com',
    services: 'Unified portfolio view, non-commercial service requests',
  },
  {
    provider: 'DigiLocker / Depository CAS',
    coveredAmcs: 'NSDL / CDSL Consolidated Statement Portals',
    portalLabel: 'nsdl.co.in / cdslindia.com',
    portalUrl: 'https://nsdl.co.in',
    services: 'Demat and Mutual Fund combined statement',
  },
];

export type CommissionRow = {
  assetClass: string;
  subCategories: string;
  year1: string;
  year2Plus: string;
};

// Sourced from the Aug–Sep 2026 AMC brokerage rate cards held in
// `Important Docs/Commission Structure/` (Nippon India, ICICI Prudential, DSP,
// WhiteOak Capital). Those PDFs are sensitive and are never committed — see
// CLAUDE.md. Figures are BASE trail commission per annum, EXCLUDING GST, taken
// as the min/max across every scheme row in all four cards, with the minimum
// rounded down and the maximum rounded up to 2 d.p. so the published range
// always encloses the actual rates. Re-derive when new rate cards arrive.
export const commissionSchedule: CommissionRow[] = [
  {
    assetClass: 'Equity Schemes',
    subCategories:
      'Large Cap, Large & Mid Cap, Mid Cap, Small Cap, Multi Cap, Flexi Cap, Focused, Value, Quant, ELSS, Sectoral & Thematic',
    year1: '0.25% - 1.25%',
    year2Plus: '0.24% - 1.17%',
  },
  {
    assetClass: 'Hybrid Schemes',
    subCategories:
      'Aggressive Hybrid, Balanced Advantage / Dynamic Asset Allocation, Multi-Asset Allocation, Equity Savings, Conservative Hybrid, Arbitrage',
    year1: '0.25% - 1.15%',
    year2Plus: '0.25% - 1.07%',
  },
  {
    assetClass: 'Solution-Oriented Schemes',
    subCategories: "Retirement funds and Children's funds (lock-in applies)",
    year1: '0.55% - 1.11%',
    year2Plus: '0.55% - 1.11%',
  },
  {
    assetClass: 'Debt & Fixed Income',
    subCategories:
      'Corporate Bond, Banking & PSU, Credit Risk, Short / Medium / Long Duration, Gilt, Dynamic Bond, Floater',
    year1: '0.12% - 0.81%',
    year2Plus: '0.12% - 0.76%',
  },
  {
    assetClass: 'Liquid & Cash Management',
    subCategories: 'Overnight, Liquid, Money Market, Ultra Short Duration, Low Duration',
    year1: '0.03% - 0.55%',
    year2Plus: '0.03% - 0.55%',
  },
  {
    assetClass: 'Passive, Index & Fund-of-Funds',
    subCategories:
      'Index Funds, ETF Fund-of-Funds, Gold & Silver FoFs, Overseas and Multi-Asset Fund-of-Funds',
    year1: '0.03% - 0.85%',
    year2Plus: '0.03% - 0.85%',
  },
];

// The period the published commission ranges above were derived from. Shown on
// /disclosures so a visitor can see how current the figures are.
export const commissionPeriod = '1 August 2026 to 30 September 2026';

// AMCs Abhijit is currently empanelled with, shown in the footer.
//
// Logos are reproduced unaltered, on a white tile, with the AMC name as alt
// text — every one of these marks is dark artwork drawn for a light background
// and would be unreadable placed directly on the navy footer. The footer states
// that empanelment is a distribution arrangement, not an endorsement; keep that
// line whenever these are displayed.
//
// The PNGs in public/images/amc/ are trimmed to the mark's own bounds (the
// ICICI source shipped as a 180x180 canvas that was only 41% logo, which made
// it render visually half the size of the others no matter what CSS said).
// `maxH` then balances the remaining spread of true aspect ratios — 2.05:1 to
// 4.96:1 — so all four occupy a similar area, because the eye compares area,
// not height.
export type AmcPartner = { name: string; logo: string; maxH: string };

export const empanelledAmcs: AmcPartner[] = [
  // 2.54:1
  { name: 'Nippon India Mutual Fund', logo: 'images/amc/nippon-india.png', maxH: 'max-h-11' },
  // 2.05:1 — the most compact mark, so it gets the most height
  { name: 'ICICI Prudential Mutual Fund', logo: 'images/amc/icici-prudential.png', maxH: 'max-h-12' },
  // 4.96:1 — width-limited by the tile in practice
  { name: 'DSP Mutual Fund', logo: 'images/amc/dsp.png', maxH: 'max-h-9' },
  // 4.42:1
  { name: 'WhiteOak Capital Mutual Fund', logo: 'images/amc/whiteoak-capital.png', maxH: 'max-h-9' },
];

export const site = {
  distributor,
  plannedMailboxes,
  statutory,
  nav,
  primaryCta,
  footerQuickLinks,
  redressalLinks,
  scheduler,
  rtaPortals,
  commissionSchedule,
  commissionPeriod,
  empanelledAmcs,
  // POST endpoint for the contact forms — the Supabase `submit-lead` edge
  // function. Set PUBLIC_FORM_ENDPOINT in .env (see .env.example). When empty,
  // ContactForm.astro renders in a disabled/informational state.
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT ?? '',

  // POST endpoint for the first-party analytics beacon — the Supabase `track`
  // edge function. When empty, src/scripts/analytics.ts no-ops entirely and
  // makes no network request at all.
  analyticsEndpoint: import.meta.env.PUBLIC_ANALYTICS_ENDPOINT ?? '',

  // Supabase connection for the /admin dashboard and the build-time content
  // fetch. Both values are public by design — Row Level Security is what
  // protects the data, and every admin table is gated on the caller's email
  // appearing in the `admin_allowlist` table. The service_role key must NEVER
  // appear in this file or anywhere else under src/ or public/.
  supabase: {
    url: import.meta.env.PUBLIC_SUPABASE_URL ?? '',
    anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};

export default site;
