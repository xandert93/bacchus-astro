import fs from "node:fs"; import postcss from "postcss"
const root=postcss.parse(fs.readFileSync("src/styles/global.css","utf8"))
root.walkRules(r=>{ if(r.parent.type==="atrule"&&/keyframes/.test(r.parent.name))return
 const at=[];let p=r.parent;while(p&&p.type==="atrule"){at.unshift("@"+p.name+" "+p.params.slice(0,30));p=p.parent}
 console.log(r.source.start.line+"\t"+(at.length?"["+at.join(" ")+"] ":"")+r.selector.replace(/\s+/g," "))})
