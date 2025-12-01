interface TurfTimeLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function TurfTimeLogo({ size = "md", showText = true }: TurfTimeLogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-lg" },
    md: { icon: 36, text: "text-xl" },
    lg: { icon: 48, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className="flex items-center gap-2" data-testid="logo-turftime">
      <div className="relative">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          {/* Turf field background circle */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          
          {/* Stylized T with turf lines */}
          <path
            d="M14 14H34V18H26V36H22V18H14V14Z"
            fill="currentColor"
          />
          
          {/* Turf field lines */}
          <line
            x1="14"
            y1="24"
            x2="22"
            y2="24"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <line
            x1="26"
            y1="24"
            x2="34"
            y2="24"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <line
            x1="14"
            y1="30"
            x2="22"
            y2="30"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <line
            x1="26"
            y1="30"
            x2="34"
            y2="30"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.5"
          />
          
          {/* Small goal post accent */}
          <rect
            x="32"
            y="20"
            width="4"
            height="8"
            rx="1"
            fill="currentColor"
            opacity="0.6"
          />
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold ${text} tracking-tight`}>
          <span className="text-primary">Turf</span>
          <span className="text-foreground">Time</span>
        </span>
      )}
    </div>
  );
}
