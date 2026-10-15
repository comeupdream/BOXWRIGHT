# Experience India — website proposal

Response to the *Experience India Website / Portfolio Design Brief* (September 2026), section 15. What was
asked for is listed in order; each item is answered, and the answer is built in this folder so you can see it
rather than imagine it. Run `npm run dev` in `experience-india/` to browse it.

## 1. Sitemap

The brief's suggested sitemap is adopted almost as is, with one addition (a standalone waitlist URL so
social-media links can deep-link straight to the form) and one merge (Home carries the Why-different and
founder sections, and `/why-experience-india` exists as a short page for the nav and search).

```
/                              Home — the two-path choice within the first screen
├── Cultural (saffron)
│   ├── /explore-india          the concept; flagship card; future festivals
│   ├── /ganesh-chaturthi-2027  flagship landing page (template for every future experience)
│   ├── /how-it-works           5 steps
│   └── /waitlist               interest-list form
├── Medical (teal)
│   ├── /medical-value-travel   educational first, sales second
│   ├── /how-medical-travel-works  10-step patient journey, who-owns-what
│   └── /medical-inquiry        private inquiry form + consent
└── Company
    ├── /why-experience-india   philosophy and differentiation
    ├── /about                  founder and company story
    ├── /faq                    every trust question from section 14, grouped
    ├── /contact                general contact
    └── /privacy, /terms        drafts, flagged for legal review
```

Navigation is deliberately short on desktop (Explore India · Medical Value Travel · About · FAQ · Contact
plus one CTA). The mobile menu groups links under the two verticals so the split is visible even there.

## 2. Homepage wireframe

Mobile (the primary device) reads top to bottom:

```
┌──────────────────────────────┐
│ [logo]              [Menu ≡] │  sticky, translucent
├──────────────────────────────┤
│ HERO  (visual / video)       │
│ EXPERIENCE INDIA             │
│ Don't just visit India.      │
│ Experience India.            │
│ 2-line emotional statement   │
│ [Explore India] [Medical VT] │  both paths inside the first screen
├──────────────────────────────┤
│ ▌ I want to experience India │  saffron edge
│   Explore India → …          │
│ ▌ I am considering treatment │  teal edge
│   Medical Value Travel → …   │  cards overlap the hero to pull the eye down
├──────────────────────────────┤
│ FEATURED  #001 Ganesh 2027   │  image, 4 facts, [See] [Join list]
├──────────────────────────────┤
│ WHY DIFFERENT  3 cards       │
├──────────────────────────────┤
│ STORY STRIP  festivals/food/ │
│ people/streets (4 tiles)     │
├──────────────────────────────┤
│ MVT INTRO  image + checklist │  plain non-clinical explanation
│ [How it works] [Inquiry]     │
├──────────────────────────────┤
│ HOW IT WORKS  5 steps        │
├──────────────────────────────┤
│ FOUNDER  quote + who we are  │  dark band
├──────────────────────────────┤
│ FAQ  4 first questions       │
├──────────────────────────────┤
│ FINAL CTA  [Join] [Inquiry]  │
├──────────────────────────────┤
│ FOOTER  brand/not-a-hospital │
│ Cultural · Medical · Company │
└──────────────────────────────┘
```

On desktop the two path cards sit side by side, the featured and MVT sections become image/text splits,
and the five steps run in a row. The order is identical, so what a visitor learns first is the same on
every device. Success criterion 1 (understand the company in 10 seconds) is served by the hero line plus
the two cards; criterion 2 (choose Cultural or Medical immediately) by having both CTAs in the hero and
the cards directly beneath.

## 3. Visual direction

**Premium, warm, human. Indian in colour and rhythm, not in cliché.**

- **Palette.** Ivory paper background (`#FAF6EF`) and near-black ink for a calm, editorial feel. Two
  accents carry the verticals: **saffron/marigold** for Cultural, **deep teal** for Medical. Nothing else
  competes. Dark bands (founder, CTA) add contrast without adding colour.
- **Type.** *Fraunces*, a warm high-contrast serif, for headlines: emotional, premium, unmistakably not
  a template. *Manrope*, a clean geometric sans, for everything else: readable at phone sizes, trustworthy
  on the medical pages. Both are free Google Fonts.
