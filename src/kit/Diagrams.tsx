import type React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT, type SchemeName} from '../theme';
import {usePlate} from '../core/Plate';

const useDiagramPalette = (scheme: SchemeName) => {
	void scheme;
	return usePlate();
};

type DiagramProps = {
	readonly scheme: SchemeName;
	readonly progress?: number;
	readonly size?: number;
	readonly style?: React.CSSProperties;
};

const Cap: React.FC<{
	readonly x: number;
	readonly y: number;
	readonly children: React.ReactNode;
	readonly color: string;
	readonly size?: number;
	readonly anchor?: 'start' | 'middle' | 'end';
	readonly opacity?: number;
}> = ({x, y, children, color, size = 18, anchor = 'start', opacity = 0.8}) => (
	<text
		x={x}
		y={y}
		fill={color}
		fontFamily={FONT.mono}
		fontSize={size}
		letterSpacing={2}
		textAnchor={anchor}
		opacity={opacity}
	>
		{children}
	</text>
);

const Frame: React.FC<{
	readonly children: React.ReactNode;
	readonly size: number;
	readonly style?: React.CSSProperties;
}> = ({children, size, style}) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 600 600"
		style={{overflow: 'visible', ...style}}
	>
		{children}
	</svg>
);

export const PointsDiagram: React.FC<DiagramProps> = ({
	scheme,
	progress = 1,
	size = 560,
}) => {
	const s = useDiagramPalette(scheme);
	const points: {x: number; y: number; i: number}[] = [];
	for (let row = 0; row < 6; row++) {
		for (let col = 0; col < 6; col++) {
			points.push({x: 120 + col * 72, y: 120 + row * 72, i: row * 6 + col});
		}
	}
	const px = 120 + 4 * 72;
	const py = 120 + 2 * 72;

	return (
		<Frame size={size}>
			<line x1={80} y1={560} x2={560} y2={560} stroke={s.fg} strokeWidth={2} opacity={0.6} />
			<line x1={80} y1={560} x2={80} y2={60} stroke={s.fg} strokeWidth={2} opacity={0.6} />
			{points.map((point) => (
				<circle
					key={point.i}
					cx={point.x}
					cy={point.y}
					r={4}
					fill={s.fg}
					opacity={Math.max(0, Math.min(1, progress * 9 - point.i * 0.12)) * 0.5}
				/>
			))}
			<line x1={px} y1={py} x2={px} y2={560} stroke={s.accent} strokeWidth={2} strokeDasharray="6 8" />
			<line x1={px} y1={py} x2={80} y2={py} stroke={s.accent} strokeWidth={2} strokeDasharray="6 8" />
			<circle cx={px} cy={py} r={13} fill={s.accent} />
			<Cap x={px + 24} y={py - 16} color={s.fg} size={22}>
				P (x, y)
			</Cap>
		</Frame>
	);
};

export const CircleDiagram: React.FC<DiagramProps> = ({
	scheme,
	progress = 1,
	size = 560,
}) => {
	const s = useDiagramPalette(scheme);
	const r = 190;
	const circumference = 2 * Math.PI * r;
	const drawing = Math.max(0.001, progress);

	return (
		<Frame size={size}>
			<circle cx={300} cy={300} r={r} fill={s.accent2} opacity={0.12} />
			<circle
				cx={300}
				cy={300}
				r={r}
				fill="none"
				stroke={s.fg}
				strokeWidth={3}
				strokeDasharray={`${circumference * drawing} ${circumference}`}
				transform="rotate(-90 300 300)"
			/>
			<circle
				cx={300}
				cy={300}
				r={r - 12}
				fill="none"
				stroke={s.accent}
				strokeWidth={10}
				strokeLinecap="round"
				strokeDasharray={`${(circumference - 75) * drawing} ${circumference}`}
				transform="rotate(-90 300 300)"
			/>
			<line x1={300} y1={300} x2={300 + r * Math.cos(-0.3)} y2={300 + r * Math.sin(-0.3)} stroke={s.fg} strokeWidth={2.5} />
			<circle cx={300} cy={300} r={7} fill={s.fg} />
			<Cap x={390} y={250} color={s.fg} size={24}>
				r
			</Cap>
			<Cap x={300} y={560} color={s.accent} size={22} anchor="middle">
				C = 2πr
			</Cap>
		</Frame>
	);
};

