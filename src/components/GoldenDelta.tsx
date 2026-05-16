interface GoldenDeltaProps {
  size?: number;
  className?: string;
  pulse?: boolean;
}

const GoldenDelta = ({ size = 32, className = "", pulse = false }: GoldenDeltaProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${pulse ? "animate-pulse" : ""} ${className}`}
      aria-label="The Human Delta"
    >
      <defs>
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a843" />
          <stop offset="50%" stopColor="#c8982e" />
          <stop offset="100%" stopColor="#b8891f" />
        </linearGradient>
      </defs>
      {/* Main delta with a slice cut from the bottom-right corner */}
      <polygon
        points="50,8 92,85 78,85 70,72 8,85"
        fill="url(#gold-gradient)"
        stroke="none"
      />
    </svg>
  );
};

export default GoldenDelta;
