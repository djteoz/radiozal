import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    apiVersion: 0,
    version: "a1b2c3d",
    data: {
      type: "page",
      title: "Privacy Policy",
      url: "/settings/privacy-policy",
      content: [
        {
          type: "html",
          html: `<p><em>Effective date: April 01, 2026</em></p>
<p>Радио Зал ('us', 'we', or 'our') operates the radiozal.ru website (hereinafter referred to as the 'Service').</p>
<p>This page informs you of our policies regarding the collection, use and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
<p>We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.</p>
<h2>Information Collection and Use</h2>
<p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
<h3>Usage Data</h3>
<p>We may collect information that your browser sends whenever you visit our Service ('Usage Data'). This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</p>
<h3>Location Data</h3>
<p>We may use and store information about your approximate location based on your IP address ('Location Data'). We use this data to provide features of our Service, such as showing nearby radio stations.</p>
<h3>Cookies</h3>
<p>We use cookies and similar tracking technologies to track the activity on our Service and we hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
<h2>Use of Data</h2>
<p>Радио Зал uses the collected data for various purposes:</p>
<ul>
<li>To provide and maintain our Service</li>
<li>To notify you about changes to our Service</li>
<li>To provide customer support</li>
<li>To gather analysis or valuable information so that we can improve our Service</li>
<li>To monitor the usage of our Service</li>
<li>To detect, prevent and address technical issues</li>
</ul>
<h2>Third-Party Services</h2>
<h3>MapTiler</h3>
<p>We use MapTiler for satellite map imagery. Their privacy policy can be found at <a href="https://www.maptiler.com/privacy-policy/">maptiler.com/privacy-policy</a>.</p>
<h2>Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us by email: <a href="mailto:info@radiozal.ru">info@radiozal.ru</a>.</p>`,
        },
      ],
    },
  });
}
