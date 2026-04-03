import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    apiVersion: 0,
    version: "a1b2c3d",
    data: {
      type: "page",
      title: "Радио Зал",
      url: "/settings/radio-garden",
      content: [
        {
          type: "html",
          html: `<p>Радио Зал invites you to explore live radio from around the world.</p>
<p>By bringing distant voices close, radio connects people and places. From its very beginning, radio signals have crossed borders. Radio makers and listeners have imagined both connecting with distant cultures, as well as re-connecting with people from 'home' from thousands of miles away.</p>
<h3>Technologies &amp; Services</h3>
<p>Many thanks to the following products, libraries and services:</p>
<ul>
<li><p>3D globe – <a href="https://maplibre.org">MapLibre</a></p></li>
<li><p>Satellite imagery – <a href="https://www.maptiler.com/">MapTiler</a></p></li>
<li><p>Station data – <a href="https://www.radio-browser.info/">RadioBrowser API</a>, <a href="https://fmstream.org/">FMSTREAM</a>, <a href="https://streamurl.link/">StreamURL</a></p></li>
<li><p>Typeface – <a href="https://commercialtype.com/catalog/atlas">Atlas Grotesk</a></p></li>
</ul>`,
        },
      ],
    },
  });
}
