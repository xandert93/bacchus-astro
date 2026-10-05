// Compare two snapshots from style-snapshot.mjs and print what changed,
// grouped by element class and property. Zero changes = a pure refactor.
//   node scripts/style-diff.mjs before.json after.json
import fs from "node:fs"
// Elements are matched by DOM position, not by class list, so a refactor
// that renames or removes a class still compares like with like.
const byPath = (snapshot) =>
  Object.fromEntries(
    Object.entries(snapshot).map(([page, els]) => [
      page,
      Object.fromEntries(
        Object.entries(els).map(([k, v]) => [
          k.split(" .")[0],
          { ...v, __class: k.split(" .")[1] ?? "" },
        ]),
      ),
    ]),
  )
const [a, b] = process.argv
  .slice(2)
  .map((f) => byPath(JSON.parse(fs.readFileSync(f, "utf8"))))
for (const page of Object.keys(a)) {
  const A = a[page],
    B = b[page] ?? {}
  const groups = new Map()
  let total = 0
  for (const el of Object.keys(A)) {
    if (!B[el]) {
      groups.set(`missing element ${el}`, 1)
      continue
    }
    for (const prop of Object.keys(A[el])) {
      if (prop === "__class" || A[el][prop] === B[el][prop]) continue
      const cls = A[el].__class || el.split("/").pop()
      const key = `${cls} :: ${prop} :: ${A[el][prop]} -> ${B[el][prop]}`
      groups.set(key, (groups.get(key) ?? 0) + 1)
      total++
    }
  }
  console.log(`== ${page}: ${total} changed values`)
  for (const [k, n] of groups) console.log(`   ${n}x ${k.slice(0, 220)}`)
}
