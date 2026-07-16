// Decoupled types to prevent circular imports at runtime
interface SeedArticle {
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
}

interface SeedResource {
  title: string;
  description: string;
  type: string;
  fileUrl: string;
  category: string;
}

export const seedArticles: SeedArticle[] = [
  {
    title: "Understanding Company Registration: Choosing the Right Entity",
    category: "Company Registration",
    summary: "A deep dive into LLCs, C-Corporations, and S-Corporations to help you select the ideal structural foundation for your startup.",
    content: `Choosing the legal structure for your startup is one of the most consequential decisions you will make. It impacts your personal liability, taxes, ability to raise money, and administrative burden.

Here are the primary entity types chosen by startup founders:

### 1. C-Corporation (C-Corp)
A C-Corp is a separate legal entity owned by shareholders. It is the gold standard for startups that plan to raise venture capital or angel investment.
*   **Pros:** Preferred by institutional investors; allows for stock options (ESOPs); unlimited number of shareholders.
*   **Cons:** Double taxation (corporate income tax + personal income tax on dividends); complex administrative overhead (board of directors, annual meetings, detailed record-keeping).
*   **Best for:** Startups aiming for venture capital backing, equity plans for employees, and eventual public listing.

### 2. Limited Liability Company (LLC)
An LLC combines the liability protection of a corporation with the tax benefits and simplicity of a partnership.
*   **Pros:** Pass-through taxation (profits/losses flow directly to owners' personal tax returns); high flexibility in management structure; minimal administrative complexity.
*   **Cons:** Harder to issue employee equity options; not favored by VCs because corporate tax structures don't easily align with LLC partnership returns.
*   **Best for:** Bootstrapped startups, consulting firms, lifestyle businesses, or founders wanting simple operational governance.

### 3. S-Corporation (S-Corp)
An S-Corp is a special tax status available to corporations (and LLCs) that meet specific IRS requirements.
*   **Pros:** Pass-through taxation; potential self-employment tax savings.
*   **Cons:** Strict limitations (max 100 shareholders, only US citizens or permanent residents can own shares, only one class of stock allowed).
*   **Best for:** Small, domestically-focused startups with a limited founder circle.

### Summary Checklist for Registration
1.  **Select a jurisdiction:** Delaware is highly recommended for C-Corps due to its business-friendly court systems and familiar corporate laws.
2.  **Choose a unique name:** Check state registries and trademark databases.
3.  **Appoint a registered agent:** An entity that handles official legal correspondence.
4.  **File Articles of Incorporation / Organization:** Submit documents with the Secretary of State.
5.  **Obtain an Employer Identification Number (EIN):** Needed for taxes and opening a bank account.`,
    tags: ["incorporation", "c-corp", "llc", "delaware", "legal-structure"]
  },
  {
    title: "Demystifying Startup Funding: Bootstrap, Angels, and Venture Capital",
    category: "Funding",
    summary: "An introductory guide to various fundraising routes, showing when to leverage self-funding versus external equity investments.",
    content: `Every startup needs capital to survive, build products, and acquire customers. However, how you acquire that capital determines your ownership, growth trajectory, and control over the company.

### 1. Bootstrapping (Self-Funding)
Bootstrapping means funding your business using personal savings, early customer revenue, and sweat equity.
*   **When to use:** You want to maintain 100% control; you can reach profitability quickly; your market doesn't require massive upfront capital to build the product.
*   **Key Advantage:** Complete control and zero equity dilution.
*   **Key Risk:** Limited growth speed, personal financial risk.

### 2. Angel Investors
Angels are high-net-worth individuals who invest their personal money into early-stage startups, usually in exchange for equity.
*   **When to use:** Pre-seed or Seed stage; you need mentorship, validation, and a small influx of capital ($25k - $250k) to build a prototype or gain early traction.
*   **Key Advantage:** More lenient than VCs, provides valuable network connections.

### 3. Venture Capital (VC)
VCs are professional firms that invest pooled money from Limited Partners (LPs) into high-growth potential businesses.
*   **When to use:** Series A and beyond (though micro-VCs do seed rounds); you have validated product-market fit and need $1M+ to scale aggressively.
*   **Key Advantage:** Large capital injections, institutional credibility, board expertise.
*   **Key Risk:** High pressure to scale, loss of seats on the board, and severe dilution.

### 4. Alternative Funding Models
*   **Convertible Notes:** Debt that converts into equity during a future priced round.
*   **SAFE (Simple Agreement for Future Equity):** Created by Y Combinator, SAFEs act as a simpler, faster alternative to convertible notes, carrying no interest and no maturity date.
*   **Crowdfunding:** Platforms like Kickstarter (rewards-based) or Wefunder (equity-based) that aggregate small amounts of money from a large public group.`,
    tags: ["fundraising", "venture-capital", "angel-investors", "bootstrapping", "safe"]
  },
  {
    title: "Essential Legal Compliance Checklist for New Startups",
    category: "Legal Compliance",
    summary: "Protect your intellectual property, create standard founder agreements, and remain compliant with state regulations from day one.",
    content: `Neglecting legal compliance in the early days is one of the most common causes of startup death. Resolving legal disputes retroactively is ten times more expensive than setting things up properly.

Here is your essential compliance checklist:

### 1. Founder Accord & Equity Vesting
Never split equity 50/50 without a vesting schedule.
*   **Standard Vesting:** The standard is a 4-year vesting schedule with a **1-year cliff**. This means if a founder leaves before 12 months, they get 0% of their equity. After 1 year, 25% vests, and the rest vests monthly over the next 3 years.
*   **IP Assignment:** Ensure all founders sign a technology assignment agreement, transferring all code, designs, and patents they create to the corporation, not their personal possession.

### 2. Intellectual Property (IP) Protection
*   **Trademarks:** Register your brand name and logo early.
*   **Patents:** File provisional patents if you have developed unique, non-obvious technology.
*   **Copyrights:** Protect proprietary source code, documentation, and creative assets.
*   **NDAs:** Use Non-Disclosure Agreements when sharing sensitive IP with external contractors or vendors.

### 3. Securities Laws Compliance
When you sell shares or issue SAFEs, you are issuing securities. You must comply with federal and state regulations.
*   **Form D Filing:** File a Form D with the SEC within 15 days of your first equity/SAFE sale under Rule 506(b) or 506(c).
*   **Blue Sky Laws:** Register or file exemptions in the states where your investors reside.

### 4. Basic Contracts & Documents
*   **Terms of Service & Privacy Policy:** Mandatory for any web application or software collect user data (especially under GDPR/CCPA).
*   **Founder's Agreement:** Specifies roles, responsibilities, decision-making power, and buyout terms.`,
    tags: ["legal", "compliance", "ip-protection", "vesting", "securities"]
  },
  {
    title: "How to Build a High-Performing Startup Team: Hiring and Equity",
    category: "Hiring",
    summary: "How to hire early employees, structure contractor vs employee contracts, and allocate employee stock option pools (ESOP).",
    content: `A startup is only as good as the team behind it. In the early stages, your first 10 hires will shape the culture, work ethic, and ultimate success of your venture.

### 1. Employees vs. Contractors (1099 vs. W-2)
Misclassifying workers can result in massive back taxes and legal penalties.
*   **Contractors (1099):** High autonomy, sets their own hours, uses their own tools, project-based. Best for specialized, temporary, or advisory roles.
*   **Employees (W-2):** Integral to the business, company controls how/when the work is done, uses company equipment. Best for core engineers, product managers, and founders.

### 2. The Employee Stock Option Pool (ESOP)
Startups attract top-tier talent from high-paying corporate roles by offering equity upside.
*   **Pool Size:** Standard early-stage stock pools represent **10% to 20%** of the company's total outstanding shares.
*   **Standard Offer Rules:**
    *   *First Engineer:* 1% - 3% equity.
    *   *VP / Director level:* 0.5% - 1.5% equity.
    *   *Junior developer:* 0.05% - 0.25% equity.
*   **Exercise Windows:** Ensure employees understand options must be exercised (bought) within a specific window (usually 90 days) after leaving the company.

### 3. Hiring Best Practices
1.  **Hire for attitude and speed:** In a startup, adaptability is more critical than a hyper-specific pedigree.
2.  **Define clear metrics:** Every early hire should own a specific metric (e.g., weekly active users, codebase stability, customer support SLA).
3.  **Run a trial project:** Before making a full-time W-2 offer, hire the candidate for a weekend or 1-week paid contract project to evaluate actual working style.`,
    tags: ["hiring", "esop", "equity", "contractors", "startup-team"]
  },
  {
    title: "Startup Branding Strategy: Designing Identity with Low Budgets",
    category: "Branding",
    summary: "Establish a premium brand identity, refine core messaging, and claim domains without spending thousands on agencies.",
    content: `Branding is not just a logo; it is the gut feeling a customer has about your product. For early startups, a strong, consistent brand establishes immediate credibility and trust.

### 1. Define Your Core Brand Pillars
Before picking colors or logos, define:
*   **Mission:** Why does your startup exist beyond making money?
*   **Target Audience:** Who is your absolute beachhead customer?
*   **Brand Voice:** Is your brand professional and authoritative, or casual and playful?

### 2. Domain Name Strategies
A premium domain establishes immediate authority.
*   **The .com gold standard:** If possible, acquire the \`.com\` domain.
*   **Creative alternatives:** If your exact name is taken, consider:
    *   *Prefixes:* \`get[brand].com\`, \`try[brand].com\`, \`use[brand].com\`
    *   *Tld extensions:* \`[brand].co\`, \`[brand].io\` (tech), \`[brand].ai\` (AI startups).

### 3. DIY Visual Identity Tools
You do not need a $10,000 agency budget. Use these resources to start:
*   **Typography:** Choose Google Fonts (e.g., Inter, Outfit, Space Grotesk) to stand out from default browser fonts. Use a clear typographic hierarchy (H1 bold, H2 medium, Body regular).
*   **Color Palette:** Limit yourself to 3 main colors: a dominant color (60%), a secondary/supporting color (30%), and an accent color (10%) for CTA buttons.
*   **Logo Design:** Use tools like Figma or Canva to design clean, typography-focused wordmarks. Avoid overly complex vectors. Let your product do the talking.`,
    tags: ["branding", "marketing", "domain-acquisition", "visual-identity"]
  },
  {
    title: "Growth Marketing for Startups: Channels and Cost-Effective Acquisition",
    category: "Marketing",
    summary: "Practical techniques for growth, organic SEO, content distribution, and measuring Customer Acquisition Cost (CAC).",
    content: `Many startups fail not because they built a bad product, but because they couldn't acquire customers cost-effectively.

### 1. Organic vs. Paid Marketing
*   **Organic (SEO, Content, Virality):** Takes time to build but creates a compound growth engine with near-zero marginal cost.
*   **Paid (Google Ads, Meta Ads):** Immediate traffic, highly measurable, but expensive and ceases the moment your budget runs dry.

### 2. The Traction Channel Framework
There are 19 traction channels (from PR to Search Engine Marketing). To find yours:
1.  **Brainstorm:** List potential campaigns in all 19 channels.
2.  **Test (The Bullseye Framework):** Select the top 3 channels and run small, low-budget tests ($100-$500) to measure conversions.
3.  **Focus:** Once a channel shows high conversion rates and low acquisition cost, double down and ignore the rest until that channel saturates.

### 3. Tracking Essential Unit Economics
*   **Customer Acquisition Cost (CAC):** Total sales & marketing spend divided by the number of customers acquired in a given period.
*   **Lifetime Value (LTV):** The total revenue a single customer generates over their relationship with your startup.
*   **LTV to CAC Ratio:** A healthy startup should aim for an **LTV:CAC ratio of 3:1** or higher.
*   **CAC Payback Period:** How many months of customer revenue does it take to recover the cost of acquiring that customer? Under 12 months is excellent.`,
    tags: ["growth-hacking", "seo", "marketing-funnel", "unit-economics", "cac"]
  },
  {
    title: "Startup Taxation: Corporate Taxes, Sales Tax Nexus, and Deductions",
    category: "Taxation",
    summary: "Navigate IRS rules, file corporate returns, and manage state sales tax requirements for SaaS and digital services.",
    content: `Taxes for startups are far more complex than personal tax returns. Failing to file correctly can result in massive IRS penalties, personal audit risk, and can block investment during VC due diligence.

### 1. Federal Corporate Income Tax
Even if your startup is pre-revenue or unprofitable, you **must file an annual federal tax return (Form 1120)**.
*   **Deadlines:** Typically April 15th of the following fiscal year.
*   **R&D Tax Credit:** Unprofitable startups that invest in technical product research can apply for the federal R&D tax credit, which can offset up to **$500,000** in employer payroll taxes each year.

### 2. State Sales Tax Nexus (The Wayfair Decision)
If you sell software or digital services, you may be liable for sales tax in states where you don't have physical offices.
*   **What is Nexus?** A legal connection to a state that triggers sales tax collection. It can be triggered by physical presence (employees, inventory) or economic presence (e.g., $100,000 in sales or 200 transactions in that state).
*   **Solution:** Use automated compliance platforms like Stripe Tax or Anrok to monitor economic nexus thresholds and calculate taxes in real-time.

### 3. Deductions to Claim
Make sure your accountant tracks and deducts:
*   Software subscriptions (SaaS tools).
*   Cloud infrastructure hosting (AWS, GCP).
*   Founder travel, meals, and business mileage.
*   Legal and incorporation fees.`,
    tags: ["taxes", "nexus", "stripe-tax", "compliance", "rd-credits"]
  },
  {
    title: "The Ultimate Guide to Pitch Decks and Valuation",
    category: "Fundraising",
    summary: "A breakdown of the 10 core slides in a venture-backed pitch deck and how to establish a pre-seed startup valuation.",
    content: `To raise capital, you must tell a compelling story. Your pitch deck is the primary vehicle for that story.

### 1. The 10-Slide Pitch Deck Framework
Keep your deck under 12 slides. VCs spend an average of only 2 minutes and 30 seconds reading a deck.
1.  **Title Slide:** Clear 1-sentence value proposition.
2.  **The Problem:** The pain point you are solving. Focus on size, cost, and frequency of the problem.
3.  **The Solution:** Your product. Show screenshots, diagrams, or a 1-minute video demo.
4.  **Market Size (TAM, SAM, SOM):** Total Addressable Market (TAM) should ideally be $1B+ to interest VCs.
5.  **Business Model:** How do you make money? (e.g., SaaS subscription, transaction fee).
6.  **Traction:** The hockey-stick graph. Weekly/monthly active users, revenue, or signed letters of intent (LOIs).
7.  **Competition:** A matrix showing why you are unique compared to current alternatives.
8.  **Marketing & Growth Plan:** How will you acquire customers at scale?
9.  **The Team:** Why are you uniquely qualified to solve this problem? Focus on domain expertise.
10. **The Ask:** How much money are you raising, and what will you achieve with it over the next 18 months?

### 2. Valuing a Pre-Revenue Startup
Valuing a startup before it has revenue is an art, not a science.
*   **The Scorecard Method:** Compares your startup to recently funded startups in your region, adjusting based on team quality, product status, and market competition.
*   **Market Multiples:** Look at public/private SaaS valuation multiples (typically 5x to 15x annualized revenue) to project future valuations.
*   **SAFE Caps:** When raising via SAFEs, you negotiate a **valuation cap** (the maximum valuation at which your SAFE converts to equity in the future priced round). Early pre-seed caps usually range between $3M and $10M depending on team and traction.`,
    tags: ["pitch-deck", "fundraising", "valuation", "venture-capital"]
  },
  {
    title: "AI Tools for Startups: Leveraging LLMs for Growth and Operations",
    category: "AI Tools",
    summary: "Integrate artificial intelligence into customer support, engineering velocity, copy generation, and data parsing.",
    content: `Artificial Intelligence is the ultimate force multiplier for resource-constrained startups. With API models like Claude, GPT-4, and Gemini, a team of two founders can achieve the output of ten traditional employees.

### 1. Engineering Productivity (Copilots and Coding Assistants)
*   **Actionable Tip:** Standardize the use of coding assistants (Cursor, Copilot) across your dev team. This increases code generation velocity by 30% to 50% and reduces onboarding friction for new developers.
*   **Caution:** Do not copy-paste proprietary customer data into public consumer models; use API interfaces with enterprise data-exclusion terms.

### 2. Automating Customer Support
*   **RAG (Retrieval-Augmented Generation) Bots:** Feed your internal product documentation into a Vector DB. Integrate a chat agent on your site that searches documentation and drafts highly accurate support replies.
*   **Email triage:** Automatically parse incoming sales/support emails and route them or auto-generate drafts for agents.

### 3. Content Creation and SEO at Scale
*   **Content Outlines:** Use AI to build comprehensive SEO article outlines, search intent analyses, and copywriting variations.
*   **Editing & Localization:** Instantly translate terms of service, support guides, and landing pages to localize globally.

### 4. Code Example: Connecting to Gemini API
Here is a lightweight sample Node/Next.js function to query the Gemini API:
\`\`\`typescript
const response = await fetch(
  \`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=\${process.env.GEMINI_API_KEY}\`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Explain valuation caps in 2 sentences." }] }]
    })
  }
);
const data = await response.json();
console.log(data.candidates[0].content.parts[0].text);
\`\`\``,
    tags: ["ai", "gemini-api", "engineering-velocity", "automation", "seo-tools"]
  },
  {
    title: "Achieving Product-Market Fit: Metrics and Scaling Strategy",
    category: "Business Growth",
    summary: "How to know if your startup has reached Product-Market Fit, and how to structure scaling without burning capital.",
    content: `Product-Market Fit (PMF) is the inflection point where customer demand outstrips your capacity to support it. Prior to PMF, your only goal is iteration. Post-PMF, your goal is scaling.

### 1. How to Measure Product-Market Fit
Do not rely on vanity metrics (like press releases or total registrants). Use these three quantitative tests:
*   **The Sean Ellis PMF Test:** Survey your active users and ask: *"How would you feel if you could no longer use this product?"* If **40% or more** answer "Very Disappointed," you have achieved PMF.
*   **Retention Curves:** Plot the percentage of active users over time (days, weeks, months). If the curve flattens out (e.g., stabilizes at 25% retention after 12 weeks), you have a sticky cohort. If the curve drifts to zero, you do not have PMF.
*   **Organic Referrals:** If 30%+ of your new signups come from word-of-mouth recommendations, you have genuine product pull.

### 2. The Dangers of Premature Scaling
Premature scaling is spending significant capital on sales, marketing, and expansion before validating PMF.
*   **Why it kills startups:** You accelerate cash burn to acquire customers who eventually churn because the product doesn't meet their core needs.
*   **The Golden Rule:** Keep your team small, your operations lean, and your experiments cheap until retention stabilizes.

### 3. Scaling Infrastructure & Unit Economics
Once PMF is reached:
1.  **Refine unit economics:** Ensure you make money on every user before spending money to acquire them.
2.  **Build repeatable playbooks:** Document sales processes, customer success guides, and engineer onboarding.
3.  **Invest in automation:** Replace manual workflows (e.g. database seeds, onboarding emails) with SaaS automation tools.`,
    tags: ["product-market-fit", "pmf", "cohort-retention", "metrics", "scaling"]
  }
];

