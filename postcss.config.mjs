// PostCSS runs over every stylesheet and every component <style> block
// (Vite picks this file up by itself). Its one job here: named media
// queries. See src/lib/media-queries.js.

import postcssCustomMedia from "postcss-custom-media"
import { customMediaDefinitions } from "./src/lib/media-queries.js"

// Custom media only resolves names defined in the same stylesheet, and each
// component's <style> is a stylesheet of its own. So every one gets the
// definitions added at the top, and postcss-custom-media then swaps each
// `(--below-desktop)` for its query and removes the definitions again.
const defineCustomMedia = () => ({
  postcssPlugin: "define-custom-media",
  Once: (root, { parse }) => {
    root.prepend(parse(customMediaDefinitions))
  },
})
defineCustomMedia.postcss = true

export default {
  plugins: [defineCustomMedia(), postcssCustomMedia()],
}