- **Imagery.** Large, full-bleed hero visuals; big 4:5 image blocks in splits; a four-tile story strip.
  Because there is no proprietary library yet, the site ships with **original vector art** (dusk skylines,
  garland arcs, marigold rings, a calm teal dawn for medical) that looks intentional rather than "stock
  pending". Every slot is a plain `<img>`/`<video>` you swap for licensed footage, then for your own.
- **Whitespace and rhythm.** Generous section padding, one idea per section, short lines. The page
  breathes so the festival imagery can be loud.
- **Motion.** Subtle scroll reveals only, disabled for users who prefer reduced motion.
- **Trust cues.** Draft/To-confirm chips on anything unconfirmed. A consistent "what we are and are not"
  panel on every medical page. A footer line on every page stating we are not a medical provider.

## 4. Two verticals under one brand

Same wordmark, type, layout grammar, footer and tone everywhere. The vertical is signalled by one thing:
the accent colour. Saffron buttons, eyebrows, checkmarks and card edges mean Cultural; teal means Medical.
Each page's hero art matches (warm dusk vs calm dawn). A visitor can move between the two and always know
where they are, and the two never feel like two companies: the header, the founder story and the FAQ are
shared, and the final CTA band on cultural pages offers both doors.

## 5. Platform / CMS recommendation

**Launch on this static site, hosted on Netlify (free tier), with Git-based editing.** Reasons:

- Fastest possible pages, which matters for TikTok/Instagram traffic on mobile data.
- Netlify Forms give you working lead forms with no backend, email notifications, CSV export and a
  one-click Zapier/Make hook into Google Sheets or a CRM (HubSpot free, Notion, Airtable).
- One `site.config.json` holds the things that change weekly. Page text is plain HTML with the sections
  clearly labelled; the README shows the four or five patterns you will actually touch (FAQ item, itinerary
  day, a new experience page).
- Zero monthly cost, no plugin updates, nothing to break.

**When you want a visual editor** (you are adding festivals monthly, or someone non-technical is editing
copy daily), the two sensible moves are:

1. **Decap CMS** (free, open source) on top of this exact site: a `/admin` login that edits the page files
   and config through a form UI and commits to Git. Half a day to add. Keeps the speed and the design.
2. **Framer or Webflow** if you would rather rebuild in a hosted visual tool. Framer is the better fit for a
   founder: fastest to learn, excellent on mobile, built-in forms and analytics. Expect ~USD 20–30/month
   and a one-off rebuild using this site as the design spec. Webflow is more powerful and more complex.

I would not start on WordPress (maintenance, plugins, speed) or Wix/Squarespace (they look like what they
are, and the brief asks for the opposite).

## 6. Mobile-first

Every component is written for a 360–430px screen first and widens at 640/720/900/960px. Tap targets are
44px+, forms are single-column on phones, the menu is a full-height list grouped by vertical, and the hero
CTAs sit inside the first screen. The screenshots taken during the build at 390px and 1366px are the
reference.

## 7. Reusable sections

The stylesheet is a small component library: hero, path cards, feature cards, splits, story strip, steps
(row or stacked), timeline, itinerary, facts, checklists (yes/no/medical), FAQ, notice, tags, CTA band,
forms, two-column form layout. Adding **Diwali 2028** is: copy the Ganesh page, change words and chips,
add one card to Explore India. Adding a **medical specialty** page is: copy the MVT page and keep the
disclaimer partial. No section needs new CSS.

## 8. Forms and CRM

- **Cultural waitlist** collects exactly the brief's fields (name, email, country, travelers, dates,
  interest level, how heard, message) plus an optional "other festivals" field and a consent checkbox.
  No passport or payment fields exist anywhere.
