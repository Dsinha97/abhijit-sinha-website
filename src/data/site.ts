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
  provider: 'calendly',
  url: 'https://calendly.com/abhijitsinha-support/30min',
};

/** Structurally identical to DataTable's CellLink, so these rows drop straight
 *  into a table cell without the data layer importing from a component. */
export type PortalLink = { text: string; href: string };

export type RtaPortalRow = {
  provider: string;
  coveredAmcs: string;
  /** One or more destinations - the depository row legitimately has two. */
  portals: PortalLink[];
  services: string;
};

export const rtaPortals: RtaPortalRow[] = [
  {
    provider: 'CAMS (Computer Age Management Services)',
    coveredAmcs: 'HDFC, ICICI Prudential, SBI, Aditya Birla Sun Life, Kotak, DSP, and others',
    portals: [{ text: 'mycams.camsonline.com', href: 'https://mycams.camsonline.com' }],
    services: 'Instant CAS, Nominee Update, Bank Change, SIP Pause',
  },
  {
    provider: 'KFintech (KFin Technologies)',
    coveredAmcs: 'Axis, Nippon India, UTI, Mirae Asset, Bandhan, Invesco, and others',
    portals: [{ text: 'mfs.kfintech.com/investor', href: 'https://mfs.kfintech.com/investor' }],
    services: 'e-CAS Download, Capital Gains Statement, Folio Consolidation',
  },
  {
    provider: 'MF Central (Unified Platform)',
    coveredAmcs: 'All AMCs combined (Joint initiative of CAMS & KFintech)',
    portals: [{ text: 'mfcentral.com', href: 'https://mfcentral.com' }],
    services: 'Unified portfolio view, non-commercial service requests',
  },
  {
    provider: 'DigiLocker / Depository CAS',
    coveredAmcs: 'NSDL / CDSL Consolidated Statement Portals',
    portals: [
      { text: 'nsdl.co.in', href: 'https://nsdl.co.in' },
      { text: 'cdslindia.com', href: 'https://www.cdslindia.com' },
    ],
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
// `Important Docs/Commission Structure/`. Those PDFs are sensitive and are never
// committed — see CLAUDE.md. Figures are BASE trail commission per annum,
// EXCLUDING GST, taken as the min/max across every scheme row in all cards on
// file, with the minimum rounded down and the maximum rounded up to 2 d.p. so
// the published range always encloses the actual rates.
//
// These ranges cover `rateCardAmcs` ONLY — the six AMCs flagged
// `rateCardOnFile` below — NOT the full fourteen-AMC empanelment. Widening the
// list of AMCs named beside this table without first re-deriving the figures
// from their rate cards would make a statutory claim the documents do not
// support. Re-derive, then flip `rateCardOnFile`, when new rate cards arrive.
//
// Two things to know when re-deriving:
//   - quant publishes THREE AUM slabs (BASE Plus > 2 Cr, BASE 50 L–2 Cr, OPEN
//     < 50 L). The BASE Plus column is used here, being the highest, so the
//     range encloses whichever slab actually applies as AUM moves. quant trail
//     is perpetual, so its rates land in BOTH year columns.
//   - The quant card on file is dated 1–31 August 2026 and has lapsed; it needs
//     replacing with one covering the current `commissionPeriod`.
// `qsif_Long_Short_Funds_...pdf` in the same folder is deliberately EXCLUDED:
// SIFs are a separate SEBI product category, not mutual fund schemes, and this
// table's asset classes are mutual fund categories.
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
    year1: '0.25% - 1.16%',
    year2Plus: '0.25% - 1.16%',
  },
  {
    assetClass: 'Solution-Oriented Schemes',
    subCategories: "Retirement funds and Children's funds (lock-in applies)",
    year1: '0.51% - 1.11%',
    year2Plus: '0.51% - 1.11%',
  },
  {
    assetClass: 'Debt & Fixed Income',
    subCategories:
      'Corporate Bond, Banking & PSU, Credit Risk, Short / Medium / Long Duration, Gilt, Dynamic Bond, Floater',
    year1: '0.08% - 0.81%',
    year2Plus: '0.08% - 0.76%',
  },
  {
    assetClass: 'Liquid & Cash Management',
    subCategories: 'Overnight, Liquid, Money Market, Ultra Short Duration, Low Duration',
    year1: '0.02% - 0.55%',
    year2Plus: '0.02% - 0.55%',
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

// AMCs Abhijit is empanelled with. Sourced from
// `Important Docs/Commission Structure/Empanelment List.xlsx`, which records all
// fourteen as Applied = Yes, Empanelment Done = Yes.
//
// `rateCardOnFile` is a SEPARATE fact from empanelment and the two must never be
// conflated: it is true only where that AMC's current brokerage rate card is
// actually held on file and its scheme rates are therefore inside the ranges in
// `commissionSchedule`. /disclosures publishes the full list under empanelment
// but names only `rateCardAmcs` beside the commission table, because the table
// is a dated statutory claim and can only cover cards that have been seen.
//
// Logos are reproduced unaltered, on a white tile, with the AMC name as alt
// text — every one of these marks is dark artwork drawn for a light background.
// The tile is what makes fourteen different aspect ratios read as one band;
// wherever these are displayed, the "empanelment is not an endorsement" line
// must be displayed with them.
//
// The PNGs in public/images/amc/ are trimmed to the mark's own bounds (the
// ICICI source shipped as a 180x180 canvas that was only 41% logo, which made
// it render visually half the size of the others no matter what CSS said) and
// capped at 480px wide (the Edelweiss SVG rasterised to 11134px). `maxH` then
// balances the spread of true aspect ratios — 2.01:1 to 5.93:1 — so each mark
// occupies a similar area, because the eye compares area, not height: roughly
// `max-h-12` at 2:1 down to `max-h-9` past 4:1, where the tile's width becomes
// the real constraint. Re-measure and re-pick `maxH` when a logo is replaced.
//
// `logo: null` renders a plain wordmark tile instead of an image. Nothing uses
// it today, but keep the branch: it is the graceful fallback for an AMC whose
// mark is missing or unusable, and it is how Aditya Birla Sun Life rendered
// before a logo was supplied.
export type AmcPartner = {
  name: string;
  logo: string | null;
  maxH: string;
  rateCardOnFile: boolean;
};

// Alphabetical. Any ordering that grouped the rate-card holders first would read
// as a ranking, which cuts against the non-endorsement line.
export const empanelledAmcs: AmcPartner[] = [
  // 2.52:1. The only source found for this one is 131x52 native, so unlike the
  // rest it renders at barely 1.2x DPR and looks slightly soft on retina.
  // Swap in a larger file if one turns up; nothing else needs changing.
  { name: 'Aditya Birla Sun Life Mutual Fund', logo: 'images/amc/aditya-birla-sun-life.png', maxH: 'max-h-11', rateCardOnFile: false },
  // 5.93:1
  { name: 'Axis Mutual Fund', logo: 'images/amc/axis.png', maxH: 'max-h-9', rateCardOnFile: true },
  // 4.96:1 — width-limited by the tile in practice
  { name: 'DSP Mutual Fund', logo: 'images/amc/dsp.png', maxH: 'max-h-9', rateCardOnFile: true },
  // 5.05:1
  { name: 'Edelweiss Mutual Fund', logo: 'images/amc/edelweiss.png', maxH: 'max-h-9', rateCardOnFile: false },
  // 2.93:1
  { name: 'HDFC Mutual Fund', logo: 'images/amc/hdfc.png', maxH: 'max-h-10', rateCardOnFile: false },
  // 2.05:1 — the most compact mark, so it gets the most height
  { name: 'ICICI Prudential Mutual Fund', logo: 'images/amc/icici-prudential.png', maxH: 'max-h-12', rateCardOnFile: true },
  // 2.01:1
  { name: 'ITI Mutual Fund', logo: 'images/amc/iti.png', maxH: 'max-h-12', rateCardOnFile: false },
  // 2.97:1
  { name: 'Kotak Mahindra Mutual Fund', logo: 'images/amc/kotak.png', maxH: 'max-h-10', rateCardOnFile: false },
  // 2.45:1
  { name: 'Motilal Oswal Mutual Fund', logo: 'images/amc/motilal-oswal.png', maxH: 'max-h-11', rateCardOnFile: false },
  // 2.54:1
  { name: 'Nippon India Mutual Fund', logo: 'images/amc/nippon-india.png', maxH: 'max-h-11', rateCardOnFile: true },
  // 2.32:1 — lowercase 'quant' is the AMC's own styling, not a typo.
  { name: 'quant Mutual Fund', logo: 'images/amc/quant.png', maxH: 'max-h-11', rateCardOnFile: true },
  // 5.22:1
  { name: 'SBI Mutual Fund', logo: 'images/amc/sbi.png', maxH: 'max-h-9', rateCardOnFile: false },
  // 2.55:1
  { name: 'UTI Mutual Fund', logo: 'images/amc/uti.png', maxH: 'max-h-11', rateCardOnFile: false },
  // 4.42:1
  { name: 'WhiteOak Capital Mutual Fund', logo: 'images/amc/whiteoak-capital.png', maxH: 'max-h-9', rateCardOnFile: true },
];

// The AMCs whose rate cards `commissionSchedule` was actually derived from. This
// is the ONLY list that may be named beside the commission table.
export const rateCardAmcs = empanelledAmcs.filter((amc) => amc.rateCardOnFile);

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
  rateCardAmcs,
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
