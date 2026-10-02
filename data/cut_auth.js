const fs = require("fs");
let patch = fs.readFileSync("C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js","utf8");

// Find the start of the old auth IIFE
const marker = "// ========================= AUTH IIFE =========================";
const markerOld = "// ????????????????????????????????????????????????????????????????";
let authStart = patch.indexOf(marker);
if(authStart < 0) authStart = patch.indexOf(markerOld);
if(authStart < 0) authStart = patch.indexOf("// PPPPPPPPPPPPPP");
if(authStart < 0) {
  // Try finding start of auth by looking for the IIFE
  authStart = patch.indexOf("\n\n(function() {\n  var SERVER_MODE = false;");
  if(authStart >= 0) authStart += 2; // skip leading newlines
}
console.log("Auth IIFE starts at:", authStart);
if(authStart < 0) {
  console.log("Could not find auth start! End of patch:", patch.substring(patch.length-300));
  process.exit(1);
}

// Cut everything from authStart onward and replace
patch = patch.substring(0, authStart);
fs.writeFileSync("C:/Deploy/proyectoygo/ForbiddenMemoriesReborn/clean_map_patch.js", patch, "utf8");
console.log("Cut at:", authStart, "new size:", patch.length);