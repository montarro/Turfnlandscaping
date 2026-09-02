/* =====================================================================
   Shared page chrome (header + footer) for every GENERATED page.
   index.html and 404.html carry hand-written copies of the same markup —
   if you change the nav or footer here, mirror it there.
   ===================================================================== */
const PHONE_DISPLAY = "0457 357 085";
const PHONE_TEL = "+61457357085";

const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

/* One source of truth for the services menu (desktop dropdown + mobile
   accordion). Every href must be a live route under /services/. */
const SERVICE_GROUPS = [
  {
    label: "Turf",
    links: [
      ["/services/natural-turf-installation", "Natural Turf"],
      ["/services/synthetic-turf-installation", "Synthetic Turf"],
      ["/services/turf-repair-patching", "Turf Repair &amp; Patching"],
    ],
  },
  {
    label: "Custom Landscaping",
    links: [
      ["/services/paving", "Pavers &amp; Stepping Stones"],
      ["/services/retaining-walls", "Retaining Walls"],
      ["/services/timber-decking", "Timber &amp; Decking"],
      ["/services/garden-design", "Garden Design"],
      ["/services/landscaping-features", "Landscaping Features"],
    ],
  },
  {
    label: "Gardens &amp; Property Care",
    links: [
      ["/services/plants-garden-beds-mulch", "Plants &amp; Mulch"],
      ["/services/lawn-mowing", "Lawn Mowing"],
      ["/services/property-maintenance", "Property Maintenance"],
      ["/services/garden-care", "Garden Care"],
      ["/services/irrigation-repairs", "Irrigation Repairs"],
      ["/services/weed-control-spraying", "Weed Control &amp; Spraying"],
      ["/services/hedge-trimming-pruning", "Hedge Trimming &amp; Pruning"],
    ],
  },
];

const dropColumns = SERVICE_GROUPS.map(
  (g) => `        <div class="nav-drop__col">
          <span class="nav-drop__label">${g.label}</span>
${g.links.map(([href, name]) => `          <a href="${href}">${name}</a>`).join("\n")}
        </div>`
).join("\n");

const mobileAccordions = SERVICE_GROUPS.map(
  (g) => `      <details class="mobile-nav__acc">
        <summary>${g.label} ${chev}</summary>
${g.links.map(([href, name]) => `        <a href="${href}">${name}</a>`).join("\n")}
      </details>`
).join("\n");

const HEADER = `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/" aria-label="Bastiano Landscaping — home">
        <img class="brand__logo" src="/assets/logo-turf-and-landscaping.png?v=2" alt="Bastiano Landscaping" width="659" height="298" />
      </a>
      <nav class="primary-nav" aria-label="Primary">
        <a href="/#who-we-are">Who We Are</a>
        <div class="nav-drop" data-navdrop>
          <a href="/services">Our Services</a>
          <button class="nav-drop__toggle" type="button" aria-expanded="false" aria-controls="services-menu" aria-label="Browse services">${chev}</button>
          <div class="nav-drop__menu" id="services-menu">
${dropColumns}
            <a class="nav-drop__all" href="/services">View All Services <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
          </div>
        </div>
        <a href="/#areas">Service Areas</a>
        <a href="/projects">Our Projects</a>
        <a href="/blog">Advice</a>
        <a href="/#faq">FAQ</a>
      </nav>
      <div class="header-cta">
        <a class="header-phone" href="tel:${PHONE_TEL}">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.24 1z"/></svg>
          <span>0457&nbsp;357&nbsp;085</span>
        </a>
        <a class="header-call" href="/quote">Free Quote <span class="btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></a>
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-controls="mobile-nav" aria-expanded="false">
          <svg class="icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
    </div>
    <nav class="mobile-nav" id="mobile-nav" data-open="false" aria-label="Mobile">
      <div class="mobile-nav__group">
        <span class="mobile-nav__label">Menu</span>
        <a href="/#who-we-are">Who We Are</a>
        <a href="/services">Our Services</a>
        <a href="/projects">Our Projects</a>
        <a href="/blog">Advice</a>
        <a href="/#areas">Service Areas</a>
        <a href="/#faq">FAQ</a>
      </div>
      <div class="mobile-nav__group">
        <span class="mobile-nav__label">Services</span>
${mobileAccordions}
      </div>
      <div class="mobile-nav__group">
        <span class="mobile-nav__label">Get in touch</span>
        <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>
        <a href="mailto:info@bastianolandscaping.com.au">info@bastianolandscaping.com.au</a>
      </div>
      <a class="btn btn--primary btn--block" href="/quote">Request a Quote</a>
    </nav>
  </header>`;

