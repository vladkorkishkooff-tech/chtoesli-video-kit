import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {Grain, Vignette, RoughDefs, rampColor, INK, PAPER, ALARM, DUSK, SERIF} from './common';

type Ev = {f: number; d: number; label: string; sub: string; sign: string};
const EVENTS: Ev[] = [
  {f: 45, d: 1, label: 'Неудача', sub: 'клубок не докатился', sign: '+1'},
  {f: 95, d: 0.5, label: 'Ошибка', sub: 'скалка грохнулась', sign: '+½'},
  {f: 145, d: 1, label: 'Неудача', sub: 'кончилась нитка', sign: '+1'},
  {f: 195, d: -0.5, label: 'Погладил Кота', sub: 'чуть спокойнее', sign: '−½'},
  {f: 240, d: 0.5, label: 'Ошибка', sub: 'мандарин попал в Кота', sign: '+½'},
  {f: 280, d: 1, label: 'Неудача', sub: 'цепочка оборвалась', sign: '+1'},
  {f: 318, d: 0.5, label: 'Ошибка', sub: 'зазвенел будильник', sign: '+½'},
];
const STATES = ['дремлет', 'спокоен', 'насторожен', 'прищур', 'бешенство'];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const AngerMeter: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let value = 0;
  for (const e of EVENTS) {
    if (frame >= e.f) value += e.d * spring({frame: frame - e.f, fps, config: {damping: 9, stiffness: 140, mass: 0.7}});
  }
  const settled = EVENTS.filter((e) => frame >= e.f + 4).reduce((s, e) => s + e.d, 0);
  const face = Math.max(0, Math.min(4, Math.floor(settled + 1e-6)));
  const last = [...EVENTS].reverse().find((e) => frame >= e.f);
  const t = last ? frame - last.f : 999;
  const rage = settled >= 3.99;
  const sq = t < 24 ? Math.exp(-t / 6) * Math.sin(t * 0.9) * 0.16 : 0;
  const hz = 0.45 + 0.3 * Math.min(4, Math.max(0, value));
  const breath = 1 + 0.018 * Math.sin((frame / fps) * 2 * Math.PI * hz);
  const wobble = 1.6 * Math.sin((frame / fps) * 2 * Math.PI * 0.35) + (rage ? 3 * Math.sin(frame * 0.9) : 0);
  const errShake = last && last.label === 'Ошибка' && t < 16 ? 9 * Math.exp(-t / 5) : 0;
  const failShake = last && last.label === 'Неудача' && t < 12 ? 5 * Math.exp(-t / 4) : 0;
  const amp = errShake + failShake + (rage ? 4 + 2 * Math.sin(frame * 0.7) : 0);
  const sx = amp * Math.sin(frame * 2.1), sy = amp * Math.cos(frame * 2.7);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.35);
  const barW = 560, barH = 56;
  const fillW = Math.max(0, Math.min(1.04, value / 4)) * (barW - 10);
  const flash = interpolate(frame, [346, 350, 362], [0, 1, 0], clamp);
  const pogromIn = spring({frame: frame - 350, fps, config: {damping: 8, stiffness: 120}});
  const panelOpacity = interpolate(frame, [0, 12, 346, 352], [0, 1, 1, 0], clamp);
  const n = Math.round(Math.max(0, settled) * 2) / 2;
  const nStr = Number.isInteger(n) ? `${n}` : `${Math.floor(n)},5`;
  const redTint = Math.max(0, (value - 2) / 2) * 0.28 * (0.6 + 0.4 * pulse);

  return (
    <AbsoluteFill style={{background: '#2a2430', fontFamily: SERIF}}>
      <RoughDefs id="rough" scale={3.2} />
      <Img src={staticFile('kf/bg_blur.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: interpolate(frame, [0, 12], [0, 1], clamp)}} />
      <AbsoluteFill style={{background: 'rgba(34,28,28,0.45)'}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(217,85,59,${redTint}) 0%, rgba(217,85,59,0) 70%)`}} />
      <div style={{position: 'absolute', left: 150, top: 200, width: 980, height: 300, opacity: panelOpacity, transform: `translate(${sx}px, ${sy}px)`}}>
        <div style={{position: 'absolute', inset: 0, background: PAPER, borderRadius: 36, border: `5px solid ${INK}`, filter: 'url(#rough)',
          boxShadow: rage ? `0 0 ${30 + 30 * pulse}px rgba(217,85,59,${0.55 + 0.35 * pulse})` : '0 10px 30px rgba(0,0,0,0.35)'}} />
        <div style={{position: 'absolute', left: 40, top: 40, width: 220, height: 220, transformOrigin: '50% 90%',
          transform: `scale(${breath * (1 + sq)}, ${breath * (1 - sq)}) rotate(${wobble}deg)`}}>
          <div style={{position: 'absolute', inset: 6, borderRadius: '50%', overflow: 'hidden', background: PAPER}}>
            <Img src={staticFile(`faces/face_${face}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `7px solid ${INK}`, filter: 'url(#rough)'}} />
          {settled >= 3 && [0, 1, 2].map((i) => {
            const p = ((frame + i * 10) % 30) / 30;
            return (
              <svg key={i} width={40} height={60} viewBox="0 0 40 60" style={{position: 'absolute', left: 40 + i * 60, top: -56 - p * 30, opacity: Math.sin(p * Math.PI)}}>
                <path d="M20 58 C 5 45, 35 35, 20 22 C 8 12, 30 6, 22 0" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
              </svg>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 300, top: 38, fontSize: 40, fontWeight: 700, color: INK}}>Злость Кота</div>
        <div style={{position: 'absolute', left: 300, top: 110, width: barW, height: barH}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: 28, background: '#E4DDD0', overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 5, top: 0, bottom: 0, width: fillW, background: rampColor(value),
              backgroundImage: 'repeating-linear-gradient(135deg, rgba(34,28,28,0.16) 0 3px, rgba(0,0,0,0) 3px 14px)', backgroundPosition: `${frame * 0.8}px 0`}} />
          </div>
          <div style={{position: 'absolute', inset: 0, borderRadius: 28, border: `5px solid ${INK}`, filter: 'url(#rough)'}} />
          {[1, 2, 3].map((k) => (
            <div key={k} style={{position: 'absolute', left: (barW * k) / 4 - 2, top: -6, width: 4, height: barH + 12, background: INK, borderRadius: 2, filter: 'url(#rough)'}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 300, top: 190, fontSize: 36, fontStyle: 'italic', color: face >= 3 ? '#A33A26' : DUSK}}>«{STATES[face]}»</div>
        <div style={{position: 'absolute', left: 300 + barW - 160, top: 196, width: 160, textAlign: 'right', fontSize: 26, color: DUSK}}>{nStr} / 4</div>
      </div>
      {last && t < 40 && frame < 346 && (() => {
        const s = spring({frame: t, fps, config: {damping: 11, stiffness: 160}});
        const o = interpolate(t, [0, 4, 30, 40], [0, 1, 1, 0], clamp);
        const plus = last.d > 0;
        return (
          <div style={{position: 'absolute', left: 830, top: 92, transform: `scale(${s}) rotate(-4deg)`, opacity: o, transformOrigin: '0% 100%'}}>
            <div style={{background: PAPER, border: `4px solid ${INK}`, borderRadius: 16, padding: '10px 18px', boxShadow: '0 6px 16px rgba(0,0,0,0.3)'}}>
              <div style={{fontSize: 30, fontWeight: 700, color: INK, whiteSpace: 'nowrap'}}>{last.label} <span style={{color: plus ? ALARM : '#6F7F22'}}>{last.sign}</span></div>
              <div style={{fontSize: 22, fontStyle: 'italic', color: DUSK, whiteSpace: 'nowrap'}}>{last.sub}</div>
            </div>
          </div>
        );
      })()}
      <AbsoluteFill style={{background: '#fff6ea', opacity: flash}} />
      {frame >= 350 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
          <div style={{fontSize: 140, fontWeight: 700, color: ALARM, transform: `scale(${pogromIn}) rotate(-3deg)`, textShadow: `5px 5px 0 ${INK}`, WebkitTextStroke: `3px ${INK}`}}>ПОГРОМ!</div>
          <div style={{fontSize: 34, fontStyle: 'italic', color: PAPER, opacity: interpolate(frame, [360, 370], [0, 1], clamp)}}>дальше — видео погрома</div>
        </AbsoluteFill>
      )}
      <Vignette strength={0.6} />
      <Grain opacity={0.12} />
      <div style={{position: 'absolute', left: 28, bottom: 20, fontSize: 20, fontStyle: 'italic', color: 'rgba(244,242,235,0.75)'}}>Прототип · шкала злости Кота · v0.2</div>
    </AbsoluteFill>
  );
};
