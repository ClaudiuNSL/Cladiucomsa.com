// Event bus minimal pentru declanșarea TransitionFlash din orice componentă.
// Secțiunile importă `fireFlash` și apelează din ScrollTrigger onEnter/onEnterBack;
// TransitionFlash ascultă evenimentul pe window și gestionează debounce + reflow.
export const FLASH_EVENT = "chromatic:flash" as const;

export function fireFlash(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FLASH_EVENT));
}
