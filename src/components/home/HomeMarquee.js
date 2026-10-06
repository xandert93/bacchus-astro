// Doubles the marquee's run of words so the CSS loop (translateX -50%)
// is seamless. Loaded by HomeMarquee.astro.

const mt = document.getElementById("mtrack")
if (mt) mt.innerHTML = mt.innerHTML + mt.innerHTML
