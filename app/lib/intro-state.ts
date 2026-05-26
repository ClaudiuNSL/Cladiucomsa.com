'use client';
// Coordonator module-level pentru intro animation.
// IntroAnimation marcheaza completion-ul; Hero si alte componente care vor
// sa-si amane reveal-ul pana la dismiss subscriu via onIntroComplete.
// Folosim module state (nu event) ca sa evitam race-uri intre useEffect-uri
// care fire-uiesc in ordine necontrolata cu intre-componenta.

type Listener = () => void;

let isComplete = false;
const listeners: Listener[] = [];

export function isIntroComplete(): boolean {
  return isComplete;
}

export function completeIntro(): void {
  if (isComplete) return;
  isComplete = true;
  // Copie defensiva — listener-ul poate adauga alti listeneri in timpul callback-ului.
  const snapshot = listeners.slice();
  listeners.length = 0;
  for (const fn of snapshot) fn();
}

// Subscriu un callback la finalul intro-ului. Daca intro-ul e deja terminat,
// callback-ul fire-uieste sincron. Returneaza un dispose-er.
export function onIntroComplete(fn: Listener): () => void {
  if (isComplete) {
    fn();
    return () => {};
  }
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
