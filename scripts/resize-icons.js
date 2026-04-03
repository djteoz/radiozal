const sharp = require("sharp");
const path = require("path");

async function main() {
  const src = path.join(__dirname, "..", "public", "logo.png");
  const pub = (...parts) => path.join(__dirname, "..", "public", ...parts);
  
  // Trim white borders, keep the FULL logo as-is
  const trimmed = await sharp(src)
    .trim({ threshold: 20 })
    .toBuffer();

  const sizes = [
    { name: "favicon-32.png", size: 32 },
    { name: "favicon.png", size: 64 },
    { name: "app-icon.png", size: 120 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-192.png", size: 192 },
  ];

  for (const { name, size } of sizes) {
    // Fit entire logo into square, white background (for apple-touch-icon) or transparent
    const isApple = name === "apple-touch-icon.png";
    const bg = isApple
      ? { r: 255, g: 255, b: 255, alpha: 1 }
      : { r: 255, g: 255, b: 255, alpha: 0 };

    await sharp(trimmed)
      .resize(size, size, { fit: "contain", background: bg })
      .png()
      .toFile(pub(name));
    console.log(`Created ${name} (${size}x${size})`);
  }
}

main().catch(console.error);
