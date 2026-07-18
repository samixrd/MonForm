/**
 * A barely-perceptible ambient layer behind the landing page — paper-grain
 * noise, faintly tinted toward brass, drifting on a very slow cycle. It
 * should never compete with content: opacity stays low and motion is slow
 * enough to read as "alive" rather than "moving." Respects
 * prefers-reduced-motion via the global rule in globals.css.
 */
export function AmbientTexture() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute -inset-[15%] h-[130%] w-[130%] animate-grain-drift opacity-[0.05] mix-blend-overlay motion-reduce:animate-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.79
                    0 0 0 0 0.64
                    0 0 0 0 0.29
                    0 0 0 0.55 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>
    </div>
  );
}
