export default function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060b18] via-[#0a1128] to-[#060b18]" />

      {/* Orbs */}
      <div className="orb w-[600px] h-[600px] top-[-200px] left-[-100px] bg-accent-600/20" style={{animationDelay:'0s'}} />
      <div className="orb w-[400px] h-[400px] top-[40%] right-[-150px] bg-blue-600/15" style={{animationDelay:'2s'}} />
      <div className="orb w-[500px] h-[500px] bottom-[-100px] left-[30%] bg-violet-700/10" style={{animationDelay:'4s'}} />
      <div className="orb w-[300px] h-[300px] top-[60%] left-[10%] bg-cyan-500/10" style={{animationDelay:'1s'}} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize:'60px 60px'}} />
    </div>
  );
}
