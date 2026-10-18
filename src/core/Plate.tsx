import type React from 'react';
import {createContext, useContext, useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {INK, PALETTES, rgba, type Palette, type Tone} from '../theme';

const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.6'/></svg>")`;

export type PlateColors = Palette & {
	readonly tone: Tone;
	readonly hatchId: string;
};

const PlateContext = createContext<PlateColors>({...INK, tone: 'ink', hatchId: 'hatch-none'});
const PlateNumberContext = createContext(1);

export const usePlate = () => useContext(PlateContext);
export const PlateNumberProvider = PlateNumberContext.Provider;
export const usePlateNumber = () => useContext(PlateNumberContext);

const CropMarks: React.FC<{readonly color: string}> = ({color}) => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		{[
			{left: 30, top: 30, rotate: 0},
			{right: 30, top: 30, rotate: 90},
			{right: 30, bottom: 30, rotate: 180},
			{left: 30, bottom: 30, rotate: 270},
		].map((corner, index) => (
			<div
				key={index}
				style={{
					position: 'absolute',
					left: corner.left,
					right: corner.right,
					top: corner.top,
					bottom: corner.bottom,
					width: 44,
					height: 44,
					borderLeft: `1px solid ${color}`,
					borderTop: `1px solid ${color}`,
					rotate: `${corner.rotate}deg`,
					opacity: 0.55,
				}}
			/>
		))}
		<div
			style={{
				position: 'absolute',
				inset: 46,
				border: `1px solid ${rgba(color, 0.18)}`,
			}}
		/>
	</AbsoluteFill>
);

export const Plate: React.FC<{
	readonly tone: Tone;
	readonly frame?: boolean;
	readonly children: React.ReactNode;
}> = ({tone, frame = false, children}) => {
	const p = PALETTES[tone];
	const rawId = useId();
	const hatchId = `hatch-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
	const isInk = tone === 'ink';

	return (
		<PlateContext.Provider value={{...p, tone, hatchId}}>
			<AbsoluteFill style={{backgroundColor: p.bg, color: p.fg, overflow: 'hidden'}}>
				<AbsoluteFill
					style={{
						background: isInk
							? `radial-gradient(1200px 800px at 38% 30%, #19191C 0%, #0A0A0B 58%, #050506 100%)`
							: `radial-gradient(1300px 900px at 42% 26%, #F8F4EA 0%, #EEE9DF 62%, #E2DBCB 100%)`,
					}}
				/>
				{isInk ? (
					<AbsoluteFill
						style={{
							backgroundImage: `linear-gradient(to right, ${rgba(p.fg, 0.035)} 1px, transparent 1px), linear-gradient(to bottom, ${rgba(p.fg, 0.035)} 1px, transparent 1px)`,
							backgroundSize: '120px 120px',
							pointerEvents: 'none',
						}}
					/>
				) : null}
				<AbsoluteFill
					style={{
						backgroundImage: NOISE,
						opacity: isInk ? 0.07 : 0.055,
						mixBlendMode: isInk ? 'overlay' : 'multiply',
						pointerEvents: 'none',
					}}
				/>
				<svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
					<defs>
						<pattern
							id={hatchId}
							width={6}
							height={6}
							patternUnits="userSpaceOnUse"
							patternTransform="rotate(45)"
						>
							<line x1={0} y1={0} x2={0} y2={6} stroke={p.fg} strokeWidth={0.7} opacity={0.55} />
						</pattern>
					</defs>
				</svg>
				{frame ? <CropMarks color={p.fg} /> : null}
				<AbsoluteFill
					style={{
						boxShadow: isInk
							? 'inset 0 0 300px rgba(0,0,0,0.85)'
							: 'inset 0 0 220px rgba(10,10,11,0.18)',
						pointerEvents: 'none',
					}}
				/>
				{children}
			</AbsoluteFill>
		</PlateContext.Provider>
	);
};

export const Spark: React.FC<{
	readonly x: number;
	readonly y: number;
	readonly size?: number;
	readonly trail?: number;
	readonly color?: string;
	readonly rotate?: number;
}> = ({x, y, size = 6, trail = 150, color = '#FF4D12', rotate = 0}) => (
	<div style={{position: 'absolute', left: x, top: y, rotate: `${rotate}deg`, pointerEvents: 'none'}}>
		<div
			style={{
				position: 'absolute',
				right: 0,
				top: size / 2,
				width: trail,
				height: 1,
				background: `linear-gradient(to left, ${color}, transparent)`,
				transformOrigin: 'right center',
			}}
		/>
		<div
			style={{
				position: 'absolute',
				width: size,
				height: size,
				borderRadius: '50%',
				backgroundColor: color,
				boxShadow: `0 0 12px ${color}, 0 0 32px ${rgba(color, 0.6)}`,
			}}
		/>
	</div>
);
