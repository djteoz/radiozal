// Find all content section type references in the RG index.js
const f = require('fs').readFileSync('public/assets/b/index-DM4_1W1y.js', 'utf8');

// Find switch case patterns for content type rendering
const caseMatches = f.match(/case"[a-z][\w-]*":/g);
if (caseMatches) {
  const unique = [...new Set(caseMatches)].sort();
  console.log('=== switch cases ===');
  unique.forEach(m => console.log(m));
}

// Find type: "string" patterns
const typeMatches = f.match(/type:"[a-z][\w-]*"/g);
if (typeMatches) {
  const unique = [...new Set(typeMatches)].sort();
  console.log('\n=== type:"..." values ===');
  unique.forEach(m => console.log(m));
}

// Find specific Browse-related patterns
const browseIdx = f.indexOf('"browse"');
if (browseIdx > -1) {
  // Find nearby content rendering
  const around = f.substring(Math.max(0, browseIdx - 200), browseIdx + 200);
  console.log('\n=== browse context ===');
  console.log(around);
}
