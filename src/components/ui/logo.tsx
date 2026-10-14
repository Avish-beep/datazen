import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 32, showText = true, className = "", ...props }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect width="40" height="40" rx="10" className="fill-teal-600 dark:fill-teal-500" />
        {/* Letter D with dynamic data wave */}
        <path
          d="M12 11C12 9.89543 12.8954 9 14 9H20C25.5228 9 30 13.4772 30 19C30 24.5228 25.5228 29 20 29H14C12.8954 29 12 28.1046 12 27V11Z"
          fill="white"
          fillOpacity="0.25"
        />
        <path
          d="M12 11H20C24.4183 11 28 14.5817 28 19C28 23.4183 24.4183 27 20 27H12V11Z"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Smooth data sine wave through the core of D */}
        <path
          d="M14 20C16 17 18 17 20 20C22 23 24 23 26 20"
          stroke="#5EEAD4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Data<span className="text-teal-600 dark:text-teal-400">Zen</span>
        </span>
      )}
    </div>
  );
}
