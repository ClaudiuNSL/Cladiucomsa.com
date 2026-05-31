// Favicon dinamic 32x32 — monogramă CC pe fundal cremă închis.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1c1a16",
          color: "#f3eee4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "-0.05em",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        CC
      </div>
    ),
    { ...size }
  );
}