- **Medical inquiry** collects name, email, country of residence, preferred contact method, optional
  phone, broad treatment area (a dropdown so people don't write diagnoses), timing, attendants, message,
  and an explicit consent statement that names us as a facilitator. Hints and footers say not to include
  records.
- Every submission carries a hidden **source** field (UTM parameters or referrer) so you can see which
  platform and which video produced each lead.
- Destination: Netlify Forms → email + Google Sheet/CRM via Zapier or Make. Or paste any endpoint
  (Formspree, Basin, Google Apps Script) into the config and the forms post there instead.

## 9. SEO and analytics

Per-page titles and descriptions, canonical URLs, Open Graph/Twitter cards with a generated share image,
Organization JSON-LD, `sitemap.xml` and `robots.txt` generated at build, semantic headings, `noindex` on the
thanks page. Analytics is one config value: a GA4 ID or a Plausible domain. CTA clicks (`data-track`) and
lead submissions fire as events, so conversion from each social platform is measurable from day one.

## 10. Speed and social-friendliness

No framework, no JavaScript needed to read or submit anything, a 21 KB stylesheet, vector art measured in
kilobytes, fonts preconnected, images lazy-loaded below the fold, long-cache headers on assets. Deep links
for social bios and video captions: `/waitlist`, `/ganesh-chaturthi-2027`, `/medical-inquiry`. Append
`?utm_source=tiktok&utm_content=video-id` to track a specific video.

## 11. Easy updates

See README "Everyday edits". Text, images, FAQs, itinerary and pricing status are all edits to a labelled
file; pushing redeploys. Pricing is a single sentence in the config until it is final, and the Ganesh page
shows a "Published when it's final" card rather than a number.

## 12. Assets and content needed from you

| Needed | Why | When |
|---|---|---|
| Founder name, short bio, portrait | About, home founder section, byline | Before launch |
| Real domain and email | Config: canonical URLs, forms, footer | Before launch |
| Social handles | Footer and schema | Before launch |
| 1 hero clip or photo (licensed), 4–6 story photos (festival, food, people, streets), 1 medical/calm visual | Replace vector art | Launch, or as they arrive |
| Confirmed festival dates and gateway city for Ganesh 2027 | Remove draft chips | When known |
| Final itinerary, hotels, inclusions, price, payment and cancellation terms | Ganesh page + FAQ | Before public sale |
| Legal review of privacy, terms and all medical copy | Both pages carry a "pending legal review" chip | Before launch |
| Any verified provider partnerships | Only then named on medical pages | When verified |
| Analytics ID (GA4 or Plausible) | Config | Launch |

## 13. Scope, timeline and cost

**Scope delivered here (MVP):** 14 pages, design system, two lead forms plus contact, SEO/analytics
wiring, build and deploy setup, this proposal and a founder README.

**To launch (estimated 1–2 weeks, mostly waiting on content):**

| Step | Effort |
|---|---|
| Connect repo to Netlify, set domain, test forms end-to-end | 2 hours |
| Drop in founder details, real email, socials, analytics ID | 1 hour |
| Replace vector art with licensed hero/story media | 2–4 hours once files exist |
| Legal/compliance read of medical copy, privacy, terms | external |
| Zapier/Make hook from Netlify Forms to Sheets or CRM | 1 hour |

**Phase 2 (when needed):** Decap CMS admin (½ day), testimonials and gallery sections (1 day), additional
festival pages (½ day each from the template), specialty pages for MVT (½ day each after verification),
multi-date reservation with deposit via Stripe Payment Links (1 day).

**Price.** This work was produced in an AI coding session rather than by an agency, so there is no fee to
quote. For context, a comparable custom MVP from a freelancer or small studio typically runs a few thousand
to low five figures USD; hosting on Netlify's free tier is USD 0 until traffic is substantial, and Framer or
Webflow would add USD 20–40/month if you move to a visual editor later.

## Compliance notes baked into the copy

- No outcome guarantees, no diagnosis, no "best hospital", no savings percentages, no named providers,
  no prices, anywhere on the medical pages.
- The facilitator role and the limits of it are stated on every medical page, in the footer, in the
  inquiry consent text and in the terms.
- Visa statements are limited to the existence of e-Tourist, e-Medical and e-Medical Attendant categories
  and that decisions rest with the Government of India.
- Medical records are explicitly excluded from all forms and email, with a promise of a separate secure,
  consented channel.
