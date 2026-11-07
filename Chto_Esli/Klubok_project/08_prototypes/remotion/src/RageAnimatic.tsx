import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate, Easing} from 'remotion';
import {Grain, Vignette, INK, PAPER, TERRA, SERIF} from './common';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const RageAnimatic: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let src = 'kf/kf1_tension.jpg';
  let scale = 1, tx = 0, ty = 0, blur = 0, fr = 0;
  if (frame < 66) {
    scale = interpolate(frame, [0, 66], [1.0, 1.14], {...clamp, easing: Easing.in(Easing.quad)});
    const amp = interpolate(frame, [36, 64], [0, 4], clamp);
    tx = amp * Math.sin(frame * 2.3); ty = amp * Math.cos(frame * 1.9);
  } else if (frame < 130) {
    src = 'kf/kf2_crash.jpg';
    const t = frame - 66;
    scale = interpolate(t, [0, 64], [1.14, 1.04], {...clamp, easing: Easing.out(Easing.cubic)});
    const amp = 16 * Math.exp(-t / 9);
    tx = amp * Math.sin(t * 2.6); ty = amp * Math.cos(t * 3.1);
    blur = interpolate(t, [0, 4], [6, 0], clamp);
  } else {
    src = 'kf/kf3_aftermath.jpg';
    const t = frame - 130;
    scale = interpolate(Math.min(t, 20), [0, 110], [1.0, 1.07]);
    fr = interpolate(t, [18, 24], [0, 1], clamp);
  }
  const filter = `blur(${blur}px) grayscale(${0.85 * fr}) sepia(${0.25 * fr}) contrast(${1 + 0.06 * fr}) brightness(${1 - 0.06 * fr})`;
  const redPulse = frame < 130 ? 0.12 + 0.12 * Math.sin(frame * 0.4) : 0;
  const flash = Math.max(interpolate(frame, [62, 66, 72], [0, 0.9, 0], clamp), interpolate(frame, [146, 149, 156], [0, 0.55, 0], clamp));
  const fadeIn = interpolate(frame, [0, 8], [1, 0], clamp);
  const fadeOut = interpolate(frame, [222, 240], [0, 1], clamp);
  const tagIn = spring({frame: frame - 158, fps, config: {damping: 10, stiffness: 130}});
  const titleIn = spring({frame: frame - 154, fps, config: {damping: 14, stiffness: 120}});
  return (
    <AbsoluteFill style={{background: '#000', fontFamily: SERIF, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${scale})`, filter}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 85% 45%, rgba(217,85,59,${redPulse}) 0%, rgba(217,85,59,0) 55%)`}} />
      <Vignette strength={0.5 + 0.25 * fr} />
      <Grain opacity={0.14 + 0.06 * fr} />
      {frame >= 150 && (
        <div style={{position: 'absolute', left: 48, top: 36, fontSize: 60, fontWeight: 700, color: PAPER, opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * -30}px)`, textShadow: `3px 3px 0 ${INK}`}}>
          Что если<span style={{color: TERRA}}>?</span>
        </div>
      )}
      {frame >= 158 && (
        <div style={{position: 'absolute', left: 360, top: 520, transform: `scale(${tagIn}) rotate(-3deg)`, transformOrigin: '50% 50%'}}>
          <div style={{background: PAPER, border: `5px solid ${INK}`, borderRadius: 18, padding: '14px 30px', boxShadow: '0 10px 24px rgba(0,0,0,0.45)', textAlign: 'center'}}>
            <div style={{fontSize: 56, fontWeight: 700, color: INK, whiteSpace: 'nowrap'}}>Ёлка повержена</div>
            <div style={{fontSize: 26, fontStyle: 'italic', color: '#655A62', whiteSpace: 'nowrap'}}>погром № 1 · добавлен в альбом «Что если?»</div>
          </div>
        </div>
      )}
      {frame >= 12 && frame < 222 && (
        <div style={{position: 'absolute', right: 30, bottom: 22, fontSize: 22, fontStyle: 'italic', color: 'rgba(244,242,235,0.8)'}}>Пропустить ›</div>
      )}
      <AbsoluteFill style={{background: '#fff6ea', opacity: flash}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut)}} />
    </AbsoluteFill>
  );
};
