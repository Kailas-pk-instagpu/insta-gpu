// Login background — large soft glowing arcs, themed for both light & dark mode.
// Pure CSS for smoothness. No grid lines.
export default function GPUBackground() {
  return (
    <div className="login-bg absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base wash (theme-aware) */}
      <div className="login-bg-wash absolute inset-0" />

      {/* Glowing arcs */}
      <div className="login-arc login-arc-primary" />
      <div className="login-arc login-arc-inner" />
      <div className="login-arc login-arc-accent" />

      {/* Soft vignette (theme-aware) */}
      <div className="login-bg-vignette absolute inset-0" />
    </div>
  );
}
