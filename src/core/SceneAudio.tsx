import type React from 'react';
import {AudioAnalysis, SongAudio} from './Audio';
import {Plate, PlateNumberProvider} from './Plate';
import type {Tone} from '../theme';

export const SceneAudio: React.FC<{
	readonly startFrame: number;
	readonly withAudio?: boolean;
	readonly tone?: Tone;
	readonly plate?: number;
	readonly frame?: boolean;
	readonly children: React.ReactNode;
}> = ({startFrame, withAudio = false, tone = 'ink', plate = 1, frame = false, children}) => (
	<Plate tone={tone} frame={frame}>
		<PlateNumberProvider value={plate}>
		<AudioAnalysis offsetInFrames={startFrame}>
			{withAudio ? <SongAudio trimBefore={startFrame} /> : null}
			{children}
		</AudioAnalysis>
		</PlateNumberProvider>
	</Plate>
);
