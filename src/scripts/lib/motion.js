// True when the visitor has asked their OS for reduced motion. Read once at
// load, as main.js always did.
export const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
