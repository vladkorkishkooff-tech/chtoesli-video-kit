import React from 'react';
import {Composition} from 'remotion';
import {AngerMeter} from './AngerMeter';
import {RageAnimatic} from './RageAnimatic';
export const Root: React.FC = () => (
  <>
    <Composition id="AngerMeter" component={AngerMeter} durationInFrames={390} fps={30} width={1280} height={720} />
    <Composition id="RageAnimatic" component={RageAnimatic} durationInFrames={240} fps={30} width={1280} height={720} />
  </>
);