export const SineDiagram: React.FC<DiagramProps> = ({
	scheme,
	progress = 1,
	size = 560,
}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	const width = 520;
	const amp = 108;
	const points: string[] = [];
	for (let i = 0; i <= 130; i++) {
		const x = 40 + (i / 130) * width;
		const y = 300 - Math.sin((i / 130) * Math.PI * 4) * amp;
		points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
	}
	const t = 0.62 + Math.sin(frame * 0.02) * 0.05;
	const tx = 40 + t * width;
	const ty = 300 - Math.sin(t * Math.PI * 4) * amp;
	const slope = -Math.cos(t * Math.PI * 4) * amp * (Math.PI * 4 / width);
	const dx = 100;
	const dy = slope * dx;

	return (
		<Frame size={size}>
			<line x1={30} y1={300} x2={570} y2={300} stroke={s.fg} strokeWidth={1.5} opacity={0.35} />
			<polyline
				points={points.join(' ')}
				fill="none"
				stroke={s.fg}
				strokeWidth={4}
				strokeLinecap="round"
				strokeDasharray={1900}
				strokeDashoffset={1900 * (1 - Math.max(0.001, progress))}
			/>
			<line
				x1={tx - dx}
				y1={ty - dy}
				x2={tx + dx}
				y2={ty + dy}
				stroke={s.accent}
				strokeWidth={4}
			/>
			<line x1={tx} y1={ty} x2={tx} y2={300} stroke={s.accent} strokeWidth={1.5} strokeDasharray="5 6" />
			<circle cx={tx} cy={ty} r={10} fill={s.accent} />
			<Cap x={50} y={560} color={s.fg} opacity={0.55}>
				f(x) = sin x
			</Cap>
		</Frame>
	);
};

export const InfinityDiagram: React.FC<DiagramProps> = ({
	scheme,
	progress = 1,
	size = 560,
}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	const points: string[] = [];
	for (let i = 0; i <= 160; i++) {
		const t = (i / 160) * Math.PI * 2;
		const x = 300 + 190 * Math.cos(t);
		const y = 300 + 105 * Math.sin(2 * t);
		points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
	}
	const t = frame * 0.035;
	const dotX = 300 + 190 * Math.cos(t);
	const dotY = 300 + 105 * Math.sin(2 * t);

	return (
		<Frame size={size}>
			<polyline
				points={points.join(' ')}
				fill="none"
				stroke={s.fg}
				strokeWidth={5}
				strokeLinecap="round"
				strokeDasharray={1300}
				strokeDashoffset={1300 * (1 - Math.max(0.001, progress))}
			/>
			<line x1={20} y1={300} x2={120} y2={300} stroke={s.accent} strokeWidth={3} />
			<path d="M120 300 L96 286 L96 314 Z" fill={s.accent} />
			<line x1={580} y1={300} x2={480} y2={300} stroke={s.accent} strokeWidth={3} />
			<path d="M480 300 L504 286 L504 314 Z" fill={s.accent} />
			<circle cx={dotX} cy={dotY} r={9} fill={s.accent} />
			<Cap x={300} y={540} anchor="middle" color={s.fg} size={22}>
				x → ∞
			</Cap>
		</Frame>
	);
};

export const ToggleDiagram: React.FC<
	DiagramProps & {
		readonly left: string;
		readonly right: string;
		readonly value?: number;
	}
> = ({scheme, progress = 1, size = 560, left, right, value = 1}) => {
	const s = useDiagramPalette(scheme);
	const on = Math.max(0, Math.min(1, progress * value));
	const knobX = 190 + on * 220;

	return (
		<Frame size={size}>
			<rect x={120} y={250} width={360} height={110} rx={55} fill={s.fg} opacity={0.1} stroke={s.fg} strokeWidth={4} />
			<rect x={120} y={250} width={360 * on + 20} height={110} rx={55} fill={s.accent} opacity={0.9} />
			<circle cx={knobX} cy={305} r={42} fill={s.card} stroke={s.fg} strokeWidth={4} />
			<Cap x={145} y={440} color={s.fg} size={34} anchor="start">
				{left}
			</Cap>
			<Cap x={455} y={440} color={s.accent} size={34} anchor="end">
				{right}
			</Cap>
		</Frame>
	);
};

