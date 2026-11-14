# One Way Window Cleaning — website

Website for **One Way Window Cleaning LLC** (owner: Vinson Sochirca, 509-770-5633).
Designed to match the business card: the hero is the card front in daylight, the
contact section is the card back re-set in light mode, and the footer is the printed
black card.

Plain HTML/CSS/JS: no build step, no framework.

```
index.html      the whole page
styles.css      all styling (colors and fonts are at the top in :root)
main.js         sticky header, the free-estimate form, scroll effects and the squeegee glass
assets/         logo, service icons, favicon, social share image
fonts/          Montserrat + Manrope (self-hosted, SIL Open Font License)
```

## Editing

- **Text:** everything is in `index.html`. Services are in the `#services` list.
- **Phone / email:** search `index.html` and `main.js` for `509-770-5633`,
  `+15097705633` and `sochircavinson@gmail.com`.
- **Colors:** the `:root` block at the top of `styles.css`.

## The squeegee glass

The "Drag the squeegee" window on the home page and the hard water guide is the
`.sq` block in the HTML, the `squeegee glass` section of `styles.css` and the last
module in `main.js`. The view behind the glass is the inline SVG `.sq__scene`; the
grime is painted onto a canvas from that same SVG, so editing the scene updates
both. Without JavaScript it falls back to a static before/after split.

## The estimate form

The form has no backend. On submit it opens the visitor's email app with the
details filled in, addressed to `sochircavinson@gmail.com`. To receive submissions
directly instead, point the form at a service such as Formspree or Netlify Forms.

## Going live

Any static host works. The simplest options:

- **Vercel or Netlify:** import this repo, leave the build settings empty, deploy.
  Then add `onewaywindowcleaning.com` under the project's domains and follow the
  DNS instructions they show.
- **GitHub Pages:** Settings → Pages → deploy from `main` / root. On a free GitHub
  plan this needs the repo to be public.

The QR code on the printed cards points to `https://onewaywindowcleaning.com`, so the
domain should be connected before the cards go out.
