const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'radio-garden-source.html');
const dst = path.join(__dirname, '..', 'public', 'rg.html');

let html = fs.readFileSync(src, 'utf8');

// Replace asset URLs to local paths
html = html.replaceAll('https://radio.garden/assets/b/', '/assets/b/');
html = html.replaceAll('https://radio.garden/fonts/', '/fonts/');

// Replace font-face URLs in inline CSS
html = html.replace(/url\('https:\/\/radio\.garden\/fonts\//g, "url('/fonts/");

// Replace API geo preload to local
html = html.replaceAll('https://radio.garden/api/geo', '/api/geo');

// Remove the .org domain redirect script (first script in body)
html = html.replace(
  /<script>!function\(\)\{window\.location\.host\.indexOf\("\.org"\).*?<\/script>/,
  ''
);

// Remove Google ads script block
html = html.replace(
  /<script>!function\(\)\{var e=!!window\.navigator\.webdriver.*?<\/script>/,
  ''
);

fs.writeFileSync(dst, html, 'utf8');

// Report
const remaining = (html.match(/radio\.garden/g) || []);
console.log('Written:', dst);
console.log('Size:', html.length, 'bytes');
console.log('Remaining radio.garden refs:', remaining.length);

// Show what's left
const urls = [...new Set(html.match(/https:\/\/radio\.garden[^'"\s<>)]+/g) || [])];
if (urls.length > 0) {
  console.log('Remaining URLs (meta/icons only):');
  urls.forEach(u => console.log('  ', u));
}
