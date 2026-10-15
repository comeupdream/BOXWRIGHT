# Experience India — website

Mobile-first, static marketing site for **Experience India**: immersive festival journeys (Explore India) and
Medical Value Travel facilitation, two paths under one brand. Built from the September 2026 design brief;
the design rationale, sitemap and platform recommendation are in [PROPOSAL.md](PROPOSAL.md).

No framework, no dependencies. Plain HTML pages assembled by a 150-line Node script, one config file for the
things that change most often, and forms that work on Netlify with zero setup.

## Run it

```bash
cd experience-india
npm run dev      # builds to dist/ and serves http://localhost:4173, rebuilding on change
npm run build    # builds dist/ (what the host runs)
npm run check    # build, and fail on any unresolved {{ variable }} or include
```

Node 18+ is the only requirement. There is nothing to install.

## Layout

```
site.config.json   brand, contact email, social links, form endpoints, analytics ID, flagship
                   experience details (dates, group size, pricing status). Edit this first.
pages/             one HTML file per page. First line is the page's title/description.
partials/          head (SEO, fonts, analytics), header/nav, footer, MVT disclaimer, CTA band.
assets/css/site.css  the design system: colours, type, every reusable component.
assets/js/site.js    mobile menu, scroll reveal, CTA/lead tracking, external-endpoint form submit.
assets/img/        original vector art used until licensed photography/video replaces it.
build.mjs          the generator. Also writes sitemap.xml and copies robots.txt / favicon.
netlify.toml       one-click Netlify deploy (base dir experience-india, publish dist).
```

## Pages

| URL | Purpose |
|---|---|
| `/` | Home: hero, two-path choice, featured experience, why different, MVT intro, how it works, founder, FAQ, CTA |
| `/explore-india` | Cultural concept, first experience, future festivals |
| `/ganesh-chaturthi-2027` | Flagship landing page: idea, why, experience, draft itinerary, who/group/pricing, FAQ |
| `/how-it-works` | Inquiry → consultation → reservation → preparation → experience |
| `/waitlist` | Cultural interest-list form |
| `/medical-value-travel` | What MVT is, what we do / don't do, journey overview, patients, attendants, trust |
| `/how-medical-travel-works` | 10-step patient journey with who-owns-what |
| `/medical-inquiry` | Private medical inquiry form with consent |
| `/why-experience-india`, `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/thanks` | Company, trust and legal pages |

## Everyday edits (no developer needed)

- **Dates, group size, pricing status, response time, email, social links:** `site.config.json`.
- **Words on a page:** open the page in `pages/`, change the text, save. Keep the tags around it.
- **FAQ:** each question is a `<details><summary>Question</summary><p>Answer</p></details>` block. Copy one to add one.
- **Itinerary:** each day is an `<li>` in `pages/ganesh-chaturthi-2027.html`. The `<span class="tag draft">` chips mark unconfirmed items; delete a chip when that item is confirmed.
- **Add a festival experience:** copy `pages/ganesh-chaturthi-2027.html` to a new file (its filename becomes the URL), change the text, add a card on `explore-india.html`.
- **Hero video/photo:** in `pages/index.html` the hero has a commented `<video>` tag. Drop licensed footage in `assets/video/`, uncomment it, and keep a licence record.
- **Analytics:** paste a GA4 ID or Plausible domain into `site.config.json`. CTA clicks and form submissions are sent as events automatically.

Pushing to the connected branch redeploys the site.

## Forms

Both lead forms (`cultural-waitlist`, `medical-inquiry`) and the contact form are marked up for
**Netlify Forms**: deploy on Netlify and submissions appear in the dashboard, with email notifications and
CSV export, or a Zapier/Make hook to Google Sheets or a CRM. Leave the `forms.*Action` values empty for this.

To use another backend (Formspree, Basin, a Google Apps Script web app), paste its URL into
`forms.waitlistAction` / `forms.medicalAction` / `forms.contactAction`; the page then submits with `fetch`
and shows an inline success panel. Every submission also carries a hidden `source` field with the UTM
parameters or referrer the visitor arrived with, so you can see which video sent them.

The medical form deliberately collects **no medical records** and requires an explicit consent checkbox.
Records, if ever needed, go through a separate secure channel a provider controls.

## Deploy

- **Netlify (recommended):** New site from Git → pick this repo → base directory `experience-india`. `netlify.toml`
  supplies the rest. Forms work immediately.
- **Render (Blueprint):** the repo's root `render.yaml` already defines an `experience-india` static service.
  In Render: New → Blueprint → pick this repo and branch → Apply. It builds only this folder and redeploys on
  every push that touches it. Render has no built-in forms, so paste a Formspree / Basin / Apps Script endpoint
  into `forms.*Action` in `site.config.json` first.
- **Vercel / Cloudflare Pages:** build command `node build.mjs`, output `dist`, root `experience-india`.
  Forms then need an endpoint in `site.config.json`.

Pages are written as clean-URL folders (`dist/explore-india/index.html`), so `/explore-india` works on every host.

### Preview bundle

`node build.mjs --bundle` also writes `dist/preview.html`: the whole site in one file with a hash router
(`#explore-india`, `#medical-inquiry`, …) and simulated forms, for sharing a clickable preview anywhere a single
HTML file can be hosted.

Set `brand.url` in `site.config.json` to the real domain before launch so canonical URLs, Open Graph tags and
`sitemap.xml` are correct.
