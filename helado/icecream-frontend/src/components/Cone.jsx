/** Cucurucho con una bocha por gusto elegido. Los lugares vacíos se muestran punteados. */
export default function Cone({ scoops, max = 4, className = "" }) {
  const r = 40;
  const step = 46;
  const baseY = r + (max - 1) * step; // centro de la bocha de abajo
  const coneTop = baseY + 14;
  const tip = coneTop + 130;
  const names = scoops.map((s) => s.name).join(", ");

  return (
    <svg
      viewBox={`0 0 200 ${tip + 8}`}
      className={className}
      role="img"
      aria-label={scoops.length ? `Helado con ${names}` : "Cucurucho vacío"}
    >
      <defs>
        <clipPath id="cone-clip">
          <polygon points={`46,${coneTop} 154,${coneTop} 100,${tip}`} />
        </clipPath>
      </defs>

      <polygon points={`46,${coneTop} 154,${coneTop} 100,${tip}`} fill="#e9b86b" />
      <g clipPath="url(#cone-clip)" stroke="#b9822f" strokeWidth="3">
        {[-120, -80, -40, 0, 40, 80, 120].map((o) => (
          <g key={o}>
            <line x1={100 + o - 60} y1={coneTop} x2={100 + o + 60} y2={tip} />
            <line x1={100 + o + 60} y1={coneTop} x2={100 + o - 60} y2={tip} />
          </g>
        ))}
      </g>
      <polygon points={`46,${coneTop} 154,${coneTop} 100,${tip}`} fill="none" stroke="#1e2328" strokeWidth="3" strokeLinejoin="round" />

      {Array.from({ length: max }, (_, i) => {
        const cy = baseY - i * step;
        const scoop = scoops[i];
        if (!scoop) {
          return (
            <circle key={`empty-${i}`} cx="100" cy={cy} r={r} fill="none" stroke="#1e2328" strokeOpacity=".35" strokeWidth="2.5" strokeDasharray="6 7" />
          );
        }
        return (
          <g key={scoop.id} className="scoop-pop">
            <circle cx="100" cy={cy} r={r} fill={scoop.color} stroke="#1e2328" strokeWidth="3" />
            <ellipse cx="82" cy={cy - 14} rx="10" ry="6" fill="#fff" opacity=".4" transform={`rotate(-30 82 ${cy - 14})`} />
          </g>
        );
      })}
    </svg>
  );
}