const FOOTER = `
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer__grid">
        <div class="footer__brand">
          <a class="brand brand--footer" href="/" aria-label="Bastiano Landscaping — home">
            <img class="brand__logo" src="/assets/logo-turf-and-landscaping-white.png?v=2" alt="Bastiano Landscaping" width="659" height="298" />
          </a>
          <p style="margin-top:1rem;max-width:22rem;">Turf, landscape construction and property care across Melbourne's west and inner suburbs.</p>
          <div class="footer__socials">
            <a href="https://www.instagram.com/turfandlandscaping" target="_blank" rel="noopener" aria-label="Bastiano Landscaping on Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.2 1 .46 1.4.86.4.4.66.8.86 1.4.17.4.36 1 .42 2.2.07 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.42 2.2a3.8 3.8 0 0 1-.86 1.4c-.4.4-.8.66-1.4.86-.4.17-1 .36-2.2.42-1.3.07-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2-.42a3.8 3.8 0 0 1-1.4-.86 3.8 3.8 0 0 1-.86-1.4c-.17-.4-.36-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.42-2.2.2-.6.46-1 .86-1.4.4-.4.8-.66 1.4-.86.4-.17 1-.36 2.2-.42C8.4 2.2 8.8 2.2 12 2.2zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2zm5.1-8.3a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3z"/></svg>
            </a>
            <a href="https://www.facebook.com/turfandlandscaping" target="_blank" rel="noopener" aria-label="Bastiano Landscaping on Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.75-1.6 1.5V12h2.7l-.43 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>
            </a>
          </div>
        </div>
        <div>
          <h4>Services</h4>
          <ul>
            <li><a href="/services/natural-turf-installation">Natural Turf</a></li>
            <li><a href="/services/synthetic-turf-installation">Synthetic Turf</a></li>
            <li><a href="/services/retaining-walls">Retaining Walls</a></li>
            <li><a href="/services/paving">Pavers &amp; Stepping Stones</a></li>
            <li><a href="/services/property-maintenance">Property Maintenance</a></li>
            <li><a href="/services">All Services</a></li>
          </ul>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/#who-we-are">Who We Are</a></li>
            <li><a href="/projects">Our Projects</a></li>
            <li><a href="/blog">Advice</a></li>
            <li><a href="/#areas">Service Areas</a></li>
            <li><a href="/#faq">FAQ</a></li>
            <li><a href="/quote">Request a quote</a></li>
          </ul>
        </div>
        <div>
          <h4>Get in touch</h4>
          <ul>
            <li><a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></li>
            <li><a href="mailto:info@bastianolandscaping.com.au">info@bastianolandscaping.com.au</a></li>
            <li>Melbourne's West • Inner City • Inner North • Inner East &amp; Bayside</li>
            <li>Mon–Fri 7am–9pm · Sat 7am–5pm · Sun closed</li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© <span id="year">2026</span> Bastiano Landscaping</span>
        <span>Melbourne's West • Inner City • Inner North • Inner East &amp; Bayside · <a class="footer__admin" href="/admin">Admin</a></span>
      </div>
    </div>
  </footer>`;

const FOOTER_SCRIPTS = `
  <script src="/main.js" defer></script>
  <script>var y=document.getElementById("year"); if(y) y.textContent=new Date().getFullYear();</script>
  <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
  <script defer src="/_vercel/insights/script.js"></script>`;

module.exports = { HEADER, FOOTER, FOOTER_SCRIPTS, PHONE_DISPLAY, PHONE_TEL };
