const fs = require("fs");
let html = fs.readFileSync("ForbiddenMemoriesReborn/FMR_V3_0_7_BANDAI1998_MENU.html","utf8");

// CP1252 0x80-0x9F range that gets wrongly treated as ? by Latin-1
// Only apply TARGETED word replacements for known Spanish uppercase words
// Pattern: word with ? where an uppercase accented char belongs
const wordFixes = [
  // Ó (most common)
  [/FUSI\?N/g,        "FUSIÓN"],
  [/POSICI\?N/g,      "POSICIÓN"],
  [/INVOCACI\?N/g,    "INVOCACIÓN"],
  [/INFORMACI\?N/g,   "INFORMACIÓN"],
  [/ACTIVACI\?N/g,    "ACTIVACIÓN"],
  [/SELECCI\?N/g,     "SELECCIÓN"],
  [/ANIMACI\?N/g,     "ANIMACIÓN"],
  [/REACCI\?N/g,      "REACCIÓN"],
  [/SINCRONIZACI\?N/g,"SINCRONIZACIÓN"],
  [/CREACI\?N/g,      "CREACIÓN"],
  [/DESCRIPCI\?N/g,   "DESCRIPCIÓN"],
  [/CAMPE\?N/g,       "CAMPEÓN"],
  [/IC\?NICA/g,       "ICÓNICA"],
  [/IC\?NICO/g,       "ICÓNICO"],
  [/MENCI\?N/g,       "MENCIÓN"],
  [/PROTECCI\?N/g,    "PROTECCIÓN"],
  [/DESTRUCCI\?N/g,   "DESTRUCCIÓN"],
  [/\?PTIMO/g,        "ÓPTIMO"],
  [/EJECUCI\?N/g,     "EJECUCIÓN"],
  // Ñ
  [/MA\?ANA/g,        "MAÑANA"],
  [/ESPA\?A/g,        "ESPAÑA"],
  [/CAMPA\?A/g,       "CAMPAÑA"],
  [/PEQUE\?O/g,       "PEQUEÑO"],
  // É 
  [/DECISI\?N/g,      "DECISIÓN"],
  [/T\?CNICA/g,       "TÉCNICA"],
  [/T\?CNICO/g,       "TÉCNICO"],
  // Á
  [/M\?GICO/g,        "MÁGICO"],
  [/M\?GICA/g,        "MÁGICA"],
  [/M\?XIMO/g,        "MÁXIMO"],
  // compound CSS/token words
  [/FUSIONES_DISC/g,  "FUSIONES_DISC"], // keep
];

let totalFixed = 0;
wordFixes.forEach(([pattern, replacement]) => {
  const before = (html.match(pattern)||[]).length;
  if(before > 0) {
    html = html.replace(pattern, replacement);
    console.log("Fixed", before, "x", replacement);
    totalFixed += before;
  }
});

// Also fix CSS content values that have garbled chars
// content:"FUSI?N" appears in CSS pseudo-elements
console.log("\nTotal replacements:", totalFixed);

// Verify
const remainingQ = (html.match(/[A-Z]\?[A-Z]/g)||[]).length;
console.log("Remaining ?-in-uppercase-words:", remainingQ);
if(remainingQ > 0) {
  const matches = html.match(/[A-Z][A-Z]?\?[A-Z]{2}/g)||[];
  [...new Set(matches)].slice(0,20).forEach(m => console.log("  Remaining:", m));
}

fs.writeFileSync("ForbiddenMemoriesReborn/FMR_V3_0_7_BANDAI1998_MENU.html", html, "utf8");
console.log("Saved.");