export const ClockDiagram: React.FC<DiagramProps & {readonly mode?: 'bc' | 'ampm'}> = ({
	scheme,
	size = 560,
	mode = 'bc',
}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	const direction = mode === 'bc' ? -1 : 1;
	const minute = (frame * 1.2 * direction) % 360;
	const hour = (frame * 0.12 * direction) % 360;
	const ticks = Array.from({length: 12}, (_, index) => index * 30);

	return (
		<Frame size={size}>
			<circle cx={300} cy={300} r={210} fill={s.card} stroke={s.fg} strokeWidth={4} />
			<circle cx={300} cy={300} r={226} fill="none" stroke={s.accent} strokeWidth={2} strokeDasharray="3 9" />
			{ticks.map((angle) => (
				<line
					key={angle}
					x1={300 + 184 * Math.sin((angle * Math.PI) / 180)}
					y1={300 - 184 * Math.cos((angle * Math.PI) / 180)}
					x2={300 + 202 * Math.sin((angle * Math.PI) / 180)}
					y2={300 - 202 * Math.cos((angle * Math.PI) / 180)}
					stroke={s.fg}
					strokeWidth={angle % 90 === 0 ? 4 : 2}
				/>
			))}
			<line
				x1={300}
				y1={300}
				x2={300 + 100 * Math.sin((hour * Math.PI) / 180)}
				y2={300 - 100 * Math.cos((hour * Math.PI) / 180)}
				stroke={s.fg}
				strokeWidth={9}
				strokeLinecap="round"
			/>
			<line
				x1={300}
				y1={300}
				x2={300 + 150 * Math.sin((minute * Math.PI) / 180)}
				y2={300 - 150 * Math.cos((minute * Math.PI) / 180)}
				stroke={s.accent}
				strokeWidth={6}
				strokeLinecap="round"
			/>
			<circle cx={300} cy={300} r={9} fill={s.fg} />
		</Frame>
	);
};

export const MergeDiagram: React.FC<DiagramProps & {readonly kind?: 'orb' | 'wave'}> = ({
	scheme,
	progress = 1,
	size = 560,
	kind = 'orb',
}) => {
	const s = useDiagramPalette(scheme);
	const loose = Math.max(0, Math.min(1, progress));
	const gap = 62 + (1 - loose) * 120;
	const frame = useCurrentFrame();

	return (
		<Frame size={size}>
			<circle cx={300 - gap} cy={300} r={125} fill={s.accent} opacity={0.5} />
			<circle cx={300 + gap} cy={300} r={125} fill={s.accent2} opacity={0.5} />
			{loose > 0.72 ? (
				<g transform="translate(300 300)">
					<path
						d="M0 62 C -66 18 -94 -18 -80 -48 C -68 -74 -34 -76 -18 -54 L0 -30 L18 -54 C 34 -76 68 -74 80 -48 C 94 -18 66 18 0 62 Z"
						fill={s.card}
						stroke={s.fg}
						strokeWidth={4}
					/>
				</g>
			) : null}
			<circle cx={300 - gap} cy={300} r={125} fill="none" stroke={s.fg} strokeWidth={3} />
			<circle cx={300 + gap} cy={300} r={125} fill="none" stroke={s.fg} strokeWidth={3} />
			{kind === 'wave' ? (
				<>
					<path d={`M 60 470 Q 180 ${430 + Math.sin(frame * 0.1) * 25} 300 470 T 540 470`} fill="none" stroke={s.fg} strokeWidth={3} />
					<path d={`M 60 510 Q 180 ${500 - Math.sin(frame * 0.1) * 25} 300 510 T 540 510`} fill="none" stroke={s.accent} strokeWidth={3} />
				</>
			) : null}
		</Frame>
	);
};

export const SlidersDiagram: React.FC<DiagramProps> = ({scheme, progress = 1, size = 620}) => {
	const s = useDiagramPalette(scheme);
	const rows = ['STIMULATION', 'SATISFACTION', 'AFFECTION'];

	return (
		<Frame size={size}>
			{rows.map((row, index) => {
				const value = Math.min(1, 0.24 + progress * 0.76);
				const y = 170 + index * 120;
				return (
					<g key={row}>
						<Cap x={40} y={y - 26} color={s.fg} size={17} opacity={0.7}>
							{row}
						</Cap>
						<rect x={40} y={y} width={420} height={16} fill={s.fg} opacity={0.15} stroke={s.fg} strokeWidth={2} />
						<rect x={40} y={y} width={420 * value} height={16} fill={index === 1 ? s.accent : s.accent2} />
						<circle cx={40 + 420 * value} cy={y + 8} r={16} fill={s.card} stroke={s.fg} strokeWidth={3} />
						<Cap x={500} y={y + 14} color={s.fg} size={20}>
							{Math.round(value * 100)}%
						</Cap>
					</g>
				);
			})}
		</Frame>
	);
};

