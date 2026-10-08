// The file a request path maps to in a build, in either output layout:
// weddings.html (build.format "file", the site's layout since 2026-10-08) or
// weddings/index.html (the folder layout before it, so a build from before
// then can still be compared). Null when there's no such file.
import fs from "node:fs"
import path from "node:path"

export const pageFile = (dist, requestPath) => {
  const base = path.join(dist, decodeURIComponent(requestPath))
  const candidates = [base, `${base}.html`, path.join(base, "index.html")]

  return (
    candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null
  )
}
