import type React from 'react';
import type {CSSProperties} from 'react';
import {AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, rgba, type SchemeName} from '../theme';
import {type Pattern} from '../core/Stage';
import {usePlate, usePlateNumber} from '../core/Plate';
import {Karaoke} from './Karaoke';
import {fitSize} from './Text';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
const roman = (index: number) => ROMAN[index - 1] ?? String(index);
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

type KeywordFont = 'serif' | 'display' | 'pixel';

export type BeatProps = {
	readonly duration?: number;
	readonly scheme: SchemeName;
	readonly pattern?: Pattern;
	readonly lines?: readonly string[];
	readonly keyword?: string;
	readonly keywordFont?: KeywordFont;
	readonly keywordColor?: string;
	readonly layout?: 'split' | 'flip' | 'center' | 'poster';
	readonly renderDiagram?: (progress: number) => React.ReactNode;
	readonly tag?: string;
	readonly keywordDelay?: number;
	readonly lineDelay?: number;
	readonly lineDelays?: readonly number[];
	readonly lineSize?: number;
	readonly style?: CSSProperties;
	readonly children?: React.ReactNode;
	readonly diagramStyle?: CSSProperties;
	readonly align?: CSSProperties['textAlign'];
	readonly decor?: 'none' | 'block' | 'circle' | 'stripes';
	readonly caption?: string;
	readonly noFooter?: boolean;
	readonly cardScheme?: SchemeName;
};