export const SmileyDiagram: React.FC<DiagramProps> = ({progress = 1, size = 560}) => {
	const s = usePlate();
	const frame = useCurrentFrame();
	const value = Math.round(Math.min(1, 0.24 + progress * 0.76) * 100);
	return (
		<Frame size={size}>
			<circle cx={300} cy={300} r={210} fill="none" stroke={s.fg} strokeWidth={1.5} />
			<circle cx={300} cy={300} r={180} fill="none" stroke={s.line} strokeWidth={1} />
			{Array.from({length: 40}, (_, index) => {
				const angle = (index / 40) * Math.PI * 2;
				const inner = index % 5 === 0 ? 166 : 172;
				return (
					<line
						key={index}
						x1={300 + inner * Math.cos(angle)}
						y1={300 + inner * Math.sin(angle)}
						x2={300 + 180 * Math.cos(angle)}
						y2={300 + 180 * Math.sin(angle)}
						stroke={s.fg}
						strokeWidth={index % 5 === 0 ? 1.6 : 0.8}
						opacity={0.6}
					/>
				);
			})}
			<path
				d="M 128 370 A 190 190 0 1 1 472 370"
				fill="none"
				stroke={s.accent}
				strokeWidth={7}
				strokeLinecap="round"
				opacity={0.9}
			/>
			<line x1={300} y1={300} x2={300 + 130 * Math.cos(-0.5 + frame * 0.01)} y2={300 + 130 * Math.sin(-0.5 + frame * 0.01)} stroke={s.fg} strokeWidth={2} />
			<circle cx={300} cy={300} r={7} fill={s.fg} />
			<Cap x={300} y={300} anchor="middle" color={s.fg} size={18}>
				SATISFACTION
			</Cap>
			<Cap x={300} y={330} anchor="middle" color={s.accent} size={26}>
				{value}%
			</Cap>
			<Cap x={300} y={540} anchor="middle" color={s.dim} size={11}>
				FORM 7-L / FIELD 03
			</Cap>
		</Frame>
	);
};

export const ExecuteButtonDiagram: React.FC<DiagramProps & {readonly pressed?: number}> = ({
	scheme,
	progress = 1,
	size = 560,
	pressed = 0,
}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	const scale = 1 - Math.min(0.12, pressed * 0.12);

	return (
		<Frame size={size}>
			{Array.from({length: 20}, (_, index) => {
				const angle = (index / 20) * Math.PI * 2 + frame * 0.004;
				const inner = 235;
				const outer = 265 + (index % 2 === 0 ? 22 : 0);
				return (
					<line
						key={index}
						x1={300 + inner * Math.cos(angle)}
						y1={300 + inner * Math.sin(angle)}
						x2={300 + outer * Math.cos(angle)}
						y2={300 + outer * Math.sin(angle)}
						stroke={s.accent}
						strokeWidth={4}
						opacity={0.55}
					/>
				);
			})}
			<g style={{transformOrigin: '300px 300px', scale}}>
				<circle cx={300} cy={300} r={205} fill={s.accent} stroke={s.fg} strokeWidth={5} />
				<circle cx={300} cy={300} r={170} fill="none" stroke={s.fg} strokeWidth={2} strokeDasharray="2 8" />
				<text
					x={300}
					y={318}
					textAnchor="middle"
					fill={s.card}
					fontFamily={FONT.pixel}
					fontSize={44}
					letterSpacing={1}
				>
					EXECUTE
				</text>
			</g>
			{progress < 0.55 ? (
				<g transform="translate(390 380)">
					<path d="M0 0 L0 34 L8 26 L14 40 L20 37 L14 24 L24 24 Z" fill={s.fg} stroke={s.card} strokeWidth={2} />
				</g>
			) : null}
		</Frame>
	);
};

export const TrapBoxDiagram: React.FC<DiagramProps> = ({scheme, progress = 1, size = 560}) => {
	const s = useDiagramPalette(scheme);
	const close = Math.max(0, Math.min(1, progress));
	const depth = 90 - close * 50;

	return (
		<Frame size={size}>
			<polygon
				points={`120,180 300,90 480,180 300,270`}
				fill={s.fg}
				opacity={0.08}
				stroke={s.fg}
				strokeWidth={3}
			/>
			<polygon
				points={`120,180 300,270 300,470 120,380`}
				fill={s.accent}
				opacity={0.16}
				stroke={s.fg}
				strokeWidth={3}
			/>
			<polygon
				points={`480,180 300,270 300,470 480,380`}
				fill={s.accent2}
				opacity={0.16}
				stroke={s.fg}
				strokeWidth={3}
			/>
			{[0, 1, 2, 3].map((index) => (
				<line
					key={index}
					x1={120 + index * 45}
					y1={180 + index * 22.5}
					x2={120 + index * 45}
					y2={380 + index * 22.5}
					stroke={s.fg}
					strokeWidth={2}
					opacity={0.35}
				/>
			))}
			<g transform={`translate(300 ${330 + depth * 0.2})`}>
				<rect x={-34} y={-30} width={68} height={60} fill={s.card} stroke={s.fg} strokeWidth={3} />
				<g transform="translate(-22 4) scale(4)">
					<PixelHeartInline color={s.accent} />
				</g>
			</g>
		</Frame>
	);
};

