import {AbsoluteFill, Interactive, Sequence, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, INK, rgba} from '../theme';
import {SceneAudio} from '../core/SceneAudio';
import {Beat} from '../kit/Beat';
import {CageDiagram, ExecuteButtonDiagram, HeartCurveDiagram} from '../kit/Diagrams';
import {Spark, usePlate} from '../core/Plate';

const FloatingHearts: React.FC<{readonly count?: number; readonly color?: string}> = ({
	count = 10,
	color = '#FF4D12',
}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{Array.from({length: count}, (_, index) => {
				const baseX = random(`hx-${index}`) * 1700 + 110;
				const offset = random(`hy-${index}`) * 1200;
				const speed = 0.5 + random(`hs-${index}`) * 1.2;
				const size = 2 + random(`hz-${index}`) * 3;
				const y = 1100 - ((frame * speed + offset) % 1200);
				const sway = Math.sin(frame * 0.03 + index) * 30;
				return (
					<div
						key={index}
						style={{
							position: 'absolute',
							left: baseX + sway,
							top: y,
							width: size,
							height: size,
							borderRadius: '50%',
							backgroundColor: color,
							opacity: 0.15 + random(`ho-${index}`) * 0.3,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

const TrappedInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={4879} withAudio={withAudio} plate={12} tone="ink">
		<Sequence  durationInFrames={102}>
			<Beat
				duration={102}
				scheme="red"
				pattern="rays"
				tag="01 / EXECUTE"
				lines={['If I can', 'If I can give them all the']}
				lineDelays={[0, 20]}
				lineSize={70}
				keyword="EXECUTION"
				keywordFont="pixel"
				keywordColor="#F4C24E"
				keywordDelay={66}
				renderDiagram={(progress) => (
					<ExecuteButtonDiagram scheme="red" progress={progress} size={700} pressed={0.8} />
				)}
			/>
		</Sequence>
		<Sequence from={102} durationInFrames={114}>
			<Beat
				duration={114}
				scheme="yellow"
				pattern="dots"
				layout="flip"
				tag="02 / EXECUTE"
				lines={['Then I can', 'Then I can be your only']}
				lineDelays={[0, 30]}
				lineSize={70}
				keyword="EXECUTION"
				keywordFont="pixel"
				keywordColor="#DE3B2F"
				keywordDelay={77}
				renderDiagram={(progress) => (
					<ExecuteButtonDiagram scheme="yellow" progress={progress} size={700} pressed={0.8} />
				)}
			/>
		</Sequence>
		<Sequence from={216} durationInFrames={115}>
			<Beat
				duration={115}
				scheme="cream"
				pattern="grid"
				tag="03 / EXECUTE"
				lines={['If I can have you back', 'I will run the']}
				lineDelays={[0, 62]}
				lineSize={70}
				keyword="EXECUTION"
				keywordFont="pixel"
				keywordDelay={77}
				renderDiagram={(progress) => (
					<ExecuteButtonDiagram scheme="cream" progress={progress} size={700} pressed={0.9} />
				)}
			/>
		</Sequence>
		<Sequence from={331} durationInFrames={108}>
			<Beat
				duration={108}
				scheme="ink"
				pattern="scan"
				layout="center"
				tag="04 / EXECUTE"
				lines={['Though we are trapped', 'We are trapped ah']}
				lineDelays={[0, 40]}
				lineSize={70}
				keyword="TRAPPED"
				keywordFont="serif"
				keywordDelay={30}
				renderDiagram={(progress) => <CageDiagram scheme="ink" progress={progress} size={620} />}
			/>
		</Sequence>
	</SceneAudio>
);

export const TrappedScene = Interactive.create({
	Component: TrappedInner,
	layout: 'absolute-fill',
});

const LOVE = 'LO-O-OVE';

const LoveInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={5318} withAudio={withAudio} plate={13} tone="ink">
		<Sequence  durationInFrames={108}>
			<Beat
				duration={108}
				scheme="cream"
				pattern="grid"
				tag="01 / STUDY"
				lines={["I've studied", "I've studied how to properly"]}
				lineDelays={[0, 28]}
				lineSize={46}
				keyword={LOVE}
				keywordFont="serif"
				keywordDelay={70}
				renderDiagram={(progress) => <HeartCurveDiagram scheme="cream" progress={progress} size={640} />}
			/>
		</Sequence>
		<Sequence from={108} durationInFrames={110}>
			<Beat
				duration={110}
				scheme="pink"
				pattern="dots"
				layout="flip"
				tag="02 / STUDY"
				lines={['Question me', 'Question me I can answer all']}
				lineDelays={[0, 31]}
				lineSize={46}
				keyword={LOVE}
				keywordFont="serif"
				keywordDelay={74}
				renderDiagram={(progress) => <HeartCurveDiagram scheme="pink" progress={progress} size={640} />}
			/>
		</Sequence>
		<Sequence from={218} durationInFrames={118}>
			<Beat
				duration={118}
				scheme="blue"
				pattern="grid"
				layout="center"
				tag="03 / STUDY"
				lines={['I know the algebraic expression of']}
				lineSize={72}
				keyword={LOVE}
				keywordFont="serif"
				keywordColor="#F4C24E"
				keywordDelay={84}
				renderDiagram={(progress) => <HeartCurveDiagram scheme="blue" progress={progress} size={640} />}
			/>
		</Sequence>
		<Sequence from={336} durationInFrames={242}>
			<Beat
				duration={242}
				scheme="pink"
				pattern="dots"
				layout="flip"
				tag="04 / TRAPPED"
				lines={['Though you are free', 'I am trapped', 'Trapped in']}
				lineDelays={[0, 38, 70]}
				lineSize={46}
				keyword={LOVE}
				keywordFont="serif"
				keywordDelay={76}
				renderDiagram={(progress) => <CageDiagram scheme="ink" progress={progress} size={620} />}
			>
				<FloatingHearts count={12} color="#DE3B2F" />
			</Beat>
		</Sequence>
		<Sequence from={578} durationInFrames={278}>
			<LoveOutro />
		</Sequence>
	</SceneAudio>
);

const LoveOutro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = usePlate();
	const enter = spring({frame, fps, config: {damping: 20, mass: 0.9}});
	const fade = interpolate(frame, [238, 278], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{opacity: fade}}>
			<div style={{position: 'absolute', left: 96, top: 58, fontFamily: FONT.mono, fontSize: 11, letterSpacing: 3, color: p.dim}}>
				PLATE XIII — LO-O-OVE / FINAL
			</div>
			<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.18}}>
				<HeartCurveDiagram scheme="cream" progress={1} size={640} />
			</div>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 26}}>
				<div
					style={{
						fontFamily: FONT.serif,
						fontStyle: 'italic',
						fontWeight: 600,
						fontSize: 300,
						lineHeight: 0.9,
						color: p.fg,
						scale: enter,
					}}
				>
					LO-O-OVE
				</div>
				<div style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: 6, color: p.dim}}>
					P(LOVE) = 1.000 / NO LIMIT
				</div>
			</AbsoluteFill>
			<Spark x={1460} y={420} size={7} trail={180} />
			<div style={{position: 'absolute', left: 96, bottom: 58, fontFamily: FONT.mono, fontSize: 10, letterSpacing: 3, color: p.dim}}>
				STILL RUNNING / 03:20
			</div>
			<div style={{position: 'absolute', right: 96, bottom: 58, fontFamily: FONT.mono, fontSize: 10, letterSpacing: 3, color: p.dim}}>
				FIG. XIII — HEART CURVE
			</div>
		</AbsoluteFill>
	);
};

