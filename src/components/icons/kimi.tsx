export function KimiLogoSVG({
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
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g id="logo_kimi">
        <rect width="48" height="48" rx="8" />
        <path id="Union" d="M14.9308 11.1274H10V37.9999H14.9308V26.7248H23.3836C25.0316 26.7248 26.4279 25.5744 26.9057 23.9852V37.9999H31.6604V25.4093C31.6604 23.2298 30.0047 21.463 27.9623 21.463H24.9304C25.9158 21.1261 26.7431 20.3557 27.1792 19.3133L30.6038 11.1274H25.3208L20.9969 21.463H14.9308V11.1274Z" fill="black"/>
        <g id="Vector">
          <path d="M32.7168 12.6309C32.7168 11.1779 33.8206 10 35.1822 10H35.5344C36.896 10 37.9998 11.1779 37.9998 12.6309V13.5705C37.9998 15.0235 36.896 16.2013 35.5344 16.2013H35.1822C33.8206 16.2013 32.7168 15.0235 32.7168 13.5705V12.6309Z" fill="#007AFF"/>
          <path d="M32.7168 16.3893L33.6854 15.2617L35.4464 16.2013L32.7168 16.3893Z" fill="#007AFF"/>
        </g>
      </g>
    </svg>
  );
}