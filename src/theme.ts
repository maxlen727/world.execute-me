import {loadFont as loadArchivo} from '@remotion/google-fonts/Archivo';
import {loadFont as loadMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as loadSerif} from '@remotion/google-fonts/CormorantGaramond';

const archivo = loadArchivo('normal', {
	weights: ['300', '400', '500', '700', '900'],
	subsets: ['latin'],
});
const mono = loadMono('normal', {
	weights: ['300', '400', '500', '600'],
	subsets: ['latin'],
});
const serif = loadSerif('italic', {weights: ['400', '600'], subsets: ['latin']});

export const FONT = {
	display: `${archivo.fontFamily}, Helvetica, sans-serif`,
	sans: `${archivo.fontFamily}, Helvetica, sans-serif`,
	serif: `${serif.fontFamily}, Georgia, serif`,
	mono: `${mono.fontFamily}, monospace`,
	pixel: `${archivo.fontFamily}, Helvetica, sans-serif`,
} as const;

export type Tone = 'ink' | 'bone';

export type Palette = {
	readonly bg: string;
	readonly fg: string;
	readonly accent: string;
	readonly accent2: string;
	readonly dim: string;
	readonly panel: string;
	readonly line: string;
	readonly card: string;
	readonly ember: string;
	readonly blood: string;
};

export const INK: Palette = {
	bg: '#0A0A0B',
	fg: '#EEE9DF',
	accent: '#FF4D12',
	accent2: '#FF8A3D',
	dim: '#9C978F',
	panel: '#151517',
	line: 'rgba(238,233,223,0.22)',
	card: '#151517',
	ember: '#FF8A3D',
	blood: '#C21D0B',
};

export const BONE: Palette = {
	bg: '#EEE9DF',
	fg: '#0A0A0B',
	accent: '#FF4D12',
	accent2: '#C21D0B',
	dim: '#5E5B57',
	panel: '#F7F2E8',
	line: 'rgba(10,10,11,0.22)',
	card: '#F7F2E8',
	ember: '#FF8A3D',
	blood: '#C21D0B',
};

export const PALETTES: Record<Tone, Palette> = {ink: INK, bone: BONE};

export type SchemeName =
	| 'cream'
	| 'red'
	| 'blue'
	| 'ink'
	| 'pink'
	| 'purple'
	| 'mint'
	| 'yellow'
	| 'paper'
	| 'paperPurple'
	| 'paperGreen'
	| 'paperOrange';

export type Scheme = Palette;

export const SCHEMES: Record<SchemeName, Scheme> = {
	cream: BONE,
	red: INK,
	blue: INK,
	ink: INK,
	pink: BONE,
	purple: INK,
	mint: BONE,
	yellow: BONE,
	paper: BONE,
	paperPurple: BONE,
	paperGreen: BONE,
	paperOrange: BONE,
};

export const AUDIO_FILE = 'world-execute-me.mp3';

export const rgba = (hex: string, alpha: number) => {
	const value = hex.replace('#', '');
	const r = parseInt(value.slice(0, 2), 16);
	const g = parseInt(value.slice(2, 4), 16);
	const b = parseInt(value.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
