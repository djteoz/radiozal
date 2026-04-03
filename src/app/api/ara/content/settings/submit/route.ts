import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    apiVersion: 0,
    version: "a1b2c3d",
    data: {
      type: "page",
      title: "Submit a Radio Station",
      url: "/settings/submit",
      content: [
        {
          type: "html",
          html: `<p>To submit a radio station to Радио Зал, please send an email to <a href="mailto:info@radiozal.ru">info@radiozal.ru</a> with the following information:</p>
<ul>
<li>Station name</li>
<li>Stream URL</li>
<li>City and country</li>
<li>Website (optional)</li>
</ul>
<p>If you want to propose a change to an existing station, please include the current and updated information in your email.</p>`,
        },
      ],
    },
  });
}
