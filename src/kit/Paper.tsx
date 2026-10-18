import type React from 'react';
import type {CSSProperties} from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT, rgba, type Scheme} from '../theme';

export const Sticker: React.FC<{
	readonly scheme: Scheme;
	readonly children: React.ReactNode;
	readonly rotate?: number;
	readonly style?: CSSProperties;
	readonly padding?: number;
	readonly shadowColor?: string;
	readonly tape?: boolean;
}> = ({
	scheme,
	children,
	rotate = -2,
	style,
	padding = 26,
	shadowColor,
	tape = false,
}) => (
	<div style={{position: 'relative', display: 'inline-block', rotate: `${rotate}deg`, ...style}}>
		<div
			style={{
				backgroundColor: scheme.card,
				border: `3px solid ${scheme.line}`,
				boxShadow: `12px 12px 0 ${shadowColor ?? scheme.accent}`,
				padding,
				color: scheme.line,
			}}
		>
			{children}
		</div>
		{tape ? (
			<>
				<div
					style={{
						position: 'absolute',
						top: -16,
						left: '18%',
						width: 110,
						height: 30,
						backgroundColor: rgba('#F4C24E', 0.75),
						rotate: '-6deg',
						border: `1px solid ${rgba(scheme.line, 0.15)}`,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						top: -12,
						right: '14%',
						width: 90,
						height: 28,
						backgroundColor: rgba('#F4C24E', 0.65),
						rotate: '7deg',
						border: `1px solid ${rgba(scheme.line, 0.15)}`,
					}}
				/>
			</>
		) : null}
	</div>
);

export const RetroWindow: React.FC<{
	readonly scheme: Scheme;
	readonly title: string;
	readonly children: React.ReactNode;
	readonly style?: CSSProperties;
	readonly footer?: string;
	readonly rotate?: number;
}> = ({scheme, title, children, style, footer, rotate = 0}) => (
	<div
		style={{
			border: `2.5px solid ${scheme.line}`,
			backgroundColor: scheme.card,
			color: scheme.line,
			boxShadow: `10px 10px 0 ${rgba(scheme.line, 0.9)}`,
			rotate: `${rotate}deg`,
			...style,
		}}
	>
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				borderBottom: `2.5px solid ${scheme.line}`,
				padding: '10px 14px',
				backgroundColor: scheme.accent,
				color: scheme.card,
			}}
		>
			<div style={{display: 'flex', gap: 6}}>
				{['#E23A2E', '#F4C24E', '#B9E0CB'].map((color) => (
					<div
						key={color}
						style={{
							width: 12,
							height: 12,
							borderRadius: 99,
							backgroundColor: color,
							border: `1.5px solid ${scheme.line}`,
						}}
					/>
				))}
			</div>
			<div
				style={{
					fontFamily: FONT.mono,
					fontSize: 17,
					letterSpacing: 2,
					textTransform: 'uppercase',
					whiteSpace: 'nowrap',
				}}
			>
				{title}
			</div>
		</div>
		<div style={{padding: '24px 26px'}}>{children}</div>
		{footer ? (
			<div
				style={{
					borderTop: `2px solid ${scheme.line}`,
					padding: '8px 14px',
					fontFamily: FONT.mono,
					fontSize: 15,
					letterSpacing: 2,
					display: 'flex',
					justifyContent: 'space-between',
					opacity: 0.8,
					textTransform: 'uppercase',
				}}
			>
				<span>{footer}</span>
				<span>{'[ x ]'}</span>
			</div>
		) : null}
	</div>
);

const HEART_BITMAP = [
	'00111001110',
	'01111111111',
	'11111111111',
	'11111111111',
	'11111111111',
	'01111111110',
	'00111111100',
	'00011111000',
	'00001110000',
	'00000100000',
];

export const PixelHeart: React.FC<{
	readonly size?: number;
	readonly color?: string;
	readonly highlight?: string;
	readonly style?: CSSProperties;
	readonly beat?: number;
}> = ({size = 8, color = '#DE3B2F', highlight, style, beat = 0}) => (
	<div
		style={{
			display: 'grid',
			gridTemplateColumns: `repeat(11, ${size}px)`,
			gap: 0,
			scale: 1 + beat * 0.08,
			...style,
		}}
	>
		{HEART_BITMAP.flatMap((row, y) =>
			row.split('').map((cell, x) => {
				const isHighlight = highlight && (x === 2 || x === 3) && (y === 1 || y === 2);
				return (
					<div
						key={`${x}-${y}`}
						style={{
							width: size,
							height: size,
							backgroundColor:
								cell === '1' ? (isHighlight ? highlight : color) : 'transparent',
						}}
					/>
				);
			}),
		)}
	</div>
);

