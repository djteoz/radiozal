import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    apiVersion: 0,
    version: "a1b2c3d",
    data: {
      type: "page",
      title: "Contact",
      url: "/settings/contact",
      content: [
        {
          type: "html",
          html: `<p>We appreciate your feedback. While we don't provide technical support directly, we do value your input. Rest assured that every email, feature request, and bug report is carefully reviewed and considered by our team. Your insights help us improve Радио Зал for everyone.</p>
<p>Share your feedback and suggestions with us at <a href="mailto:info@radiozal.ru">info@radiozal.ru</a>.</p>`,
        },
      ],
    },
  });
}
