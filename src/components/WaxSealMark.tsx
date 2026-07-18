/**
 * A small wax-seal glyph — the brand mark that sits beside the "MonForm"
 * wordmark. An irregular (not perfectly circular) brass disc, embossed
 * with an "M" monogram, meant to read as a stamped impression rather than
 * a flat icon. Purely decorative — always paired with visible text.
 */
export function WaxSealMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="wax-seal-sheen" cx="34%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#E7C685" />
          <stop offset="55%" stopColor="#C9A24B" />
          <stop offset="100%" stopColor="#8A6E33" />
        </radialGradient>
        <filter id="wax-seal-edge" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="6" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" />
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#wax-seal-sheen)" filter="url(#wax-seal-edge)" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="Georgia, ui-serif, serif"
        fontSize="15"
        fontWeight="600"
        fill="#14121F"
        opacity="0.85"
      >
        M
      </text>
    </svg>
  );
}
