import type React from 'react';
import type {CSSProperties} from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, type Scheme} from '../theme';

export const fitSize = (
	text: string,
	base: number,
	maxWidth = 1420,
	factor = 0.52,
) => Math.min(base, maxWidth / Math.max(1, text.length * factor));

export const Headline: React.FC<{
	readonly children: React.ReactNode;
	readonly size: number;
	readonly color: string;
	readonly align?: CSSProperties['textAlign'];
	readonly style?: CSSProperties;
	readonly lineHeight?: number;
	readonly letterSpacing?: number;
}> = ({
	children,
	size,
	color,
	align = 'left',
	style,
	lineHeight = 0.84,
	letterSpacing = -0.035,
}) => (
	<div
		style={{
			fontFamily: FONT.display,
			fontSize: size,
			lineHeight,
			letterSpacing: `${letterSpacing}em`,
			textTransform: 'uppercase',
			color,
			textAlign: align,
			margin: 0,
			...style,
		}}
	>
		{children}
	</div>
);

export const Serif: React.FC<{
	readonly children: React.ReactNode;
	readonly size: number;
	readonly color: string;
	readonly style?: CSSProperties;
}> = ({children, size, color, style}) => (
	<span
		style={{
			fontFamily: FONT.serif,
			fontStyle: 'italic',
			fontWeight: 400,
			fontSize: size,
			lineHeight: 0.9,
			color,
			...style,
		}}
	>
		{children}
	</span>
);

export const Pixel: React.FC<{
	readonly children: React.ReactNode;
	readonly size: number;
	readonly color: string;
	readonly style?: CSSProperties;
}> = ({children, size, color, style}) => (
	<span
		style={{
			fontFamily: FONT.pixel,
			fontSize: size,
			lineHeight: 1.1,
			letterSpacing: 0,
			color,
			...style,
		}}
	>
		{children}
	</span>
);

export const Tag: React.FC<{
	readonly children: React.ReactNode;
	readonly scheme: Scheme;
	readonly style?: CSSProperties;
	readonly filled?: boolean;
}> = ({children, scheme, style, filled = false}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 8,
			border: `1.5px solid ${scheme.line}`,
			backgroundColor: filled ? scheme.line : 'transparent',
			color: filled ? scheme.bg : scheme.fg,
			fontFamily: FONT.mono,
			fontSize: 17,
			letterSpacing: 2.5,
			textTransform: 'uppercase',
			padding: '7px 13px',
			lineHeight: 1,
			...style,
		}}
	>
		{children}
	</div>
);

export const Squiggle: React.FC<{
	readonly color: string;
	readonly width?: number | string;
	readonly style?: CSSProperties;
	readonly progress?: number;
}> = ({color, width = '100%', style, progress = 1}) => (
	<svg
		width={width}
		height={18}
		viewBox="0 0 200 18"
		preserveAspectRatio="none"
		style={{display: 'block', ...style}}
	>
		<path
			d="M2 12 Q12 4 24 10 T46 10 T68 9 T90 11 T112 9 T134 11 T156 8 T178 11 T198 9"
			fill="none"
			stroke={color}
			strokeWidth={4}
			strokeLinecap="round"
			pathLength={1}
			strokeDasharray={1}
			strokeDashoffset={1 - Math.max(0, Math.min(1, progress))}
		/>
	</svg>
);

export const CircleMark: React.FC<{
	readonly color: string;
	readonly children: React.ReactNode;
	readonly progress?: number;
}> = ({color, children, progress = 1}) => (
	<span style={{position: 'relative', display: 'inline-block'}}>
		{children}
		<svg
			viewBox="0 0 300 120"
			preserveAspectRatio="none"
			style={{
				position: 'absolute',
				inset: -14,
				width: 'calc(100% + 28px)',
				height: 'calc(100% + 28px)',
				overflow: 'visible',
				pointerEvents: 'none',
			}}
		>
			<ellipse
				cx={150}
				cy={60}
				rx={142}
				ry={52}
				fill="none"
				stroke={color}
				strokeWidth={4}
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - Math.max(0, Math.min(1, progress))}
				transform="rotate(-4 150 60)"
			/>
		</svg>
	</span>
);

