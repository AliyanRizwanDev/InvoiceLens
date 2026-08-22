import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EDEEE6",
          border: "3px solid #2F6B4F",
          transform: "rotate(-6deg)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#2F6B4F",
            fontFamily: "Georgia, serif",
          }}
        >
          R
        </div>
      </div>
    ),
    { ...size },
  );
}
