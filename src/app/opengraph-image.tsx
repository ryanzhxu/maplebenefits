import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Static export: generated once at build time. Uses only plain Latin text
// (no emoji / symbol glyphs) so no dynamic font fetch is needed at build.
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#eaf1ff",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 62, fontWeight: 800, letterSpacing: -1 }}>
          <span style={{ color: "#d64545" }}>maple</span>
          <span style={{ color: "#1b4fd6" }}>benefits</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 70,
              fontWeight: 800,
              color: "#0f1b2d",
              lineHeight: 1.1,
              maxWidth: 960,
            }}
          >
            {SITE.tagline.en}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 32,
              color: "#5a6b82",
              maxWidth: 960,
            }}
          >
            Free and private. Federal and provincial benefits, in your language.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 26 }}>
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              border: "1px solid #e3e9f2",
              borderRadius: 999,
              padding: "10px 24px",
              color: "#1b4fd6",
            }}
          >
            Nothing leaves your device
          </div>
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              border: "1px solid #e3e9f2",
              borderRadius: 999,
              padding: "10px 24px",
              color: "#1b4fd6",
            }}
          >
            No sign-up
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
