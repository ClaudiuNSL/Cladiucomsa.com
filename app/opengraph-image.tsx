// OG image dinamică 1200x630 — paletă Chromatic Drift, RO copy.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Claudiu Comșa — Web Developer din Constanța";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f3eee4",
          color: "#1c1a16",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          CC
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 300,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            Claudiu Comșa
          </div>
          <div style={{ fontSize: 32, opacity: 0.6, marginTop: 24 }}>
            Web Developer din Constanța
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
