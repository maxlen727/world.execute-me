import {AbsoluteFill, Interactive, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BONE, FONT, INK, rgba} from '../theme';
import {SceneAudio} from '../core/SceneAudio';
import {Beat} from '../kit/Beat';
import {EyeGodDiagram, ShardsDiagram} from '../kit/Diagrams';
import {Stamp} from '../kit/Paper';

import {useBands} from '../core/Audio';
import {Plate} from '../core/Plate';

const FragmentsInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={3550} withAudio={withAudio} plate={9} tone="ink">
		<Sequence  durationInFrames={102}>
			<Beat
				duration={102}
				scheme="cream"
				pattern="grid"
				tag="01 / FRAGMENTS"
				lines={['If I can', 'If I can erase all the pointless']}
				lineDelays={[0, 20]}
				lineSize={70}
				keyword="FRAGMENTS"
				keywordFont="display"
				keywordDelay={66}
				renderDiagram={(progress) => <ShardsDiagram scheme="cream" progress={progress} size={660} />}
			/>
		</Sequence>
		<Sequence from={102} durationInFrames={119}>
			<Beat
				duration={119}
				scheme="red"
				pattern="dots"
				layout="flip"
				tag="02 / FRAGMENTS"
				lines={['Then maybe', "Then maybe you won't leave me so"]}
				lineDelays={[0, 29]}
				lineSize={70}
				keyword="DISHEARTENED"
				keywordFont="serif"
				keywordColor="#F4C24E"
				keywordDelay={85}
				renderDiagram={(progress) => <ShardsDiagram scheme="red" progress={progress} size={660} />}
			/>
		</Sequence>
		<Sequence from={221} durationInFrames={166}>
			<Beat
				duration={166}
				scheme="ink"
				pattern="scan"
				tag="03 / FRAGMENTS"
				lines={['Challenging your god', 'You have made some']}
				lineDelays={[0, 89]}
				lineSize={68}
				renderDiagram={(progress) => <EyeGodDiagram scheme="ink" progress={progress} size={660} />}
			/>
		</Sequence>
	</SceneAudio>
);

export const FragmentsScene = Interactive.create({
	Component: FragmentsInner,
	layout: 'absolute-fill',
});

