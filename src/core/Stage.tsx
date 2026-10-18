import type React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, rgba, SCHEMES, type SchemeName} from '../theme';

export type Pattern = 'none' | 'grid' | 'dots' | 'rays' | 'scan';

const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='180' height='180' filter='url(%23n)' opacity='0.6'/></svg>")`;

const PatternLayer: React.FC<{
	readonly pattern: Pattern;
	readonly scheme: SchemeName;
}> = ({pattern, scheme}) => {
	const s = SCHEMES[scheme];
	const frame = useCurrentFrame();

	if (pattern === 'grid') {
		return (
			<AbsoluteFill
				style={{
					backgroundImage: `linear-gradient(to right, ${rgba(s.fg, 0.1)} 1px, transparent 1px), linear-gradient(to bottom, ${rgba(s.fg, 0.1)} 1px, transparent 1px)`,
					backgroundSize: '96px 96px',
					translate: `0px ${(frame * 0.18) % 96}px`,
				}}
			/>
		);
	}

	if (pattern === 'dots') {
		return (
			<AbsoluteFill
				style={{
					backgroundImage: `radial-gradient(${rgba(s.fg, 0.28)} 1.6px, transparent 1.9px)`,
					backgroundSize: '24px 24px',
					opacity: 0.55,
				}}
			/>
		);
	}

	if (pattern === 'rays') {
		return (
			<AbsoluteFill
				style={{
					background: `repeating-conic-gradient(from ${frame * 0.15}deg at 50% 50%, ${rgba(s.accent, 0.16)} 0deg 5deg, transparent 5deg 18deg)`,
					maskImage: 'radial-gradient(circle at center, transparent 12%, black 55%)',
				}}
			/>
		);
	}

	if (pattern === 'scan') {
		return (
			<AbsoluteFill
				style={{
					backgroundImage:
						'repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, transparent 1px, transparent 5px)',
					opacity: 0.6,
				}}
			/>
		);
	}

	return null;
};

export const Stage: React.FC<{
	readonly scheme: SchemeName;
	readonly pattern?: Pattern;
	readonly children: React.ReactNode;
}> = ({scheme, pattern = 'none', children}) => {
	const s = SCHEMES[scheme];

	return (
		<AbsoluteFill style={{backgroundColor: s.bg, color: s.fg, overflow: 'hidden'}}>
			<PatternLayer pattern={pattern} scheme={scheme} />
			<AbsoluteFill
				style={{
					background: `radial-gradient(1400px 1000px at 18% 8%, rgba(255,255,255,0.16), transparent 62%), radial-gradient(1200px 900px at 88% 96%, ${rgba(s.accent, 0.12)}, transparent 60%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					backgroundImage: NOISE,
					backgroundPosition: `${0}px ${0}px`,
					opacity: 0.07,
					mixBlendMode: 'overlay',
					pointerEvents: 'none',
				}}
			/>
			<AbsoluteFill
				style={{
					boxShadow: `inset 0 0 240px ${rgba('#000000', 0.22)}`,
					pointerEvents: 'none',
				}}
			/>
			<AbsoluteFill>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const useEnter = (delay = 0, damping = 16) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({
		frame: frame - delay,
		fps,
		config: {damping, mass: 0.6, stiffness: 150},
	});
};

export const useSeconds = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return frame / fps;
};

export const SmallCaps: React.FC<{
	readonly children: React.ReactNode;
	readonly color?: string;
	readonly size?: number;
}> = ({children, color, size = 22}) => (
	<span
		style={{
			fontFamily: FONT.mono,
			fontSize: size,
			letterSpacing: 4,
			textTransform: 'uppercase',
			color,
		}}
	>
		{children}
	</span>
);
