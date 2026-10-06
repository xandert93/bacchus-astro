// Gallery page only: keeps ?filter= in the URL in step as the visitor clicks
// between categories, so the current view can be shared, bookmarked and
// refreshed. replaceState, not pushState — a history entry per click would
// turn Back into "step through every filter tried" instead of leaving.
//
// The INCOMING ?filter= is applied by the is:inline script in gallery.astro,
// not here: this module runs after the grid has painted, which is one paint
// too late (the late filter seed). The filtering itself is pure CSS.
const gfilter = document.getElementById("gfilter")

gfilter?.addEventListener("change", (e) => {
  const id = e.target && e.target.id
  if (!id || !id.startsWith("gf-")) return
  const value = id.slice(3)
  const url = new URL(location.href)
  if (value === "all") url.searchParams.delete("filter")
  else url.searchParams.set("filter", value)
  history.replaceState(null, "", url.pathname + url.search + url.hash)
})
