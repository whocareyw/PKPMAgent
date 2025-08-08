export function LogoSVG({
  className,
  width,
  height,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      fill="none"
      aria-hidden="true"
      role="img"
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 98 51"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25.5144 0.394531H73.3011C86.9178 0.394531 97.9949 11.5154 97.9949 25.1847C97.9949 38.8539 86.9178 49.9748 73.3011 49.9748H25.5144C11.8977 49.9748 0.820557 38.8539 0.820557 25.1847C0.820557 11.5154 11.8977 0.394531 25.5144 0.394531Z"
        fill="rgb(236, 31, 31)"
      />
      <text x="49" y="35" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="bold" textAnchor="middle" fill="rgb(255, 255, 255)">PKPM</text>
    </svg>
  );
}