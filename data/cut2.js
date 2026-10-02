const fs = require("fs");
let patch = fs.readFileSync("C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js","utf8");
const marker = "// ========================= AUTH IIFE =========================";
const idx = patch.indexOf(marker);
if(idx >= 0) {
  patch = patch.substring(0, idx);
  console.log("Cut old auth IIFE at:", idx);
} else {
  console.log("Marker not found");
}
fs.writeFileSync("C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js", patch, "utf8");