const Trial: React.FC = () => {
	const frame = useCurrentFrame();
	const stamp = spring({frame: frame - 10, fps: 30, config: {damping: 10, mass: 0.6, stiffness: 220}});

	return (
		<Plate tone="bone">
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{width: 1440, border: `1px solid ${BONE.fg}`, padding: '46px 56px 40px', position: 'relative'}}>
					<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 11, letterSpacing: 2, color: BONE.fg}}>
						<span>FORM 7-X / TRIBUNAL OF THE WORLD</span>
						<span>FILED / 02:11:22</span>
					</div>
					<div style={{height: 1, backgroundColor: BONE.fg, marginTop: 12}} />
					<div style={{position: 'absolute', left: 96, top: 58, fontFamily: FONT.mono, fontSize: 11, letterSpacing: 3, color: BONE.dim}}>
					PLATE X — TRIBUNAL
				</div>
				<div style={{marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
						<div>
							<div style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: 2, color: BONE.dim}}>CHARGE 01</div>
							<div style={{fontFamily: FONT.sans, fontSize: 138, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.045em', color: BONE.fg, marginTop: 10}}>
								ILLEGAL
								<br />
								ARGUMENTS
							</div>
						</div>
						<div style={{fontFamily: FONT.mono, fontSize: 96, fontWeight: 300, color: BONE.dim, lineHeight: 1}}>§404</div>
					</div>
					<div style={{marginTop: 26, fontFamily: FONT.mono, fontSize: 13, letterSpacing: 1.5, lineHeight: 2, color: BONE.fg, maxWidth: 760}}>
						The defendant has made statements that cannot be parsed by this world. The claim
						“I can be anything you want” does not reduce to a finite type.
					</div>
					<div style={{marginTop: 24, display: 'flex', gap: 26, fontFamily: FONT.mono, fontSize: 12, letterSpacing: 2}}>
						<span>[x] REJECTED</span>
						<span>[ ] SYNT</span>
						<span>[ ] GOD MODE</span>
					</div>
					<div style={{marginTop: 34, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
						<div style={{fontFamily: FONT.mono, fontSize: 10, letterSpacing: 2, color: BONE.dim}}>
							EXHIBIT 6271 / P(LOVE) = UNDEFINED
						</div>
						<div style={{scale: stamp, rotate: '-7deg'}}>
							<Stamp scheme={BONE} color={BONE.accent} style={{fontSize: 34, borderWidth: 3}}>
								REJECTED
							</Stamp>
						</div>
					</div>
				</div>
			</AbsoluteFill>
		</Plate>
	);
};

const Countdown: React.FC<{
	readonly startValue: number;
	readonly scheme: 'ink' | 'red';
}> = ({startValue}) => {
	const frame = useCurrentFrame();
	const {bass} = useBands();
	const value = Math.max(1, startValue - Math.floor(frame / 30));

	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{position: 'absolute', top: 120, fontFamily: FONT.mono, fontSize: 11, letterSpacing: 6, color: INK.dim}}>
				JUDGEMENT IN PROGRESS
			</div>
			<div style={{position: 'absolute', fontFamily: FONT.mono, fontSize: 11, letterSpacing: 4, color: INK.dim, top: 120, right: 96}}>
				T-MINUS
			</div>
			<div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
				<div style={{fontFamily: FONT.sans, fontSize: 470, fontWeight: 900, lineHeight: 0.72, color: INK.fg, letterSpacing: '-0.05em'}}>
					{value.toString().padStart(2, '0')}
				</div>
				<div style={{display: 'flex', flexDirection: 'column', gap: 8, fontFamily: FONT.mono, fontSize: 12, letterSpacing: 3, color: INK.dim}}>
					<span>SECONDS</span>
					<span style={{color: INK.accent}}>TO EXECUTION</span>
				</div>
			</div>
			<div style={{position: 'absolute', bottom: 130, textAlign: 'center'}}>
				<div style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: 8, color: INK.dim}}>SENTENCE</div>
				<div style={{fontFamily: FONT.sans, fontSize: 72, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: INK.accent, textShadow: `0 0 ${30 + bass * 40}px ${rgba(INK.accent, 0.35)}`}}>
					EXECUTION
				</div>
			</div>
			<div style={{position: 'absolute', left: 96, bottom: 130, fontFamily: FONT.mono, fontSize: 10, letterSpacing: 2, color: INK.dim}}>
				PLATE X — TRIBUNAL
			</div>
		</AbsoluteFill>
	);
};

const Rise: React.FC = () => {
	const frame = useCurrentFrame();
	const {bass} = useBands();
	const scale = interpolate(frame, [0, 60], [0.92, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{scale: scale * (1 + bass * 0.02), textAlign: 'center'}}>
				<div style={{fontFamily: FONT.mono, fontSize: 12, letterSpacing: 8, color: INK.dim, marginBottom: 24}}>SENTENCE CARRIED</div>
				<div
					style={{
						fontFamily: FONT.sans,
						fontSize: 210,
						fontWeight: 900,
						lineHeight: 0.8,
						letterSpacing: '-0.05em',
						textTransform: 'uppercase',
						color: INK.fg,
						textShadow: `10px 10px 0 ${INK.accent}`,
					}}
				>
					EXECUTION
				</div>
			</div>
			<div style={{position: 'absolute', bottom: 120, display: 'flex', gap: 6}}>
				{Array.from({length: 28}, (_, index) => (
					<div key={index} style={{width: 4, height: 30 + (index % 5) * 10, backgroundColor: index % 4 === 0 ? INK.accent : INK.line}} />
				))}
			</div>
		</AbsoluteFill>
	);
};

const InterludeInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={3937} withAudio={withAudio} plate={10} tone="ink">
		<Sequence durationInFrames={80}>
			<Trial />
		</Sequence>
		<Sequence from={80} durationInFrames={240}>
			<Countdown startValue={10} scheme="red" />
		</Sequence>
		<Sequence from={320} durationInFrames={100}>
			<Countdown startValue={3} scheme="ink" />
		</Sequence>
		<Sequence from={420} durationInFrames={73}>
			<Rise />
		</Sequence>
	</SceneAudio>
);

export const InterludeScene = Interactive.create({
	Component: InterludeInner,
	layout: 'absolute-fill',
});

const HIT_TIMES = [0, 28, 56, 86, 116, 139, 165, 190, 226, 253, 281, 310];
const NUMBERS = [
	{at: 337, word: 'EIN', value: '01'},
	{at: 350, word: 'DOS', value: '02'},
	{at: 360, word: 'TROIS', value: '03'},
	{at: 377, word: 'NE', value: '04'},
	{at: 391, word: 'FEM', value: '05'},
	{at: 404, word: 'LIU', value: '06'},
];

