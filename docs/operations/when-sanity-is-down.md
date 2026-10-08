# When Sanity is down

What still works when Sanity has an outage, and how to make an urgent content
change without the Studio. Written after the 8 October 2026 incident, when
the Studio sat on "Trying to connect…" for most of a day.

Check [sanity-status.com](https://www.sanity-status.com/) first: it says
which parts are affected.

---

## What an outage affects

Sanity has three parts that can fail separately:

| Part                                   | Used by                   | If it's down                                        |
| -------------------------------------- | ------------------------- | --------------------------------------------------- |
| **Live updates** (the "listener")      | The Studio                | The Studio can't load or edit. Nothing else breaks. |
| **The API** (reading and writing data) | Every build, the CLI      | No build can run, not even a code-only change.      |
| **The image CDN** (`cdn.sanity.io`)    | Builds that resize photos | Builds fail on any photo they hadn't cached.        |

**The live site never goes down with Sanity.** It's static HTML on
Cloudflare, built before the outage. A failed build leaves the last good
version live.

---

## Studio down, API up (the 8 October case)

The Studio is just one way to edit. The CLI talks to the API directly, so a
developer can still make the change. Publishing this way triggers the
rebuild webhook like any other publish.

From inside `sanity/`, logged in (`npx sanity login`):

1. **Find the document's ID.** The ID is in the Studio's URL when it works;
   otherwise query for it, e.g. every testimonial's:
   `npx sanity documents query '*[_type == "testimonial"]{_id, displayName}'`
2. **Save it to a file**: `npx sanity documents get <id> > edit.json`
3. **Edit `edit.json`** in VS Code. Change only the fields you mean to.
4. **Write it back**: `npx sanity documents create edit.json --replace`.
   This replaces the published document with the file, so do steps 2 to 4
   in one go: an edit made in between would be overwritten.
5. **Delete `edit.json`** and watch Cloudflare start the build.

Reading (steps 1 and 2) was tested during the 8 October outage. Writing
(step 4) hasn't been needed yet; try it on something harmless the first
time, like a testimonial's order.

---

## API down

No build can run, because every page reads its content during the build.
That includes a code-only fix. The options, in order:

1. **Wait.** The live site is unaffected meanwhile.
2. **Patch a built copy by hand**, for something that can't wait (a wrong
   price, say). Any `npm run build` from before the outage leaves the whole
   site in `dist/`. Edit the page's HTML there, then deploy that folder with
   `npx wrangler deploy` from the repo root (it asks you to log in to
   Cloudflare the first time). Make the same change in Sanity once it's
   back, or the next build undoes it.
