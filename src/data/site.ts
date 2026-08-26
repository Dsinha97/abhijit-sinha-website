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
  email: 'abhijit.uti@gmail.com',
  phone: '+91-9004087549',
  phoneHref: 'tel:+919004087549',
  whatsappNumber: '919004087549', // country code, no '+' or separators
  // TODO(confirm): placeholder from source spec, not yet confirmed by Abhijit.
  arnValidity: '11/08/2026 to 01/07/2029',
  linkedin: 'https://www.linkedin.com/in/abhijit-sinha-243b7243/',
} as const;

// Mailboxes referenced in the original specs but not yet provisioned on the
// domain. Everything routes to distributor.email until these exist.
export const plannedMailboxes = {
  support: 'support@abhijitsinha.in',
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

// TODO(confirm): all ranges below are placeholders from the source spec,
// pending Abhijit's actual AMC empanelment agreements. Do not treat as final.
export const commissionSchedule: CommissionRow[] = [
  {
    assetClass: 'Equity Schemes',
    subCategories: 'Flexi Cap, Large Cap, Mid Cap, Small Cap, Focused, Sectoral/Thematic',
    year1: '0.50% - 1.25%',
    year2Plus: '0.50% - 1.25%',
  },
  {
    assetClass: 'Hybrid Schemes',
    subCategories: 'Dynamic Asset Allocation (BAF), Multi-Asset, Aggressive Hybrid, Arbitrage',
    year1: '0.40% - 1.00%',
    year2Plus: '0.40% - 1.00%',
  },
  {
    assetClass: 'Debt & Fixed Income',
    subCategories: 'Corporate Bond, Banking & PSU, Short Duration, Money Market',
    year1: '0.15% - 0.60%',
    year2Plus: '0.15% - 0.50%',
  },
  {
    assetClass: 'Liquid & Cash Management',
    subCategories: 'Overnight Funds, Liquid Funds, Ultra Short Duration',
    year1: '0.03% - 0.15%',
    year2Plus: '0.03% - 0.15%',
  },
  {
    assetClass: 'Passive & Index Solutions',
    subCategories: 'Index Funds, Exchange Traded Funds (ETFs), Fund of Funds (FoF)',
    year1: '0.05% - 0.25%',
    year2Plus: '0.05% - 0.25%',
  },
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
  // Form endpoint for Web3Forms/Formspree-style hosted form handling.
  // Set PUBLIC_FORM_ENDPOINT in .env (see .env.example). Empty until configured.
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT ?? '',
};

export default site;
