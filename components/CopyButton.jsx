"use client";

import { useState } from "react";
import { btnSecondary } from "./ui";

export default function CopyButton({ text, label = "Copy link" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={btnSecondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