export const LoveScene = Interactive.create({
	Component: LoveInner,
	layout: 'absolute-fill',
});

const EndInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={6174} withAudio={withAudio} plate={14} tone="ink" frame>
		<Sequence durationInFrames={52}>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						fontFamily: FONT.sans,
						fontSize: 290,
						fontWeight: 900,
						lineHeight: 0.78,
						letterSpacing: '-0.055em',
						textTransform: 'uppercase',
						color: INK.accent,
					}}
				>
					EXECUTION
				</div>
			</AbsoluteFill>
		</Sequence>
		<Sequence from={52} durationInFrames={78}>
			<EndCard />
		</Sequence>
		<Sequence from={130} durationInFrames={56}>
			<FadeHeart />
		</Sequence>
	</SceneAudio>
);

const FadeHeart: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = Math.max(0, 1 - frame / 34);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0B'}}>
			<div
				style={{
					width: 8,
					height: 8,
					borderRadius: '50%',
					backgroundColor: INK.accent,
					opacity,
					boxShadow: `0 0 24px ${INK.accent}, 0 0 80px ${rgba(INK.accent, 0.5)}`,
				}}
			/>
			<AbsoluteFill style={{backgroundColor: '#0A0A0B', opacity: Math.max(0, (frame - 30) / 26)}} />
		</AbsoluteFill>
	);
};

const EndCard: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = spring({frame, fps, config: {damping: 24, mass: 0.8}});

	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: enter}}>
			<div style={{width: 1420}}>
				<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 10, letterSpacing: 3, color: INK.dim}}>
					<span>COLOPHON / PLATE XIV</span>
					<span>PROCESS 6271 — TERMINATED</span>
				</div>
				<div style={{height: 1, backgroundColor: INK.fg, marginTop: 12}} />
				<div style={{marginTop: 40, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 170, lineHeight: 1, color: INK.fg}}>
					world.execute(me);
				</div>
				<Spark x={980} y={520} size={7} trail={0} />
				<div style={{marginTop: 34, display: 'flex', gap: 28, fontFamily: FONT.mono, fontSize: 11, letterSpacing: 3, color: INK.dim}}>
					<span>MILI</span>
					<span>MIRACLE MILK</span>
					<span>2016</span>
					<span style={{color: INK.accent}}>EXIT 0000</span>
				</div>
				<div style={{height: 1, backgroundColor: INK.accent, marginTop: 28, width: 220}} />
				<div style={{marginTop: 20, fontFamily: FONT.mono, fontSize: 10, letterSpacing: 4, color: INK.dim}}>
					A LYRIC FILM — EVERY CUT ON THE WORD
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const EndScene = Interactive.create({
	Component: EndInner,
	layout: 'absolute-fill',
});