const PixelHeartInline: React.FC<{readonly color: string}> = ({color}) => {
	const rows = [
		'01100110',
		'11111111',
		'11111111',
		'01111110',
		'00111100',
		'00011000',
		'00000000',
	];
	return (
		<g>
			{rows.flatMap((row, y) =>
				row.split('').map((cell, x) =>
					cell === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null,
				),
			)}
		</g>
	);
};

export const EggplantDiagram: React.FC<DiagramProps> = ({scheme, size = 520}) => {
	const s = useDiagramPalette(scheme);
	return (
		<Frame size={size}>
			<path
				d="M340 120 C 430 160 470 260 450 350 C 430 450 330 520 250 500 C 170 480 120 390 150 300 C 180 210 260 100 340 120 Z"
				fill={`url(#${s.hatchId})`}
				stroke={s.fg}
				strokeWidth={2}
			/>
			<path d="M330 130 C 320 90 300 70 270 60 C 300 40 360 50 390 90 Z" fill={s.accent} stroke={s.fg} strokeWidth={2} />
			<path d="M365 120 C 385 85 400 75 430 70" fill="none" stroke={s.accent} strokeWidth={4} strokeLinecap="round" />
			<ellipse cx={260} cy={250} rx={34} ry={62} fill="none" stroke={s.fg} strokeWidth={1} opacity={0.5} transform="rotate(25 260 250)" />
			<Cap x={300} y={560} anchor="middle" color={s.dim} size={12}>
				SOLANUM MELONGENA
			</Cap>
			<Cap x={300} y={590} anchor="middle" color={s.accent} size={10}>
				NUTRIENTS +100%
			</Cap>
		</Frame>
	);
};

export const TomatoDiagram: React.FC<DiagramProps> = ({scheme, size = 520}) => {
	const s = useDiagramPalette(scheme);
	return (
		<Frame size={size}>
			<circle cx={300} cy={330} r={190} fill={`url(#${s.hatchId})`} stroke={s.fg} strokeWidth={2} />
			<path d="M180 270 A 150 150 0 0 1 360 200" fill="none" stroke={s.fg} strokeWidth={1} opacity={0.5} />
			{Array.from({length: 6}, (_, index) => {
				const angle = (index / 6) * Math.PI * 2 - Math.PI / 2;
				return (
					<path
						key={index}
						d={`M300 190 L ${300 + Math.cos(angle) * 90} ${190 + Math.sin(angle) * 56} L ${300 + Math.cos(angle + 0.5) * 55} ${190 + Math.sin(angle + 0.5) * 36} Z`}
						fill={index === 0 ? s.accent : 'none'}
						stroke={s.fg}
						strokeWidth={1.5}
					/>
				);
			})}
			<circle cx={300} cy={180} r={8} fill={s.accent} stroke={s.fg} strokeWidth={1.5} />
			<Cap x={300} y={560} anchor="middle" color={s.dim} size={12}>
				SOLANUM LYCOPERSICUM
			</Cap>
			<Cap x={300} y={590} anchor="middle" color={s.accent} size={10}>
				ANTIOXIDANTS +100%
			</Cap>
		</Frame>
	);
};

export const CatDiagram: React.FC<DiagramProps> = ({scheme, size = 540}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	return (
		<Frame size={size}>
			<polygon points="140,220 190,70 280,150" fill={`url(#${s.hatchId})`} stroke={s.fg} strokeWidth={2} />
			<polygon points="460,220 410,70 320,150" fill={`url(#${s.hatchId})`} stroke={s.fg} strokeWidth={2} />
			<circle cx={300} cy={320} r={185} fill={`url(#${s.hatchId})`} stroke={s.fg} strokeWidth={2} />
			{[0, 1, 2].map((index) => (
				<path
					key={index}
					d={`M ${250 + index * 50} 160 L ${255 + index * 50} ${205 + index * 10}`}
					stroke={s.fg}
					strokeWidth={2}
					strokeLinecap="round"
				/>
			))}
			<path d="M215 300 Q 240 280 265 300 Q 240 320 215 300 Z" fill={s.accent} />
			<path d="M335 300 Q 360 280 385 300 Q 360 320 335 300 Z" fill={s.accent} />
			<path d="M292 360 L308 360 L300 372 Z" fill={s.fg} />
			<path d="M300 372 Q 300 395 275 395 M300 372 Q 300 395 325 395" fill="none" stroke={s.fg} strokeWidth={1.5} strokeLinecap="round" />
			{[-1, 1].map((side) => (
				<g key={side}>
					<line x1={300 + side * 150} y1={360} x2={300 + side * 245} y2={345} stroke={s.fg} strokeWidth={1} />
					<line x1={300 + side * 150} y1={375} x2={300 + side * 250} y2={380} stroke={s.fg} strokeWidth={1} />
					<line x1={300 + side * 150} y1={388} x2={300 + side * 240} y2={415} stroke={s.fg} strokeWidth={1} />
				</g>
			))}
			{[0, 1, 2].map((index) => (
				<path
					key={index}
					d={`M ${470 + index * 18} ${300 - index * 40} Q ${530 + index * 18} ${300} ${470 + index * 18} ${300 + index * 40}`}
					fill="none"
					stroke={s.accent}
					strokeWidth={1}
					opacity={0.35 + Math.sin(frame * 0.15 + index) * 0.15}
				/>
			))}
			<Cap x={300} y={560} anchor="middle" color={s.dim} size={12}>
				FELIS CATUS
			</Cap>
			<Cap x={300} y={590} anchor="middle" color={s.accent} size={10}>
				PURR / 24 HZ
			</Cap>
		</Frame>
	);
};

