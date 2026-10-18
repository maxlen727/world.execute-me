import {Audio} from '@remotion/media';
import {
	useAudioData,
	visualizeAudio,
	visualizeAudioWaveform,
} from '@remotion/media-utils';
import type React from 'react';
import {createContext, useContext, useMemo} from 'react';
import {staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AUDIO_FILE} from '../theme';

/**
 * The song is 211.9s long and starts at frame 0 of the master composition.
 * Scenes are mounted inside sequences, so their local frame is 0-based.
 * This context carries the absolute song frame into the scenes.
 */
const GlobalFrameContext = createContext<number | null>(null);

export const GlobalFrame: React.FC<{children: React.ReactNode}> = ({
	children,
}) => {
	const frame = useCurrentFrame();
	return (
		<GlobalFrameContext.Provider value={frame}>
			{children}
		</GlobalFrameContext.Provider>
	);
};

export const useGlobalFrame = (offsetInFrames: number) => {
	const absolute = useContext(GlobalFrameContext);
	const local = useCurrentFrame();
	return absolute ?? local + offsetInFrames;
};

export type Bands = {
	readonly bass: number;
	readonly mid: number;
	readonly high: number;
	readonly level: number;
	readonly spectrum: number[];
	readonly wave: number[];
	readonly ready: boolean;
};

const EMPTY: Bands = {
	bass: 0,
	mid: 0,
	high: 0,
	level: 0,
	spectrum: [],
	wave: [],
	ready: false,
};

const AudioBandsContext = createContext<Bands>(EMPTY);

const MAX_DB = -6;
const MIN_DB = -62;

const scaleSample = (value: number) => {
	const db = 20 * Math.log10(Math.max(value, 0.0000001));
	const normalized = (db - MIN_DB) / (MAX_DB - MIN_DB);
	return Math.max(0, Math.min(1, normalized));
};

const average = (values: number[]) =>
	values.length === 0
		? 0
		: values.reduce((sum, value) => sum + value, 0) / values.length;

export const AudioAnalysis: React.FC<{
	readonly children: React.ReactNode;
	readonly offsetInFrames: number;
}> = ({children, offsetInFrames}) => {
	const frame = useGlobalFrame(offsetInFrames);
	const {fps} = useVideoConfig();
	const audioData = useAudioData(staticFile(AUDIO_FILE));

	const bands = useMemo<Bands>(() => {
		if (!audioData) {
			return EMPTY;
		}

		const raw = visualizeAudio({
			audioData,
			frame,
			fps,
			numberOfSamples: 64,
			optimizeFor: 'speed',
		});

		const spectrum = raw.map((value) => scaleSample(value));
		const wave = visualizeAudioWaveform({
			audioData,
			frame,
			fps,
			numberOfSamples: 128,
			windowInSeconds: 0.25,
		}).map((value) => Math.max(-1, Math.min(1, value * 2.6)));

		const bass = average(spectrum.slice(0, 6));
		const mid = average(spectrum.slice(6, 28));
		const high = average(spectrum.slice(28, 64));

		return {
			bass,
			mid,
			high,
			level: Math.min(1, bass * 0.45 + mid * 0.35 + high * 0.2),
			spectrum,
			wave,
			ready: true,
		};
	}, [audioData, frame, fps]);

	return (
		<AudioBandsContext.Provider value={bands}>
			{children}
		</AudioBandsContext.Provider>
	);
};

export const useBands = () => useContext(AudioBandsContext);

export const SongAudio: React.FC<{readonly trimBefore?: number}> = ({
	trimBefore = 0,
}) => {
	return <Audio src={staticFile(AUDIO_FILE)} trimBefore={trimBefore} />;
};