export const CursorArrow: React.FC<{
	readonly color?: string;
	readonly size?: number;
	readonly style?: CSSProperties;
}> = ({color = '#131218', size = 48, style}) => (
	<svg viewBox="0 0 24 24" width={size} height={size} style={{...style}}>
		<path
			d="M4 2 L4 19 L9 14 L12 21 L15 20 L12 13 L19 13 Z"
			fill={color}
			stroke="#FFFBF0"
			strokeWidth={1.2}
			strokeLinejoin="round"
		/>
	</svg>
);

export const Stamp: React.FC<{
	readonly children: React.ReactNode;
	readonly scheme: Scheme;
	readonly rotate?: number;
	readonly style?: CSSProperties;
	readonly color?: string;
}> = ({children, scheme, rotate = -8, style, color}) => (
	<div
		style={{
			display: 'inline-block',
			border: `4px double ${color ?? scheme.accent}`,
			color: color ?? scheme.accent,
			fontFamily: FONT.display,
			fontSize: 42,
			letterSpacing: '0.02em',
			textTransform: 'uppercase',
			padding: '10px 22px',
			rotate: `${rotate}deg`,
			opacity: 0.92,
			...style,
		}}
	>
		{children}
	</div>
);

export const Tape: React.FC<{
	readonly width?: number;
	readonly rotate?: number;
	readonly color?: string;
	readonly style?: CSSProperties;
}> = ({width = 120, rotate = -5, color = 'rgba(244,194,78,0.75)', style}) => (
	<div
		style={{
			width,
			height: 30,
			backgroundColor: color,
			rotate: `${rotate}deg`,
			border: '1px solid rgba(19,18,24,0.12)',
			...style,
		}}
	/>
);

export const Sparkle: React.FC<{
	readonly size?: number;
	readonly color?: string;
	readonly style?: CSSProperties;
}> = ({size = 40, color = '#F4C24E', style}) => (
	<svg viewBox="0 0 40 40" width={size} height={size} style={style}>
		<path d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z" fill={color} />
	</svg>
);

export const ArrowDoodle: React.FC<{
	readonly color?: string;
	readonly width?: number;
	readonly height?: number;
	readonly style?: CSSProperties;
	readonly flip?: boolean;
}> = ({color = '#DE3B2F', width = 220, height = 110, style, flip = false}) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 220 110"
		style={{overflow: 'visible', scale: flip ? '-1 1' : undefined, ...style}}
	>
		<path
			d="M6 86 C 40 26, 120 12, 184 48"
			fill="none"
			stroke={color}
			strokeWidth={4}
			strokeLinecap="round"
		/>
		<path
			d="M164 30 L188 49 L158 62"
			fill="none"
			stroke={color}
			strokeWidth={4}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

export const Daisy: React.FC<{
	readonly size?: number;
	readonly petal?: string;
	readonly center?: string;
	readonly style?: CSSProperties;
}> = ({size = 70, petal = '#FFFBF0', center = '#F4C24E', style}) => {
	const petals = Array.from({length: 8}, (_, index) => index * 45);
	return (
		<div style={{position: 'relative', width: size, height: size, ...style}}>
			{petals.map((angle) => (
				<div
					key={angle}
					style={{
						position: 'absolute',
						left: '50%',
						top: '50%',
						width: size * 0.3,
						height: size * 0.46,
						marginLeft: -size * 0.15,
						marginTop: -size * 0.46,
						borderRadius: '50% 50% 40% 40%',
						backgroundColor: petal,
						border: '2px solid rgba(19,18,24,0.35)',
						transformOrigin: '50% 100%',
						rotate: `${angle}deg`,
					}}
				/>
			))}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: '50%',
					width: size * 0.32,
					height: size * 0.32,
					marginLeft: -size * 0.16,
					marginTop: -size * 0.16,
					borderRadius: 99,
					backgroundColor: center,
					border: '2px solid rgba(19,18,24,0.4)',
				}}
			/>
		</div>
	);
};

export const RegistrationMark: React.FC<{
	readonly color: string;
	readonly style?: CSSProperties;
}> = ({color, style}) => {
	const frame = useCurrentFrame();
	return (
		<svg
			viewBox="0 0 24 24"
			width={24}
			height={24}
			style={{opacity: 0.35, rotate: `${frame * 0.5}deg`, ...style}}
		>
			<path d="M12 2 V22 M2 12 H22" stroke={color} strokeWidth={1} />
			<circle cx={12} cy={12} r={7} fill="none" stroke={color} strokeWidth={1} />
		</svg>
	);
};
