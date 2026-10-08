# Images

How photos get from the originals to the page.

---

## Rendering

- **Use a key, never a path.** `src/lib/images.ts` looks photos up as
  `"venue/ballroom-night"`; an unknown key fails the build.
- Render with `<Photo src="key" alt sizes>` (any photo), `<HeroImage>` (page
  heroes), `<NavPanelPhoto>` (dropdown panels, lazy via `data-src`), or
  `getImage()` for CSS backgrounds (see `MobileMenu`).
- **AVIF first with a WebP fallback**, each at its own quality (hence
  `getImage()` twice rather than `<Picture>`).
- **`sizes` must describe the real drawn width**: object-fit cover, scale
  animations, grid columns. Otherwise browsers pick a file that's too small.
  Breakpoints in `sizes` come from `src/lib/media-queries.js`
  (`${below.desktop} 100vw, 50vw`), so they always match the layout.
- **`<picture>` is `display: contents` sitewide**, so it never affects
  layout. Any `> img` child selector needs a `> picture > img` twin.
- **`<Photo>` is lazy by default**: the browser fetches it only as it nears
  the screen. Only a photo in the first screenful passes `loading="eager"`
  (the header's logo); heroes are always eager, with `fetchpriority="high"`.
- **No photo's largest copy is wider than 3200px** (`LARGEST_WIDTH` in
  `Photo.astro`), however big the original. It's also what the lightbox
  shows.

---

## Sources

- **Always build from the untouched originals.** Resizing an
  already-compressed web copy compresses twice (measured 40.7 vs 43.2 dB
  PSNR, at a larger file).
- Originals come from the prototype's `images/originals/` (25 JPEGs).
- Photos without one are listed in `WEB_COPY_ONLY` in `images.ts`: served
  untouched at their own size, with only smaller variants generated. That
  list is the request list for Bacchus. **When an original arrives**:
  replace the file, delete its entry.
- `src/assets/images/` holds every photo the pages place themselves, by
  subject.

---

## Photos stored in Sanity

The gallery, the signature dishes and the stations are photos the client
manages, so they're uploaded in the Studio rather than kept here.

- **Same pipeline.** `<Photo>` takes a Sanity photo (`RemotePhoto`, from
  `src/lib/sanity/photos.ts`) as well as a key. Astro downloads the untouched
  upload from Sanity's CDN at build time and makes the AVIF and WebP copies
  as usual; visitors are served this site's files, never Sanity's.
  `cdn.sanity.io` is the only domain allowed (`image.domains` in
  `astro.config.mjs`).
- **Web copies** are flagged in the Studio ("Web copy — the original is
  still to come") rather than listed in `WEB_COPY_ONLY`. Upload the original
  when it arrives and untick it.
- **Hotspot and crop** set in the Studio are ignored for now: tiles crop with
  CSS `object-fit: cover`, as before.
- A photo can be both here and in Sanity (the Daisy blinis are in the
  Weddings page's package card and in Reception's dishes). They're two uses
  with two owners: the page's design, and the client's content.
