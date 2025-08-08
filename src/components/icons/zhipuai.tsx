export function ZhipuAILogoSVG({
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
      <path d="M25.05 6.20842L22.11 10.3762C21.648 11.0464 20.8921 11.4234 20.0731 11.4234H4.05V6.1875H25.05V6.20842Z" fill="url(#paint0_linear_18623_2741)"/>
      <path d="M45 6.20842L19.8 41.8125H3L28.2 6.20842H45Z" fill="url(#paint1_linear_18623_2741)"/>
      <path d="M22.95 41.8125L25.911 37.6237C26.373 36.9745 27.129 36.5766 27.948 36.5766H43.95V41.8125H22.95Z" fill="url(#paint2_linear_18623_2741)"/>
      <defs>
        <linearGradient id="paint0_linear_18623_2741" x1="14.2659" y1="7.12035" x2="21.5379" y2="52.0852" gradientUnits="userSpaceOnUse">
          <stop stop-color="#495766"/>
          <stop offset="1"/>
        </linearGradient>
        <linearGradient id="paint1_linear_18623_2741" x1="21.0681" y1="6.02025" x2="28.3401" y2="50.9854" gradientUnits="userSpaceOnUse">
          <stop stop-color="#495766"/>
          <stop offset="1"/>
        </linearGradient>
        <linearGradient id="paint2_linear_18623_2741" x1="27.8703" y1="4.92017" x2="35.1423" y2="49.8851" gradientUnits="userSpaceOnUse">
          <stop stop-color="#495766"/>
          <stop offset="1"/>
        </linearGradient>
      </defs>
    </svg>
  );
}