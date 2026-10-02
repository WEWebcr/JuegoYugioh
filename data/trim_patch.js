const fs = require("fs");
let patch = fs.readFileSync("C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js","utf8");

// Find the start of old overlay section
const markerStart = "  // ==== OVERLAY DIRECTO ====";
const idx = patch.indexOf(markerStart);
if(idx >= 0) {
  patch = patch.substring(0, idx);
  console.log("Old overlay section found, cut at:", idx);
} else {
  // No old section - find after the fetchsaves line
  const fetchLine = "    .catch(function() { SERVER_MODE = false; SERVER_CHECK_DONE = true; });";
  const fetchIdx = patch.lastIndexOf(fetchLine);
  if(fetchIdx >= 0) {
    patch = patch.substring(0, fetchIdx + fetchLine.length);
    console.log("Kept up to fetch line at:", fetchIdx);
  }
}

fs.writeFileSync("C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js", patch, "utf8");
console.log("Trimmed size:", patch.length);