"use client";

// Sound toggle — UI-only stub (Phase 1).
// Fix bottom-right; comută între "Sunet oprit" și "Sunet pornit".
// Audio real va fi cablat în Phase 2.

import { useState } from "react";

export default function SoundToggle() {
  const [soundOn, setSoundOn] = useState<boolean>(false);

  // TODO Phase 2: wire ambient audio
  const handleToggle = () => {
    setSoundOn((prev) => !prev);
  };

  return (
    <button
      type="button"
      className={`sound-toggle${soundOn ? " on" : ""}`}
      id="sound-toggle"
      aria-pressed={soundOn}
      aria-label={soundOn ? "Sunet pornit" : "Sunet oprit"}
      onClick={handleToggle}
    >
      <div className="sound-bars">
        <span />
        <span />
        <span />
        <span />
      </div>
      <span id="sound-label">{soundOn ? "Sunet pornit" : "Sunet oprit"}</span>
    </button>
  );
}
