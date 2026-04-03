/**
 * Parse the locale file correctly by evaluating it as a JS module.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const enPath = path.join(__dirname, "..", "public", "assets", "b", "en-MnKurk0p.js");
const enContent = fs.readFileSync(enPath, "utf8");

// The file format is ES module: const e=JSON.parse('...');export{e as messages};
// We can't directly import it, but we can evaluate the JSON.parse part.
// Extract the actual argument to JSON.parse - it's a JS string literal using single quotes.
// We need to evaluate it as a JS expression.

const start = enContent.indexOf("JSON.parse('") + "JSON.parse('".length;
const end = enContent.lastIndexOf("');export");
const jsStringContent = enContent.substring(start, end);

// This is the CONTENT of a JS single-quoted string literal.
// In JS, \' is escaped single quote, \\\\ is escaped backslash, \\" is escaped double quote inside the string.
// To get the actual JSON, we evaluate it as a JS string expression.
const sandbox = { result: null };
vm.runInNewContext(`result = '${jsStringContent}'`, sandbox);
const jsonStr = sandbox.result;

const messages = JSON.parse(jsonStr);
console.log("Parsed", Object.keys(messages).length, "keys");

// Save as clean JSON for the translation script to use
fs.writeFileSync(path.join(__dirname, "_en-messages.json"), JSON.stringify(messages), "utf8");
console.log("Saved _en-messages.json");
