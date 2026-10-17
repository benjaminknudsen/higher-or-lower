// Original, code-native shirt illustration. No official crest or player imagery.
export default function FootballShirt({ className = '' }) {
  return <svg className={`football-shirt ${className}`} viewBox="0 0 160 170" fill="none" aria-hidden="true">
    <path d="m48 18-34 22 17 40 19-9v80h60V71l19 9 17-40-34-22-16 8H64L48 18Z" fill="currentColor" stroke="var(--ink, #1c1c1b)" strokeWidth="5" strokeLinejoin="round" />
    <path d="m61 23 19 17 19-17M48 20l4 48m60-48-4 48M24 61l14-8m84 0 14 8" stroke="var(--shirt-detail, #ffffff)" strokeWidth="6" />
    <path d="M72 43h16v100H72z" fill="#ed2939" />
    <path d="M55 145h50" stroke="var(--shirt-detail, #ffffff)" strokeWidth="3" />
    <text x="80" y="98" fill="var(--shirt-detail, #ffffff)" stroke="var(--ink, #1c1c1b)" strokeWidth="2" paintOrder="stroke" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="23" textAnchor="middle">FCM</text>
  </svg>
}
