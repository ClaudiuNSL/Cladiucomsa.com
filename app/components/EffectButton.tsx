'use client';
// Buton reutilizabil cu doua efecte:
//   - hover: letter ticker (fiecare litera urca, copia identica intra de jos)
//   - click: shatter — butonul se sparge in 12 fragmente care zboara cu rotatie + fade,
//            apoi reapare cu un back-out scale-in.
// Detecteaza singur daca href-ul e extern (https/mailto/tel) si renderizeaza
// <a target=_blank> sau <Link> intern din next-intl. Pentru actiuni non-nav
// fara href, renderizeaza <button>.
import {
  forwardRef,
  useCallback,
  useRef,
  type CSSProperties,
  type ForwardedRef,
} from 'react';
import { Link } from '@/i18n/navigation';
import { gsap } from 'gsap';

type Variant = 'primary' | 'secondary';

type CommonProps = {
  text: string;
  trailing?: string;
  variant?: Variant;
  className?: string;
  'aria-label'?: string;
};

type AsLinkProps = CommonProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type AsButtonProps = CommonProps & {
  href?: never;
  onClick?: () => void;
  type?: 'button' | 'submit';
};

type Props = AsLinkProps | AsButtonProps;

// Auto-detect: href catre alta origine sau mailto/tel = extern.
function isExternalHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

const BASE = 'effect-btn group inline-flex items-center gap-3 rounded-full px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40';
const PRIMARY = 'bg-white text-black hover:bg-zinc-100';
const SECONDARY = 'border border-white/25 text-white hover:border-white/60 hover:bg-white/[0.04]';

function variantClass(v: Variant) {
  return v === 'primary' ? PRIMARY : SECONDARY;
}

export default function EffectButton(props: Props) {
  const variant: Variant = props.variant ?? 'primary';
  const elRef = useRef<HTMLElement | null>(null);

  const onClick = useCallback(() => {
    if (elRef.current) shatter(elRef.current, variant);
    if (!('href' in props) && 'onClick' in props && props.onClick) props.onClick();
  }, [props, variant]);

  const content = (
    <>
      <LetterTicker text={props.text} />
      {props.trailing ? (
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          {props.trailing}
        </span>
      ) : null}
    </>
  );

  const className = `${BASE} ${variantClass(variant)} ${props.className ?? ''}`.trim();

  if ('href' in props && props.href) {
    if (isExternalHref(props.href)) {
      return (
        <AnchorWithRef
          ref={elRef as ForwardedRef<HTMLAnchorElement>}
          href={props.href}
          onClick={onClick}
          className={className}
          aria-label={props['aria-label']}
        >
          {content}
        </AnchorWithRef>
      );
    }
    return (
      <Link
        ref={elRef as ForwardedRef<HTMLAnchorElement>}
        href={props.href}
        onClick={onClick}
        className={className}
        aria-label={props['aria-label']}
      >
        {content}
      </Link>
    );
  }

  return (
    <ButtonWithRef
      ref={elRef as ForwardedRef<HTMLButtonElement>}
      type={'type' in props ? props.type ?? 'button' : 'button'}
      onClick={onClick}
      className={className}
      aria-label={props['aria-label']}
    >
      {content}
    </ButtonWithRef>
  );
}

// Forward ref pentru <a> extern — folosim un wrapper ca sa accepte HTMLElement ref.
const AnchorWithRef = forwardRef<HTMLAnchorElement, {
  href: string;
  onClick: () => void;
  className: string;
  'aria-label'?: string;
  children: React.ReactNode;
}>(function AnchorWithRef({ href, onClick, className, children, ...rest }, ref) {
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={className}
      aria-label={rest['aria-label']}
    >
      {children}
    </a>
  );
});

const ButtonWithRef = forwardRef<HTMLButtonElement, {
  type: 'button' | 'submit';
  onClick: () => void;
  className: string;
  'aria-label'?: string;
  children: React.ReactNode;
}>(function ButtonWithRef({ type, onClick, className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      className={className}
      aria-label={rest['aria-label']}
    >
      {children}
    </button>
  );
});

// LetterTicker: imparte text-ul in litere, fiecare cu DOUA copii stacked
// vertical, identice. Stagger via --ticker-delay (folosit de CSS in globals).
function LetterTicker({ text }: { text: string }) {
  const chars = Array.from(text);
  return (
    <span className="ticker-wrap inline-flex">
      {chars.map((ch, i) => {
        const display = ch === ' ' ? ' ' : ch;
        return (
          <span
            key={i}
            className="ticker-col"
            style={{ '--ticker-delay': `${i * 28}ms` } as CSSProperties}
          >
            <span className="ticker-letter">{display}</span>
            <span className="ticker-letter">{display}</span>
          </span>
        );
      })}
    </span>
  );
}

// Shatter: cloneaza buton-ul in 12 fragmente clip-path-ate, le animeaza
// in directii random cu GSAP, apoi readuce butonul. Pentru link-uri
// (intern/extern), navigarea pleaca imediat; fragmentele persista in
// document.body si raman vizibile in timpul PageTransition pana se curata.
function shatter(el: HTMLElement, variant: Variant) {
  if (typeof window === 'undefined') return;
  const rect = el.getBoundingClientRect();
  const fragmentCount = 12;
  const bgIsLight = variant === 'primary';
  const fragColor = bgIsLight ? '#ffffff' : 'rgba(255,255,255,0.08)';
  const fragBorder = bgIsLight ? 'none' : '1px solid rgba(255,255,255,0.25)';

  // Ascunde butonul instant.
  const prevOpacity = el.style.opacity;
  const prevPointerEvents = el.style.pointerEvents;
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';

  for (let i = 0; i < fragmentCount; i++) {
    const piece = document.createElement('div');
    piece.style.position = 'fixed';
    piece.style.pointerEvents = 'none';
    piece.style.zIndex = '999';

    // Polygon shard care imparte radial butonul in N felii.
    const cx = 50;
    const cy = 50;
    const angle0 = (i / fragmentCount) * Math.PI * 2;
    const angle1 = ((i + 1) / fragmentCount) * Math.PI * 2;
    const r = 75 + Math.random() * 25;
    const points = [
      `${cx}% ${cy}%`,
      `${cx + Math.cos(angle0) * r}% ${cy + Math.sin(angle0) * r}%`,
      `${cx + Math.cos(angle1) * r}% ${cy + Math.sin(angle1) * r}%`,
    ];
    piece.style.clipPath = `polygon(${points.join(',')})`;
    piece.style.left = `${rect.left}px`;
    piece.style.top = `${rect.top}px`;
    piece.style.width = `${rect.width}px`;
    piece.style.height = `${rect.height}px`;
    piece.style.background = fragColor;
    piece.style.border = fragBorder;
    piece.style.borderRadius = '9999px';
    document.body.appendChild(piece);

    const tx = (Math.random() - 0.5) * 240;
    const ty = (Math.random() - 0.5) * 240 - 40;
    const rot = (Math.random() - 0.5) * 720;
    gsap.to(piece, {
      x: tx,
      y: ty,
      rotation: rot,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      onComplete: () => piece.remove(),
    });
  }

  // Reseteaza butonul dupa fragmentare. Daca elementul a fost detasat
  // (navigare intre pagini), gsap.fromTo nu va avea efect vizibil dar
  // nu va arunca eroare.
  window.setTimeout(() => {
    if (!el.isConnected) {
      el.style.opacity = prevOpacity;
      el.style.pointerEvents = prevPointerEvents;
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(1.5)',
        clearProps: 'opacity,transform',
      }
    );
    el.style.pointerEvents = prevPointerEvents;
  }, 900);
}
