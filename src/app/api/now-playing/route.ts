import { NextRequest, NextResponse } from "next/server";
import http from "http";
import https from "https";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ title: null });
  }

  try {
    const title = await fetchIcyMetadata(url);
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: null });
  }
}

function fetchIcyMetadata(streamUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 8000);

    try {
      const parsed = new URL(streamUrl);
      const isHttps = parsed.protocol === "https:";
      const lib = isHttps ? https : http;

      const req = lib.get(
        {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          headers: {
            "User-Agent": "RadioZal/1.0",
            "Icy-MetaData": "1",
          },
          timeout: 6000,
        },
        (res) => {
          const metaInt = parseInt(res.headers["icy-metaint"] as string, 10);
          // Detect content-type charset for proper decoding
          const contentType = (res.headers["content-type"] || "") as string;
          const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
          const charset = charsetMatch ? charsetMatch[1].toLowerCase() : "";

          if (!metaInt || isNaN(metaInt)) {
            // No ICY support
            clearTimeout(timeout);
            req.destroy();
            resolve(null);
            return;
          }

          let bytesRead = 0;
          let metaLength = 0;
          let metaBuffer = Buffer.alloc(0);
          let readingMeta = false;

          res.on("data", (chunk: Buffer) => {
            let offset = 0;

            while (offset < chunk.length) {
              if (!readingMeta) {
                const remaining = metaInt - bytesRead;
                const toSkip = Math.min(remaining, chunk.length - offset);
                bytesRead += toSkip;
                offset += toSkip;

                if (bytesRead >= metaInt) {
                  bytesRead = 0;
                  readingMeta = true;
                  metaLength = 0;
                  metaBuffer = Buffer.alloc(0);
                }
              } else if (metaLength === 0 && metaBuffer.length === 0) {
                // Read length byte
                metaLength = chunk[offset] * 16;
                offset++;

                if (metaLength === 0) {
                  // No metadata in this block
                  readingMeta = false;
                  continue;
                }
              } else {
                // Read meta bytes
                const remaining = metaLength - metaBuffer.length;
                const toRead = Math.min(remaining, chunk.length - offset);
                metaBuffer = Buffer.concat([
                  metaBuffer,
                  chunk.subarray(offset, offset + toRead),
                ]);
                offset += toRead;

                if (metaBuffer.length >= metaLength) {
                  // Decode metadata with proper encoding
                  let metaStr: string;
                  const raw = metaBuffer.subarray(0, metaLength);
                  
                  // Check if it's valid UTF-8 first
                  const utf8 = raw.toString("utf8");
                  const isValidUtf8 = !utf8.includes('\ufffd') && Buffer.from(utf8, "utf8").equals(raw);
                  
                  if (isValidUtf8) {
                    metaStr = utf8;
                  } else {
                    // Try windows-1251 for Cyrillic streams, otherwise latin1
                    try {
                      const decoder = new TextDecoder(charset || "windows-1251", { fatal: true });
                      metaStr = decoder.decode(raw);
                    } catch {
                      metaStr = raw.toString("latin1");
                    }
                  }
                  
                  metaStr = metaStr.replace(/\0+$/, "");
                  const match = metaStr.match(/StreamTitle='([^']*)'/);
                  clearTimeout(timeout);
                  req.destroy();
                  resolve(match ? match[1] || null : null);
                  return;
                }
              }
            }
          });

          res.on("error", () => {
            clearTimeout(timeout);
            resolve(null);
          });
        }
      );

      req.on("error", () => {
        clearTimeout(timeout);
        resolve(null);
      });

      req.on("timeout", () => {
        clearTimeout(timeout);
        req.destroy();
        resolve(null);
      });
    } catch {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}
