const LoadingScreen = ({
  label = "Loading...",
  fullScreen = true,
  className = "",
}) => {
  const wrapperClass = fullScreen
    ? "min-h-screen w-screen bg-[linear-gradient(180deg,#020617,#0f172a_55%,#111827)]"
    : "w-full";

  return (
    <div className={`${wrapperClass} ${className} flex items-center justify-center px-6 py-10 text-white`}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/15 border-t-cyan-400" />
        <p className="mt-5 text-sm tracking-[0.2em] uppercase text-slate-300">{label}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