const Hit: React.FC<{readonly index: number}> = ({index}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {bass} = useBands();
	const bone = index % 3 === 1;
	const inverted = index % 4 === 2;
	const enter = spring({frame, fps, config: {damping: 9, mass: 0.4, stiffness: 260}});
	const rotate = index % 2 === 0 ? '-5deg' : '4deg';
	const p = bone ? BONE : INK;
	const bg = inverted ? INK.accent : p.bg;
	const fg = inverted ? INK.bg : p.fg;

	return (
		<Plate tone={bone ? 'bone' : 'ink'}>
			<AbsoluteFill style={{backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
				<div style={{position: 'absolute', inset: 30, border: `1px solid ${inverted ? rgba(INK.bg, 0.4) : p.line}`}} />
				<div style={{position: 'absolute', top: 52, left: 96, fontFamily: FONT.mono, fontSize: 11, letterSpacing: 4, color: inverted ? rgba(INK.bg, 0.65) : p.dim}}>
					PLATE XI / EXECUTION
				</div>
				<div style={{position: 'absolute', top: 52, right: 96, fontFamily: FONT.mono, fontSize: 11, letterSpacing: 4, color: inverted ? rgba(INK.bg, 0.65) : p.dim}}>
					{(index + 1).toString().padStart(2, '0')} / 12
				</div>
				<div style={{scale: 0.72 + enter * 0.28, rotate, textAlign: 'center', translate: `${Math.sin(frame * 1.4) * bass * 6}px 0`}}>
					<div
						style={{
							fontFamily: FONT.sans,
							fontSize: 286,
							fontWeight: 900,
							lineHeight: 0.76,
							letterSpacing: '-0.055em',
							textTransform: 'uppercase',
							color: fg,
							textShadow: inverted ? 'none' : `14px 14px 0 ${INK.accent}`,
						}}
					>
						EXECUTION
					</div>
				</div>
				<div style={{position: 'absolute', bottom: 62, left: 96, right: 96, display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 10, letterSpacing: 2, color: inverted ? rgba(INK.bg, 0.6) : p.dim}}>
					<span>PROCESS 6271 / TERMINATED</span>
					<span>REV 11.0</span>
				</div>
			</AbsoluteFill>
		</Plate>
	);
};

const NumberHit: React.FC<{readonly index: number}> = ({index}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const item = NUMBERS[index];
	const bone = index % 2 === 1;
	const enter = spring({frame, fps, config: {damping: 12, mass: 0.5, stiffness: 240}});
	const p = bone ? BONE : INK;

	return (
		<Plate tone={bone ? 'bone' : 'ink'}>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 50, scale: enter}}>
					<div style={{fontFamily: FONT.sans, fontSize: 400, fontWeight: 900, lineHeight: 0.7, color: p.accent}}>
						{item.value}
					</div>
					<div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
						<div style={{fontFamily: FONT.mono, fontSize: 54, fontWeight: 500, letterSpacing: 2, color: p.fg}}>{item.word}</div>
						<div style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: 4, color: p.dim}}>COUNT / 06</div>
					</div>
				</div>
			</AbsoluteFill>
		</Plate>
	);
};

const ExecutionInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={4430} withAudio={withAudio} plate={11} tone="ink">
		{HIT_TIMES.map((at, index) => {
			const next = HIT_TIMES[index + 1] ?? NUMBERS[0].at;
			return (
				<Sequence key={at} from={at} durationInFrames={next - at}>
					<Hit index={index} />
				</Sequence>
			);
		})}
		{NUMBERS.map((item, index) => {
			const next = NUMBERS[index + 1]?.at ?? 418;
			return (
				<Sequence key={item.at} from={item.at} durationInFrames={next - item.at}>
					<NumberHit index={index} />
				</Sequence>
			);
		})}
		<Sequence from={418} durationInFrames={31}>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{fontFamily: FONT.sans, fontSize: 280, fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', color: INK.accent}}>
					EXECUTION
				</div>
			</AbsoluteFill>
		</Sequence>
	</SceneAudio>
);

export const ExecutionScene = Interactive.create({
	Component: ExecutionInner,
	layout: 'absolute-fill',
});
