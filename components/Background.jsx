export default function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Pure black base */}
      <div className="absolute inset-0" style={{background:'#080808'}} />

      {/* Subtle warm vignette center */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 70%)'
      }} />

      {/* Fine grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />

      {/* Horizontal rule at top */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)'
      }} />
    </div>
  );
}
