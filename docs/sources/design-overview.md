# Design Guidelines

**1. Overarching Design Language**

The visual identity needs to project stability, clarity, and institutional trust while maintaining a modern, lightweight feel.

* **Color Palette:**
  
  * **Primary (Oxford Navy / Deep Slate):** `#0F172A` (Text, primary buttons, structural anchors)
  
  * **Surface Neutral (Warm Off-White):** `#F8FAFC` to `#F1F5F9` (Card backgrounds, subtle dividers)
  
  * **Background (Crisp White):** `#FFFFFF` (Main page canvas)
  
  * **Body Copy (High-Contrast Charcoal):** `#1E293B` (Meets strict WCAG AA contrast ratio of $>7:1$)
  
  * **Supporting Text (Muted Slate):** `#475569` (Sub-headers, metadata, timestamps)
  
  * **Accent Color (Subdued Royal Blue):** `#1D4ED8` (Links, active tab states)

* **Typography:**
  
  * **Heading Font:** Clean, modern sans-serif (e.g., `Inter`, `Plus Jakarta Sans`, or system sans-serif).
  
  * **Body Font:** High-readability sans-serif with a comfortable measure ($55\text{ch}$ to $75\text{ch}$ width per line for optimal reading ergonomics).

* **Layout & Hierarchy Rules:**
  
  * **Proof-First Architecture:** Clear credentials and regulatory badges sit immediately beside or above the main heading, not hidden at the bottom.
  
  * **Container Design:** Sharp 8px or 12px rounded corners (`rounded-lg` / `rounded-xl`), 1px subtle border outlines (`border-slate-200`), and zero heavy drop shadows.
  
  * **Mobile Touch Ergonomics:** Minimum button and link target size of $44\text{px} \times 44\text{px}$ with generous padding.

**2. Global Common Elements (Across Every Page)**

Every page on `abhijitsinha.in` will share four consistent outer framework components:

**A. Sticky Regulatory Top Banner**

* _Placement:_ Topmost bar of the viewport, above the main navigation header.

* _Function:_ Immediate proof of legitimacy and AMFI compliance.

* _Content Elements:_
  
  * `AMFI-Registered Mutual Fund Distributor`
  
  * `ARN: ARN-367596`
  
  * `EUIN: E703717`
  
  * `NISM Series V-A Certified`

**B. Main Site Header & Navigation**

* _Placement:_ Directly below the regulatory bar; sticky on scroll.

* _Content Elements:_
  
  * **Brand Mark / Logo:** "Abhijit Sinha" with a small subtitle badge "Mutual Fund Distributor".
  
  * **Primary Links:**
    |**Navigation Item**|**Route**|**Action / Destination**|
|---|---|---|
|**Brand Logo (`logo.jpg`)**|`/`|Returns to homepage top|
|**Home**|`/`![[homepage]]|Loads main landing page|
|**About**|`/#about`|Smooth-scrolls to the About Me section on the homepage|
|**Solutions**|`/solutions` ![[solutions]]|Navigates to the Asset Categories & Solutions page|
|**Disclosures**|`/disclosures` ![[disclosures]]|Navigates to the Commission & Statutory Disclosures page|
|**Investor Services**|`/investor-services`![[investor-services]]|Navigates to RTA links, support, and dispute mechanisms|
|**Book a Meeting (Primary CTA)**|`/schedule` ![[schedule]]|Dedicated page for calendar slot selection and 1:1 meeting booking|
  
  * **Header Action Button:** `Start Investing` or `Schedule Call` (direct anchor to intake form or scheduling link).
  
  * **Mobile Hamburger Menu:** Accessible sliding sheet or drop-down for small viewports.

**C. Floating / Quick Contact Access (Optional Desktop & Mobile)**

* _Placement:_ Bottom right corner or inline footer trigger.

* _Function:_ Quick access to request a callback or open the calendar scheduler without navigating away from research or disclosure pages.

**D. Comprehensive Statutory Footer**

* _Placement:_ Bottom anchor of every page.

* _Content Sections:_
  
  * **Mandatory Warning Box:** Prominently boxed, high-visibility statutory risk statement:
    
    > _"Mutual fund investments are subject to market risks, read all scheme related documents carefully."_
  
  * **Distributor Disclaimer:** Clear notice that transactions are in Regular Plans, content is educational, and past performance does not guarantee future results.
  
  * **Direct Service & Grievance Links:** Quick links to CAMS, KFintech, and SEBI SCORES 2.0 portals.
  
  * **Office & Registration Metadata:** Physical address, contact email, ARN validity dates, and copyright line.

**3. Common Modular Content Patterns**

Across individual pages, you will reuse these consistent UI modules:

* **Metric / Goal Cards:** Two-to-three column cards grouping related financial categories (e.g., Growth, Income, Balanced) with uniform border, padding, and iconography.

* **Compliance & Disclosure Drawers / Callouts:** Highlighted callout boxes using a subtle slate/blue border to separate regulatory notices from standard reading copy.

* **Structured Data Tables:** Responsive, striped tables for commission structures, grievance contacts, and fund category breakdowns with clear column headers.