export const EyeGodDiagram: React.FC<DiagramProps> = ({scheme, size = 560}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	return (
		<Frame size={size}>
			{Array.from({length: 24}, (_, index) => {
				const angle = (index / 24) * Math.PI * 2 + frame * 0.005;
				return (
					<line
						key={index}
						x1={300 + 210 * Math.cos(angle)}
						y1={300 + 210 * Math.sin(angle)}
						x2={300 + 270 * Math.cos(angle)}
						y2={300 + 270 * Math.sin(angle)}
						stroke={s.accent}
						strokeWidth={3}
						opacity={0.45}
					/>
				);
			})}
			<path d="M80 300 Q 300 110 520 300 Q 300 490 80 300 Z" fill={s.card} stroke={s.fg} strokeWidth={5} />
			<circle cx={300} cy={300} r={92} fill={s.accent} stroke={s.fg} strokeWidth={4} />
			<circle cx={300} cy={300} r={45} fill={s.fg} />
			<circle cx={322} cy={278} r={16} fill={s.card} />
		</Frame>
	);
};

export const SpiralDiagram: React.FC<DiagramProps> = ({scheme, size = 540}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	const points: string[] = [];
	for (let i = 0; i <= 240; i++) {
		const t = (i / 240) * Math.PI * 8;
		const r = 8 + t * 10;
		points.push(`${(300 + r * Math.cos(t)).toFixed(1)},${(300 + r * Math.sin(t)).toFixed(1)}`);
	}
	return (
		<Frame size={size}>
			<g transform={`rotate(${frame * 0.6} 300 300)`}>
				<polyline points={points.join(' ')} fill="none" stroke={s.fg} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
			</g>
			<circle cx={300} cy={300} r={6} fill={s.accent} />
		</Frame>
	);
};

export const WaveRingsDiagram: React.FC<DiagramProps> = ({scheme, size = 560}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();

	const ring = (radius: number, phase: number) => {
		const pts: string[] = [];
		for (let i = 0; i <= 120; i++) {
			const angle = (i / 120) * Math.PI * 2;
			const wobble = Math.sin(angle * 8 + frame * 0.08 + phase) * 12;
			pts.push(`${(300 + (radius + wobble) * Math.cos(angle)).toFixed(1)},${(300 + (radius + wobble) * Math.sin(angle)).toFixed(1)}`);
		}
		return pts.join(' ');
	};

	return (
		<Frame size={size}>
			{[0, 1, 2, 3].map((index) => (
				<polyline
					key={index}
					points={ring(60 + index * 55, index * 0.8)}
					fill="none"
					stroke={index % 2 === 0 ? s.accent : s.fg}
					strokeWidth={index === 0 ? 4 : 2.5}
					opacity={0.9 - index * 0.12}
				/>
			))}
			<circle cx={300} cy={300} r={16} fill={s.accent} />
		</Frame>
	);
};

export const ShardsDiagram: React.FC<DiagramProps> = ({scheme, size = 560}) => {
	const s = useDiagramPalette(scheme);
	const shards = [
		['150,170', '250,130', '270,230'],
		['280,120', '380,160', '330,250'],
		['390,210', '470,290', '380,320'],
		['410,350', '480,440', '370,430'],
		['300,400', '370,480', '280,500'],
		['190,380', '270,420', '200,490'],
		['110,280', '200,260', '190,350'],
		['90,180', '170,250', '90,280'],
	];
	return (
		<Frame size={size}>
			{shards.map((points, index) => (
				<polygon
					key={index}
					points={points.join(' ')}
					fill={index % 3 === 0 ? s.accent : index % 3 === 1 ? s.fg : s.accent2}
					opacity={0.8}
					stroke={s.fg}
					strokeWidth={2}
					transform={`rotate(${index * 4} 300 300)`}
				/>
			))}
			<path
				d="M300 400 C 210 330 170 280 190 230 C 205 195 250 190 270 220 L300 260 L330 220 C 350 190 395 195 410 230 C 430 280 390 330 300 400 Z"
				fill="none"
				stroke={s.card}
				strokeWidth={3}
				strokeDasharray="8 8"
			/>
		</Frame>
	);
};