export const Beat: React.FC<BeatProps> = ({
	duration = 100000,
	lines = [],
	keyword,
	layout = 'split',
	renderDiagram,
	tag,
	keywordDelay = 7,
	lineDelay = 0,
	lineDelays,
	lineSize = 60,
	children,
	diagramStyle,
	align = 'left',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = usePlate();
	const plateNumber = usePlateNumber();
	const plateTitle = tag?.split('/')[1]?.trim() ?? 'STUDY';
	const isCenter = layout === 'center';
	const isPoster = layout === 'poster';
	const flip = layout === 'flip';
	const isLove = keyword === 'LO-O-OVE' || (keyword?.includes('LOVE') ?? false);

	const keywordStart = keywordDelay;
	const draw = Easing.out(Easing.cubic)(clamp01(frame / Math.max(14, keywordStart * 0.72)));
	const punch = 1 + Math.max(0, 1 - frame / 5) * 0.035;
	const kwSince = frame - keywordStart;
	const kwEnter = keyword ? spring({frame: kwSince, fps, config: {damping: 8, mass: 0.35, stiffness: 420}}) : 0;
	const hit = kwSince >= 0 ? Math.exp(-kwSince / (fps * 0.16)) : 0;

	const linesStart = lines.map((_, lineIndex) => lineDelay + (lineDelays?.[lineIndex] ?? lineIndex * 4));
	const keywordFrame = keyword ? keywordDelay : duration;
	const linesEnd = lines.map((_, lineIndex) =>
		lineIndex < lines.length - 1
			? Math.max(linesStart[lineIndex] + 8, linesStart[lineIndex + 1])
			: Math.max(linesStart[lineIndex] + 12, keywordFrame),
	);

	const textWidth = isCenter ? 1500 : isPoster ? 1240 : 780;
	const baseSize = Math.min(112, lineSize * 1.4);
	const keywordSize = isPoster ? 420 : isCenter ? 340 : 270;
	const keywordFactor = isLove ? 0.46 : 0.72;
	const keywordText = keyword ? (isLove ? keyword : keyword.toUpperCase()) : '';
	const fittedKeyword = keyword ? fitSize(keywordText, keywordSize, textWidth, keywordFactor) : 0;

	const diagramSide = flip ? 'left' : 'right';
	const diagramSize = isCenter ? 900 : isPoster ? 520 : 820;
	const diagramBox: CSSProperties = isCenter
		? {left: '50%', top: 110, translate: '-50% 0'}
		: isPoster
			? {right: 90, bottom: 90}
			: {[diagramSide]: 90, top: 150, ...diagramStyle};

	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					right: -34,
					bottom: -120,
					fontFamily: FONT.sans,
					fontSize: 560,
					fontWeight: 900,
					lineHeight: 0.8,
					color: 'transparent',
					WebkitTextStroke: `1.5px ${rgba(p.fg, 0.15)}`,
					pointerEvents: 'none',
				}}
			>
				{roman(plateNumber)}
			</div>
			<div style={{position: 'absolute', right: 96, bottom: 38, fontFamily: FONT.mono, fontSize: 9, letterSpacing: 3, color: p.dim}}>
				{`${roman(plateNumber)} / XIV`}
			</div>
			{frame < 2 ? (
				<AbsoluteFill style={{backgroundColor: p.accent, opacity: 0.07, pointerEvents: 'none'}} />
			) : null}
			<div
				style={{
					position: 'absolute',
					left: 96,
					top: 58,
					display: 'flex',
					alignItems: 'baseline',
					gap: 16,
				}}
			>
				<span style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: 3, color: p.dim}}>
					PLATE {roman(plateNumber)}
				</span>
				<span style={{fontFamily: FONT.sans, fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: p.fg}}>
					{plateTitle}
				</span>
				<div style={{width: 90, height: 1, backgroundColor: p.line}} />
			</div>

			<AbsoluteFill
				style={{
					scale: punch * (1 + draw * 0.004),
					transformOrigin: '50% 46%',
				}}
			>
				{renderDiagram ? (
					<div style={{position: 'absolute', ...diagramBox}}>
						<div
							style={{
								position: 'relative',
								width: diagramSize,
								height: diagramSize,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								opacity: isCenter ? 0.26 : 1,
							}}
						>
							{renderDiagram(draw)}
						</div>
						<div
							style={{
								marginTop: 12,
								display: 'flex',
								justifyContent: 'space-between',
								width: diagramSize,
								fontFamily: FONT.mono,
								fontSize: 10,
								letterSpacing: 2,
								textTransform: 'uppercase',
								color: p.dim,
							}}
						>
							<span>{`FIG. ${roman(plateNumber)} — ${plateTitle}`}</span>
							<span>129.5 BPM</span>
						</div>
					</div>
				) : null}

				<div
					style={{
						position: 'absolute',
						...(isCenter
							? {left: 170, right: 170, top: '50%', translate: '0 -50%'}
							: isPoster
								? {left: 96, right: 500, top: '50%', translate: '0 -50%'}
								: flip
									? {right: 96, top: '50%', translate: '0 -50%', width: textWidth}
									: {left: 96, top: '50%', translate: '0 -50%', width: textWidth}),
						display: 'flex',
						flexDirection: 'column',
						alignItems: align === 'center' ? 'center' : 'flex-start',
						gap: 10,
					}}
				>
					{lines.map((line, lineIndex) => {
						const start = linesStart[lineIndex];
						const end = linesEnd[lineIndex];
						const appear = clamp01((frame - (start - 6)) / 4);
						return (
							<div key={line} style={{opacity: appear, width: '100%'}}>
								<Karaoke
									text={line}
									startFrame={start}
									endFrame={end}
									size={baseSize}
									weight={700}
									width={textWidth}
									align={align}
									uppercase={false}
									dimOpacity={0.28}
								/>
							</div>
						);
					})}

					{keyword ? (
						<div
							style={{
								marginTop: 8,
								opacity: Math.min(1, kwEnter * 2),
								scale: 1.22 - kwEnter * 0.22 + hit * 0.01,
								rotate: isLove ? '-1.5deg' : `${(1 - kwEnter) * -1}deg`,
								whiteSpace: 'nowrap',
							}}
						>
							<span
								style={{
									position: 'absolute',
									left: -18,
									bottom: fittedKeyword * 0.22,
									width: 10,
									height: 10,
									backgroundColor: p.accent,
								}}
							/>
							<span
								style={{
									fontFamily: isLove ? FONT.serif : FONT.sans,
									fontWeight: isLove ? 600 : 900,
									fontStyle: isLove ? 'italic' : 'normal',
									fontSize: fittedKeyword,
									lineHeight: 0.86,
									letterSpacing: isLove ? '-0.01em' : '-0.045em',
									textTransform: isLove ? 'none' : 'uppercase',
									color: p.accent,
									paddingBottom: 10,
									borderBottom: `6px solid ${rgba(p.accent, 0.85)}`,
									textShadow: `8px 8px 0 ${rgba(p.fg, 0.13)}, 0 0 ${20 + hit * 40}px ${rgba(p.accent, 0.3 + hit * 0.25)}`,
									display: 'inline-block',
								}}
							>
								{keywordText}
							</span>
						</div>
					) : null}
				</div>
			</AbsoluteFill>

			{children}
		</AbsoluteFill>
	);
};
