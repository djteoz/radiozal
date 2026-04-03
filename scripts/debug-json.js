// Debug JSON parsing
const fs = require("fs");
const f = fs.readFileSync("public/assets/b/en-MnKurk0p.js", "utf8");
const start = f.indexOf("JSON.parse('") + "JSON.parse('".length;
const end = f.lastIndexOf("');export");
const jsonStr = f.substring(start, end);

// The issue: the JSON string is inside JS single quotes,
// so internal single quotes are escaped as \'
// We need to unescape them for JSON.parse
const unescaped = jsonStr.replace(/\\'/g, "'");

try {
  const obj = JSON.parse(unescaped);
  console.log("SUCCESS! Keys:", Object.keys(obj).length);
  fs.writeFileSync("scripts/_en-messages.json", JSON.stringify(obj, null, 0), "utf8");
  console.log("Saved to scripts/_en-messages.json");
} catch (err) {
  console.error("Still failed:", err.message);
  // Find problematic area
  const pos = parseInt(err.message.match(/position (\d+)/)?.[1] || "0");
  console.log("Around pos", pos, ":", JSON.stringify(unescaped.substring(pos - 20, pos + 20)));
}