export const IsolationDiagram: React.FC<DiagramProps> = ({scheme, size = 620}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	return (
		<Frame size={size}>
			<rect x={40} y={40} width={520} height={520} fill="none" stroke={s.fg} strokeWidth={2} opacity={0.35} />
			<line x1={40} y1={300} x2={560} y2={300} stroke={s.fg} strokeWidth={1} opacity={0.15} />
			<line x1={300} y1={40} x2={300} y2={560} stroke={s.fg} strokeWidth={1} opacity={0.15} />
			<circle cx={300} cy={300} r={8} fill={s.accent} />
			<circle cx={300} cy={300} r={20 + Math.sin(frame * 0.06) * 4} fill="none" stroke={s.accent} strokeWidth={2} opacity={0.4} />
			<Cap x={300} y={350} anchor="middle" color={s.fg} size={16} opacity={0.5}>
				0 CONNECTIONS
			</Cap>
		</Frame>
	);
};

export const HeartCurveDiagram: React.FC<DiagramProps> = ({scheme, size = 540}) => {
	const s = useDiagramPalette(scheme);
	const points: string[] = [];
	for (let i = 0; i <= 200; i++) {
		const t = (i / 200) * Math.PI * 2;
		const x = 16 * Math.sin(t) ** 3;
		const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
		points.push(`${(300 + x * 10).toFixed(1)},${(300 - y * 10).toFixed(1)}`);
	}
	return (
		<Frame size={size}>
			<polyline
				points={points.join(' ')}
				fill={s.accent}
				fillOpacity={0.18}
				stroke={s.accent}
				strokeWidth={7}
				strokeDasharray={1200}
			/>
			<Cap x={300} y={550} anchor="middle" color={s.fg} size={19} opacity={0.7}>
				(x² + y² − 1)³ = x²y³
			</Cap>
		</Frame>
	);
};

export const CountdownDiagram: React.FC<DiagramProps & {readonly value: number}> = ({
	scheme,
	size = 600,
	value,
}) => {
	const s = useDiagramPalette(scheme);
	return (
		<Frame size={size}>
			<circle cx={300} cy={300} r={210} fill="none" stroke={s.fg} strokeWidth={3} opacity={0.3} />
			<circle
				cx={300}
				cy={300}
				r={210}
				fill="none"
				stroke={s.accent}
				strokeWidth={12}
				strokeDasharray={`${(value / 10) * 1319} 1319`}
				transform="rotate(-90 300 300)"
			/>
			<text
				x={300}
				y={350}
				textAnchor="middle"
				fill={s.fg}
				fontFamily={FONT.display}
				fontSize={190}
			>
				{value}
			</text>
		</Frame>
	);
};

export const CageDiagram: React.FC<DiagramProps> = ({scheme, size = 600}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	return (
		<Frame size={size}>
			{[0, 1, 2, 3, 4, 5].map((index) => (
				<line
					key={index}
					x1={110 + index * 76}
					y1={110}
					x2={110 + index * 76}
					y2={490}
					stroke={s.fg}
					strokeWidth={7}
					opacity={0.85}
				/>
			))}
			{[0, 1, 2, 3, 4, 5].map((index) => (
				<line
					key={index}
					x1={110}
					y1={110 + index * 76}
					x2={490}
					y2={110 + index * 76}
					stroke={s.fg}
					strokeWidth={3}
					opacity={0.3}
				/>
			))}
			<rect x={110} y={110} width={380} height={380} fill="none" stroke={s.fg} strokeWidth={8} />
			<g transform={`translate(300 ${300 + Math.sin(frame * 0.04) * 6})`}>
				<path
					d="M0 56 C -60 16 -84 -16 -72 -42 C -61 -66 -31 -68 -16 -48 L0 -27 L16 -48 C 31 -68 61 -66 72 -42 C 84 -16 60 16 0 56 Z"
					fill={s.accent}
					stroke={s.fg}
					strokeWidth={1.5}
				/>
			</g>
		</Frame>
	);
};

