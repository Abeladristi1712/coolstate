export function EstateIllustration({variant=0}:{variant?:number}) {
  const blocks = [[60,60],[150,60],[250,60],[350,60],[60,160],[350,160],[60,260],[150,260],[250,260],[350,260]];
  return <svg viewBox="0 0 500 370" role="img" aria-label="Illustrative estate plan, not actual site geometry" className="estate-illustration">
    <defs><pattern id={`grid-${variant}`} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#d7ded1" strokeWidth=".5"/></pattern></defs>
    <rect width="500" height="370" fill={variant%2?"#e0e8df":"#e7eadd"}/><rect width="500" height="370" fill={`url(#grid-${variant})`}/>
    <g transform="translate(8 -12) rotate(-14 250 185)"><path d="M-30 330H550M-20 32H520M24 -50V440M459 -50V440" stroke="#f9f9f2" strokeWidth="22"/><path d="M-30 330H550M-20 32H520" stroke="#c8cfc4" strokeWidth="1" strokeDasharray="8 6"/>
    <rect x="148" y="133" width="177" height="104" rx="25" fill="#b5c9a5"/><path d="M140 187H335M238 122V247" stroke="#eaf0dc" strokeWidth="10"/>
    {Array.from({length:24},(_,i)=><circle key={i} cx={160+(i%8)*22} cy={i<8?148:i<16?223:278} r={6+i%3} fill={["#7d9d71","#93ad7c","#6d916a"][i%3]}/>)}
    {blocks.map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="M0 0L13 -20H67L54 0Z" fill="#fafbf5"/><path d="M54 0L67 -20V19L54 39Z" fill="#a7b8ad"/><rect width="54" height="39" fill="#c8d3c8"/>{[10,20,30].map(y=><path key={y} d={`M5 ${y}H49`} stroke="#f0f4ec" strokeWidth="2"/>)}<path d="M0 0H54" stroke="#fff" strokeWidth="2"/></g>)}
    <rect x="40" y="46" width="390" height="267" rx="3" fill="none" stroke="#43705b" strokeWidth="1.8" strokeDasharray="6 5"/></g>
  </svg>;
}
