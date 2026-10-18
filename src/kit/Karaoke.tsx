import type React from 'react';
import type {CSSProperties} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, rgba} from '../theme';
import {usePlate} from '../core/Plate';

type Word = {text: string; start: number; end: number; weight: number};

const weightOf = (word: string) => Math.max(2, word.replace(/[^a-zA-Z0-9]/g, '').length);

export const Karaoke: React.FC<{
	readonly text: string;
	readonly startFrame: number;
	readonly endFrame: number;
	readonly size: number;
	readonly font?: 'display' | 'mono' | 'serif';
	readonly weight?: number;
	readonly align?: CSSProperties['textAlign'];
	readonly width?: number;
	readonly style?: CSSProperties;
	readonly uppercase?: boolean;
	readonly activeColor?: string;
	readonly tracking?: number;
	readonly dimOpacity?: number;
}> = ({
	text,
	startFrame,
	endFrame,
	size,
	font = 'display',
	weight = 900,
	align = 'left',
	width,
	style,
	uppercase = true,
	activeColor,
	tracking = -0.035,
	dimOpacity = 0.3,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = usePlate();
	const words = text.split(' ').filter(Boolean);
	const weights = words.map(weightOf);
	const total = weights.reduce((sum, value) => sum + value, 0);
	const start = startFrame / fps;
	const end = Math.max(start + 0.2, endFrame / fps);
	const duration = end - start;

	let cursor = start;
	const timed: Word[] = words.map((word, index) => {
		const wordDuration = (weights[index] / total) * duration;
		const item = {text: word, start: cursor, end: cursor + wordDuration, weight: weights[index]};
		cursor += wordDuration;
		return item;
	});

	const now = frame / fps;
	const accent = activeColor ?? p.accent;
	const family = font === 'mono' ? FONT.mono : font === 'serif' ? FONT.serif : FONT.display;

	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				gap: `0 ${size * 0.24}px`,
				width,
				justifyContent: align === 'center' ? 'center' : 'flex-start',
				textAlign: align,
				...style,
			}}
		>
			{timed.map((word, index) => {
				const state = now < word.start ? 'future' : now <= word.end ? 'active' : 'past';
				const age = now - word.start;
				const pop = state === 'active' ? 1 + Math.max(0, 1 - age / 0.14) * 0.07 : 1;
				return (
					<span
						key={`${word.text}-${index}`}
						style={{
							display: 'inline-block',
							transformOrigin: 'left bottom',
							scale: pop,
							translate: state === 'active' ? `0 ${-Math.max(0, 1 - age / 0.14) * 3}px` : '0 0',
							fontFamily: family,
							fontWeight: font === 'serif' ? 600 : weight,
							fontStyle: font === 'serif' ? 'italic' : 'normal',
							fontSize: size,
							lineHeight: 0.98,
							letterSpacing: `${tracking}em`,
							textTransform: uppercase && font !== 'serif' ? 'uppercase' : 'none',
							color: state === 'active' ? accent : state === 'past' ? p.fg : rgba(p.fg, dimOpacity),
							textShadow: state === 'active' ? `0 0 24px ${rgba(accent, 0.35)}` : undefined,
						}}
					>
						{word.text}
					</span>
				);
			})}
		</div>
	);
};
