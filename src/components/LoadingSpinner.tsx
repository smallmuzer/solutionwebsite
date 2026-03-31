import logo from "@/assets/logo.png";

const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
    <div className="relative flex items-center justify-center">
      <div
        className="w-16 h-16 rounded-full border-4 border-muted border-t-secondary"
        style={{ animation: "spin 1.2s linear infinite" }}
      />
      <img src={logo} alt="" className="w-8 h-8 absolute" />
    </div>
    <p className="text-muted-foreground text-sm font-medium" style={{ animation: "fadeIn 0.4s ease 0.2s both" }}>
      {message}
    </p>
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `}</style>
  </div>
);

export default LoadingSpinner;
