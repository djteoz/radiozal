/**
 * Quick smoke test for all API endpoints.
 */
const BASE = "http://localhost:3000";

async function test(name, url, opts = {}) {
  try {
    const fetchOpts = opts.method ? { method: opts.method, headers: opts.headers, body: opts.body } : {};
    const res = await fetch(BASE + url, fetchOpts);
    const data = await res.json();
    const ok = res.status === 200;
    console.log(ok ? "✓" : "✗", name, `(${res.status})`, opts.check ? opts.check(data) : "");
  } catch (e) {
    console.log("✗", name, e.message);
  }
}

(async () => {
  await test("Browse", "/api/ara/content/browse", {
    check: d => `${d.data.content[0].items.length} countries, itemsType=${d.data.content[0].itemsType}`
  });

  // Get first country ID for drill-down
  const browseRes = await fetch(BASE + "/api/ara/content/browse").then(r => r.json());
  const firstCountry = browseRes.data.content[0].items[0];
  const countryId = firstCountry.page.url.split("/").pop();

  await test("Browse Country", `/api/ara/content/browse/${countryId}`, {
    check: d => `${d.data.content[0].items.length} cities`
  });

  await test("Search landing", "/api/ara/content/search", {
    check: d => `${d.data.content[0].items.length} popular stations`
  });

  await test("Search query", "/api/search?q=jazz", {
    check: d => `${d.hits.hits.length} results`
  });

  await test("Favorites (empty)", "/api/ara/content/favorites/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favorites: [] }),
    check: d => `${d.data.length} items`
  });

  await test("Settings", "/api/ara/content/settings/index", {
    check: d => d.data.content.map(c => c.title).join(", ")
  });

  await test("Settings About", "/api/ara/content/settings/about", {
    check: d => d.data.title
  });

  await test("Settings Contact", "/api/ara/content/settings/contact", {
    check: d => d.data.title
  });

  await test("Version", "/api/ara/content/version");
  await test("Geo", "/api/geo");
  await test("Places Core", "/api/ara/content/places-core-columnar");

  console.log("\nDone!");
})();
