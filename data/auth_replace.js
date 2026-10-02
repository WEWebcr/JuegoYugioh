const fs = require("fs");
let patch = fs.readFileSync("C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js","utf8");

// Find the auth IIFE end section starting from "interceptNow" comment
// The section to replace starts at the comment after buildLoginUI ends
const marker1 = "  interceptNow(); // <-- SINCRONO, pre-DOMContentLoaded";
const idx1 = patch.indexOf(marker1);
console.log("marker1 at:", idx1);

if(idx1 >= 0) {
  // Find the start of the comment block just before interceptNow
  const commentBefore = patch.lastIndexOf("  // ", idx1-5);
  console.log("comment before at:", commentBefore, "->", patch.substring(commentBefore, commentBefore+60));
  
  // Find the end of the IIFE: })();
  const endIife = patch.indexOf("})();", idx1);
  console.log("endIife at:", endIife);
  
  const beforeSection = patch.substring(0, commentBefore);
  const replacement = process.argv[2];
  
  patch = beforeSection + replacement;
  fs.writeFileSync("C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js", patch, "utf8");
  console.log("Done. New size:", patch.length);
} else {
  console.log("Marker not found!");
  const altIdx = patch.indexOf("function interceptNow");
  console.log("interceptNow function at:", altIdx);
  if(altIdx>=0) console.log("Context:", patch.substring(altIdx-100, altIdx+100));
}