export const seedResources: SeedResource[] = [
  {
    title: "Standard Delaware C-Corp Incorporation Template Pack",
    description: "Ready-to-use template forms for Articles of Incorporation, Bylaws, and Initial Board Consent filings in Delaware.",
    type: "Template",
    fileUrl: "/templates/incorporation_pack.zip",
    category: "Company Registration"
  },
  {
    title: "Founder Equity Vesting and IP Assignment Agreement",
    description: "Protect company assets. This legal contract binds founders to a 4-year vesting plan and assigns all code/IP to the entity.",
    type: "Template",
    fileUrl: "/templates/founder_agreement.pdf",
    category: "Legal Compliance"
  },
  {
    title: "Y Combinator Standard SAFE Agreement Template",
    description: "The official, widely accepted post-money SAFE (Simple Agreement for Future Equity) template for early-stage rounds.",
    type: "Template",
    fileUrl: "/templates/safe_agreement_post_money.pdf",
    category: "Funding"
  },
  {
    title: "Early-Stage Pitch Deck Google Slides Template",
    description: "An elegant, customizable 10-slide presentation template structured to pitch venture capital funds and angel investors.",
    type: "Template",
    fileUrl: "/templates/pitch_deck_template.pptx",
    category: "Fundraising"
  },
  {
    title: "Startup Pre-Launch Branding & Launch Checklist",
    description: "Step-by-step checklist to coordinate domain acquisition, social profiles, brand colors, and PR distribution for launch day.",
    type: "Checklist",
    fileUrl: "/checklists/brand_launch_checklist.pdf",
    category: "Branding"
  },
  {
    title: "SaaS Financial Model & Unit Economics Excel Spreadsheet",
    description: "Interactive financial modeling tool to track cohort retention, MRR growth, LTV/CAC ratios, and monthly runway burn.",
    type: "Spreadsheet",
    fileUrl: "/templates/financial_model_sheet.xlsx",
    category: "Business Growth"
  }
];