export const HeartbeatDiagram: React.FC<DiagramProps> = ({scheme, size = 620}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	const points: string[] = [];
	for (let i = 0; i <= 160; i++) {
		const x = 40 + (i / 160) * 520;
		const phase = (i / 160) * 4;
		const spike =
			phase % 1 < 0.08 ? -90 * Math.sin((phase % 1) * Math.PI * 12.5) : 0;
		const y = 300 + Math.sin(phase * Math.PI * 2) * 10 + spike;
		points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
	}
	return (
		<Frame size={size}>
			<polyline points={points.join(' ')} fill="none" stroke={s.accent} strokeWidth={4} />
			<circle cx={40 + ((frame * 3) % 520)} cy={300} r={7} fill={s.fg} />
			<Cap x={40} y={520} color={s.fg} size={18} opacity={0.55}>
				HEARTBEAT
			</Cap>
		</Frame>
	);
};

export const ShieldDiagram: React.FC<DiagramProps> = ({scheme, progress = 1, size = 520}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	return (
		<Frame size={size}>
			{Array.from({length: 16}, (_, index) => {
				const angle = (index / 16) * Math.PI * 2;
				return (
					<line
						key={index}
						x1={300 + 230 * Math.cos(angle)}
						y1={300 + 230 * Math.sin(angle)}
						x2={300 + 270 * Math.cos(angle)}
						y2={300 + 270 * Math.sin(angle)}
						stroke={s.accent}
						strokeWidth={3}
						opacity={0.35}
					/>
				);
			})}
			<path
				d="M300 90 L470 150 L470 310 C470 420 390 500 300 530 C210 500 130 420 130 310 L130 150 Z"
				fill={s.accent}
				opacity={0.2}
				stroke={s.fg}
				strokeWidth={5}
			/>
			<path
				d="M300 90 L470 150 L470 310 C470 420 390 500 300 530 C210 500 130 420 130 310 L130 150 Z"
				fill="none"
				stroke={s.fg}
				strokeWidth={5}
				strokeDasharray={1300}
				strokeDashoffset={1300 * (1 - Math.max(0.001, progress))}
			/>
			<path
				d="M220 300 L275 355 L390 235"
				fill="none"
				stroke={s.accent}
				strokeWidth={14}
				strokeLinecap="round"
				strokeLinejoin="round"
				opacity={Math.max(0, Math.min(1, progress * 2 - 0.6))}
			/>
			<circle cx={300} cy={300} r={frame % 60 * 4} fill="none" stroke={s.accent2} strokeWidth={1.5} opacity={0.2} />
		</Frame>
	);
};

export const GlobeDiagram: React.FC<DiagramProps> = ({scheme, size = 560}) => {
	const s = useDiagramPalette(scheme);
	const frame = useCurrentFrame();
	const r = 195;
	const radiuses = [0.28, 0.58, 0.86];
	return (
		<Frame size={size}>
			<circle cx={300} cy={300} r={r} fill={s.accent2} opacity={0.12} stroke={s.fg} strokeWidth={4} />
			{[1, 2, 3].map((count) => (
				<line
					key={count}
					x1={300 - r}
					y1={300 - r + count * (2 * r) / 4}
					x2={300 + r}
					y2={300 - r + count * (2 * r) / 4}
					stroke={s.fg}
					strokeWidth={2}
					opacity={0.4}
				/>
			))}
			<g transform={`rotate(${frame * 0.7} 300 300)`}>
				{radiuses.map((ratio) => (
					<ellipse
						key={ratio}
						cx={300}
						cy={300}
						rx={r * ratio}
						ry={r}
						fill="none"
						stroke={s.fg}
						strokeWidth={2}
						opacity={0.45}
					/>
				))}
			</g>
			{[
				[260, 220],
				[350, 280],
				[300, 380],
				[230, 330],
				[380, 190],
			].map(([x, y], index) => (
				<circle key={index} cx={x} cy={y} r={8} fill={s.accent} opacity={0.85} />
			))}
			<Cap x={300} y={570} anchor="middle" color={s.fg} size={18} opacity={0.6}>
				NEW WORLD v1.0
			</Cap>
		</Frame>
	);
};

export const BlocksDiagram: React.FC<DiagramProps> = ({scheme, progress = 1, size = 540}) => {
	const s = useDiagramPalette(scheme);
	const blocks = Array.from({length: 36}, (_, index) => index);
	return (
		<Frame size={size}>
			{blocks.map((index) => {
				const col = index % 6;
				const row = Math.floor(index / 6);
				const x = 105 + col * 66;
				const y = 105 + row * 66;
				const filled = [7, 9, 14, 16, 21].includes(index);
				return (
					<rect
						key={index}
						x={x}
						y={y}
						width={52}
						height={52}
						fill={filled ? s.accent : 'none'}
						stroke={s.fg}
						strokeWidth={2}
						opacity={filled ? Math.min(1, progress * 3) : 0.3}
					/>
				);
			})}
		</Frame>
	);
};
