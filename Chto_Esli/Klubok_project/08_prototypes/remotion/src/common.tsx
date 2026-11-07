import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
export const INK = '#221C1C', PAPER = '#F4F2EB', TERRA = '#C96F45', WARM = '#EDC193', DUSK = '#655A62', OLIVE = '#D0C15C', ALARM = '#D9553B';
export const SERIF = 'Georgia, "Times New Roman", serif';
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.1}) => {
  const f = useCurrentFrame();
  const i = Math.floor(f / 2) % 6;
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity}}>
      <Img src={staticFile(`grain/g${i}.png`)} style={{width: '100%', height: '100%'}} />
    </AbsoluteFill>
  );
};
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(20,16,22,${strength}) 100%)`}} />
);
export const RoughDefs: React.FC<{id: string; scale?: number}> = ({id, scale = 3}) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 4) % 5;
  return (
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
};
const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
export const rampColor = (v: number) => {
  const stops: [number, string][] = [[0, OLIVE], [1.33, WARM], [2.66, TERRA], [4, ALARM]];
  const x = Math.max(0, Math.min(4, v));
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (x <= b) return mix(ca, cb, (x - a) / (b - a));
  }
  return ALARM;
};
