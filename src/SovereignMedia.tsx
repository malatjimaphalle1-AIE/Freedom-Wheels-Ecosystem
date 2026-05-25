import React from "react";

interface SovereignMediaProps {
  type?: "image" | "video";
  aspectRatio?: string;
  src?: string | null;
  className?: string;
  prompt?: string;
  autoGenerate?: boolean;
}

export function SovereignMedia({
  type = "image",
  src,
  className = "",
  prompt,
  autoGenerate = false,
}: SovereignMediaProps) {
  if (type === "video") {
    return (
      <div className={className}>
        <div className="w-full h-full bg-border-dim flex items-center justify-center text-[10px] text-text-dim">
          {src ? (
            <video className="w-full h-full object-cover" controls src={src} />
          ) : (
            autoGenerate ? "Generating video preview…" : "No media available"
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {src ? (
        <img
          src={src}
          alt={prompt || "Sovereign media"}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-border-dim flex items-center justify-center text-[10px] text-text-dim">
          {autoGenerate ? "Generating media…" : "No media available"}
        </div>
      )}
    </div>
  );
}