export const Reveal: React.FC<{
	readonly children: React.ReactNode;
	readonly delay?: number;
	readonly style?: CSSProperties;
	readonly distance?: number;
}> = ({children, delay = 0, style, distance = 40}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = spring({
		frame: frame - delay,
		fps,
		config: {damping: 18, mass: 0.7, stiffness: 140},
	});

	return (
		<div
			style={{
				opacity: enter,
				translate: `0 ${(1 - enter) * distance}px`,
				...style,
			}}
		>
			{children}
		</div>
	);
};

export const MaskReveal: React.FC<{
	readonly children: React.ReactNode;
	readonly delay?: number;
	readonly style?: CSSProperties;
}> = ({children, delay = 0, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = spring({
		frame: frame - delay,
		fps,
		config: {damping: 22, mass: 0.8, stiffness: 120},
	});

	return (
		<div style={{overflow: 'hidden', ...style}}>
			<div
				style={{
					translate: `0 ${(1 - enter) * 105}%`,
					opacity: Math.min(1, enter * 2),
				}}
			>
				{children}
			</div>
		</div>
	);
};

export const WordStagger: React.FC<{
	readonly text: string;
	readonly size: number;
	readonly color: string;
	readonly delay?: number;
	readonly font?: 'sans' | 'display' | 'serif';
	readonly style?: CSSProperties;
}> = ({text, size, color, delay = 0, font = 'sans', style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const words = text.split(' ');

	return (
		<div style={{display: 'flex', flexWrap: 'wrap', gap: '0 0.28em', ...style}}>
			{words.map((word, index) => {
				const enter = spring({
					frame: frame - delay - index * 3,
					fps,
					config: {damping: 20, mass: 0.6, stiffness: 160},
				});
				return (
					<span
						key={`${word}-${index}`}
						style={{
							display: 'inline-block',
							opacity: enter,
							translate: `0 ${(1 - enter) * 26}px`,
							fontFamily:
								font === 'display' ? FONT.display : font === 'serif' ? FONT.serif : FONT.sans,
							fontStyle: font === 'serif' ? 'italic' : 'normal',
							textTransform: font === 'display' ? 'uppercase' : 'none',
							fontSize: size,
							lineHeight: 1.02,
							letterSpacing: font === 'display' ? '-0.03em' : '-0.01em',
							fontWeight: font === 'serif' ? 400 : 500,
							color,
						}}
					>
						{word}
					</span>
				);
			})}
		</div>
	);
};

export const Marquee: React.FC<{
	readonly text: string;
	readonly size: number;
	readonly color: string;
	readonly speed?: number;
	readonly font?: 'display' | 'serif' | 'pixel' | 'mono';
	readonly style?: CSSProperties;
	readonly separator?: string;
}> = ({text, size, color, speed = 3, font = 'display', style, separator = '  ✳  '}) => {
	const frame = useCurrentFrame();
	const family =
		font === 'display'
			? FONT.display
			: font === 'serif'
				? FONT.serif
				: font === 'pixel'
					? FONT.pixel
					: FONT.mono;

	return (
		<div style={{overflow: 'hidden', whiteSpace: 'nowrap', ...style}}>
			<div
				style={{
					display: 'inline-block',
					translate: `${-(frame * speed) % 2400}px 0`,
					fontFamily: family,
					fontStyle: font === 'serif' ? 'italic' : 'normal',
					fontSize: size,
					lineHeight: 1,
					color,
					textTransform: font === 'serif' ? 'none' : 'uppercase',
					letterSpacing: font === 'display' ? '-0.02em' : '0.01em',
					whiteSpace: 'nowrap',
				}}
			>
				{Array.from({length: 10}, (_, index) => (
					<span key={index}>
						{text}
						{separator}
					</span>
				))}
			</div>
		</div>
	);
};
