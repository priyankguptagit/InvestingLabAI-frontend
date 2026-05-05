/**
 * PremiumBackground — CSS-only, zero JS cost.
 * Replaces the WebGL @react-three/fiber canvas that was
 * running a 60fps render loop and causing page-wide lag.
 *
 * Uses static blurred SVG blobs composited entirely by the GPU
 * via `filter: blur` + `opacity` — no JavaScript, no repaints.
 */
export default function Premium3DBackground() {
  return (
    <div className="absolute inset-0 z-0 h-full w-full overflow-hidden pointer-events-none" aria-hidden>
      {/* Top-left indigo blob */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.07] dark:opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
          filter: 'blur(80px)',
          willChange: 'auto',
        }}
      />
      {/* Bottom-right violet blob */}
      <div
        className="absolute -bottom-32 -right-32 w-[700px] h-[700px] rounded-full opacity-[0.06] dark:opacity-[0.10]"
        style={{
          background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
          filter: 'blur(100px)',
          willChange: 'auto',
        }}
      />
      {/* Center faint glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.04] dark:opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)',
          filter: 'blur(120px)',
          willChange: 'auto',
        }}
      />
    </div>
  );
}
