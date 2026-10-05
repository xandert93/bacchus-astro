import fs from "node:fs"; import path from "node:path"; import postcss from "postcss"
const walk=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])
const strip=(t)=>t.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\{\/\*[\s\S]*?\*\/\}/g,"").replace(/<!--[\s\S]*?-->/g,"").replace(/^\s*\/\/.*$/gm,"")
const files=walk("src").filter(f=>/\.(astro|js|ts)$/.test(f))
const where=new Map()
for(const f of files){const t=strip(fs.readFileSync(f,"utf8")); for(const w of new Set(t.match(/[\w-]+/g))){if(!where.has(w))where.set(w,new Set()); where.get(w).add(path.relative("src",f).split(path.sep).join("/"))}}
const root=postcss.parse(fs.readFileSync("src/styles/global.css","utf8"))
const groups=new Map(); let lines=0
root.walkRules(r=>{ if(r.parent.type==="atrule"&&/keyframes/.test(r.parent.name))return
  const cls=[...new Set([...r.selector.matchAll(/\.([\w-]+)/g)].map(m=>m[1]))]
  let key
  if(!cls.length) key="(no classes: elements/root/tokens)"
  else { const fs_=new Set(); cls.forEach(c=>(where.get(c)||[]).forEach(f=>fs_.add(f))); key=[...fs_].sort().join(" + ")||"(unused)" }
  const n=r.toString().split("\n").length
  const g=groups.get(key)||{rules:0,lines:0,sample:new Set()}; g.rules++; g.lines+=n; cls.slice(0,2).forEach(c=>g.sample.size<6&&g.sample.add(c)); groups.set(key,g)})
for(const [k,g] of [...groups].sort((a,b)=>b[1].lines-a[1].lines)) console.log(String(g.lines).padStart(5), String(g.rules).padStart(4), k.slice(0,150), "|", [...g.sample].join(" "))
