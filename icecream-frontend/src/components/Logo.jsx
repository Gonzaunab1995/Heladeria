export default function Logo({ className = "h-12 w-12" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Logo de IceCream: un oso panda con una bocha de helado">
      <circle cx="50" cy="19" r="12" fill="#ff7a93" stroke="#1e2328" strokeWidth="3" />
      <circle cx="50" cy="5" r="4" fill="#d6293e" stroke="#1e2328" strokeWidth="2" />
      <circle cx="24" cy="30" r="12" fill="#1e2328" />
      <circle cx="76" cy="30" r="12" fill="#1e2328" />
      <ellipse cx="50" cy="58" rx="38" ry="34" fill="#fff" stroke="#1e2328" strokeWidth="3" />
      <ellipse cx="34" cy="53" rx="8" ry="11" fill="#1e2328" transform="rotate(20 34 53)" />
      <ellipse cx="66" cy="53" rx="8" ry="11" fill="#1e2328" transform="rotate(-20 66 53)" />
      <circle cx="35" cy="52" r="3" fill="#fff" />
      <circle cx="65" cy="52" r="3" fill="#fff" />
      <ellipse cx="50" cy="66" rx="6" ry="4.5" fill="#1e2328" />
      <path d="M43 73 Q50 79 57 73" fill="none" stroke="#1e2328" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
