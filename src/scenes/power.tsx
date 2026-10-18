import {AbsoluteFill, Interactive, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BONE, FONT, INK, SCHEMES, rgba} from '../theme';
import {Plate, Spark, usePlate} from '../core/Plate';
import {SceneAudio} from '../core/SceneAudio';
import {Beat} from '../kit/Beat';
import {
	BlocksDiagram,
	GlobeDiagram,
	ShieldDiagram,
	SlidersDiagram,
	ToggleDiagram,
	TrapBoxDiagram,
} from '../kit/Diagrams';
import {Stamp} from '../kit/Paper';
import {useBands} from '../core/Audio';

const PowerInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={0} withAudio={withAudio} plate={1} tone="ink" frame>
		<Sequence  durationInFrames={88}>
			<Beat
				duration={88}
				scheme="cream"
				pattern="grid"
				tag="01 / POWER ON"
				lines={['Switch on the power line', 'Remember to put on']}
				lineDelays={[0, 52]}
				lineSize={72}
				renderDiagram={(progress) => (
					<div style={{position: 'relative', width: 700, height: 620}}>
						<svg viewBox="0 0 600 600" style={{position: 'absolute', inset: 0, opacity: 0.3}}>
							<circle cx={300} cy={300} r={240} fill="none" stroke="#3BE8FF" strokeWidth={2} strokeDasharray="3 12" />
							<circle cx={300} cy={300} r={190} fill="none" stroke="rgba(59,232,255,0.35)" strokeWidth={1} />
							<path d="M300 120 V300" stroke="#3BE8FF" strokeWidth={8} strokeLinecap="round" />
							<path d="M205 190 A140 140 0 1 0 395 190" fill="none" stroke="#3BE8FF" strokeWidth={8} strokeLinecap="round" />
						</svg>
						<div style={{position: 'absolute', left: '50%', top: '58%', translate: '-50% -50%'}}>
							<ToggleDiagram scheme="cream" left="OFF" right="ON" progress={progress} size={720} />
						</div>
					</div>
				)}
			/>
		</Sequence>
		<Sequence from={88} durationInFrames={28}>
			<Beat
				duration={28}
				scheme="yellow"
				pattern="dots"
				layout="poster"
				tag="02 / POWER ON"
				keyword="PROTECTION"
				keywordFont="pixel"
				keywordColor={SCHEMES.yellow.accent}
				keywordDelay={0}
				style={{justifyContent: 'flex-start', paddingTop: 40}}
				diagramStyle={{right: 40, bottom: 40}}
				renderDiagram={(progress) => <ShieldDiagram scheme="yellow" progress={progress} size={360} />}
			/>
		</Sequence>
		<Sequence from={116} durationInFrames={75}>
			<Beat
				duration={75}
				scheme="cream"
				pattern="grid"
				layout="flip"
				tag="02 / SETUP"
				lines={['Lay down your pieces', "And let's begin"]}
				lineDelays={[0, 49]}
				lineSize={68}
				renderDiagram={(progress) => <BlocksDiagram scheme="cream" progress={progress} size={640} />}
			/>
		</Sequence>
		<Sequence from={191} durationInFrames={33}>
			<Beat
				duration={33}
				scheme="red"
				pattern="rays"
				layout="poster"
				tag="03 / OBJECT"
				keyword="OBJECT CREATION"
				keywordFont="display"
				keywordColor={SCHEMES.red.accent}
				keywordDelay={0}
				align="center"
			/>
		</Sequence>
		<Sequence from={224} durationInFrames={79}>
			<Beat
				duration={79}
				scheme="blue"
				pattern="grid"
				lines={['Fill in my data', 'parameters']}
				lineDelays={[0, 8]}
				lineSize={72}
				renderDiagram={(progress) => <SlidersDiagram scheme="blue" progress={progress} size={700} />}
			/>
		</Sequence>
		<Sequence from={303} durationInFrames={84}>
			<Beat
				duration={84}
				scheme="mint"
				pattern="dots"
				layout="flip"
				keyword="INITIALIZATION"
				keywordFont="display"
				keywordColor={SCHEMES.mint.accent}
				lines={['Set up our new world']}
				lineDelays={[30]}
				lineSize={68}
				keywordDelay={0}
				renderDiagram={(progress) => <GlobeDiagram scheme="mint" progress={progress} size={660} />}
			/>
		</Sequence>
		<Sequence from={387} durationInFrames={93}>
			<Beat
				duration={93}
				scheme="ink"
				pattern="dots"
				layout="center"
				lines={["And let's begin the"]}
				lineDelays={[0]}
				lineSize={70}
				keyword="SIMULATION"
				keywordFont="pixel"
				keywordColor={SCHEMES.ink.accent}
				keywordDelay={30}
				renderDiagram={(progress) => <TrapBoxDiagram scheme="ink" progress={progress} size={700} />}
			/>
		</Sequence>
	</SceneAudio>
);

export const PowerScene = Interactive.create({
	Component: PowerInner,
	layout: 'absolute-fill',
});

const HookLabel: React.FC<{readonly right?: string}> = ({right}) => (
	<div style={{position: 'absolute', left: 96, top: 58, right: 96, display: 'flex', justifyContent: 'space-between'}}>
		<div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
			<span style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: 3, color: INK.dim}}>PLATE II</span>
			<span style={{fontFamily: FONT.sans, fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: INK.fg}}>
				INVOCATION
			</span>
			<div style={{width: 90, height: 1, backgroundColor: INK.line}} />
		</div>
		<span style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: 3, color: INK.dim}}>{right ?? 'CMD / 6271'}</span>
	</div>
);

const HookTitle: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const text = 'world.execute(me);';
	const count = Math.min(text.length, Math.floor(frame * 1.1));
	const blink = Math.floor(frame / 10) % 2 === 0;
	const enter = spring({frame, fps, config: {damping: 20, mass: 0.6}});

	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage: 'linear-gradient(to right, rgba(238,233,223,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(238,233,223,0.05) 1px, transparent 1px)',
					backgroundSize: '120px 120px',
				}}
			/>
			<HookLabel />
			<div style={{display: 'flex', alignItems: 'flex-end', opacity: enter}}>
				<span style={{fontFamily: FONT.mono, fontSize: 74, fontWeight: 300, color: INK.dim, marginRight: 24, marginBottom: 18}}>
					&gt;
				</span>
				<span
					style={{
						fontFamily: FONT.mono,
						fontSize: 126,
						fontWeight: 400,
						lineHeight: 1,
						color: INK.fg,
						whiteSpace: 'nowrap',
					}}
				>
					{text.slice(0, count)}
				</span>
				<span
					style={{
						width: 30,
						height: 92,
						marginLeft: 10,
						marginBottom: 2,
						backgroundColor: blink ? INK.accent : 'transparent',
						border: `1px solid ${INK.accent}`,
					}}
				/>
			</div>
			<Spark x={1210} y={560} size={8} trail={0} />
			<div style={{position: 'absolute', bottom: 150, display: 'flex', alignItems: 'center', gap: 16, opacity: Math.max(0, Math.min(1, (frame - 45) / 18))}}>
				<div style={{border: `1px solid ${INK.accent}`, padding: '7px 14px', fontFamily: FONT.mono, fontSize: 12, letterSpacing: 2, color: INK.accent}}>
					ENTER
				</div>
				<span style={{fontFamily: FONT.mono, fontSize: 12, letterSpacing: 4, color: INK.dim}}>TO EXECUTE</span>
			</div>
		</AbsoluteFill>
	);
};

const HookExecute: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {bass} = useBands();
	const enter = spring({frame, fps, config: {damping: 11, mass: 0.4, stiffness: 240}});
	const jitter = Math.sin(frame * 1.7) * bass * 5;

	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					width: 700 + bass * 120,
					height: 700 + bass * 120,
					borderRadius: '50%',
					border: `1px solid ${rgba(INK.accent, 0.35)}`,
				}}
			/>
			<div style={{position: 'absolute', width: 980 + bass * 140, height: 980 + bass * 140, borderRadius: '50%', border: `1px solid ${rgba(INK.fg, 0.12)}`}} />
			<div style={{rotate: '-3deg', scale: enter * (1 + bass * 0.02), translate: `${jitter}px 0`, textAlign: 'center'}}>
				<div
					style={{
						fontFamily: FONT.sans,
						fontSize: 330,
						fontWeight: 900,
						lineHeight: 0.78,
						letterSpacing: '-0.05em',
						textTransform: 'uppercase',
						color: INK.fg,
						textShadow: `12px 12px 0 ${INK.accent}`,
					}}
				>
					EXECUTE
				</div>
			</div>
			<div style={{position: 'absolute', bottom: 130, fontFamily: FONT.mono, fontSize: 12, letterSpacing: 5, color: INK.dim}}>
				PROCESS 6271 // RUN
			</div>
			<HookLabel right="EXEC / 02" />
		</AbsoluteFill>
	);
};

const HookHeart: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {bass} = useBands();
	const p = usePlate();
	const enter = spring({frame, fps, config: {damping: 16, mass: 0.8}});
	const pulse = 1 + bass * 0.05;

	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 30}}>
			<HookLabel right="CARDIAC / 03" />
			<div style={{scale: (0.7 + enter * 0.3) * pulse, filter: `drop-shadow(0 0 ${20 + bass * 40}px rgba(255,77,18,${0.3 + bass * 0.4}))`}}>
				<svg width={660} height={610} viewBox="0 0 520 480">
					<path
						d="M260 430 C 90 320 30 220 70 140 C 105 70 205 70 250 160 L260 185 L270 160 C 315 70 415 70 450 140 C 490 220 430 320 260 430 Z"
						fill={`url(#${p.hatchId})`}
						stroke={p.accent}
						strokeWidth={3}
					/>
				</svg>
			</div>
			<div style={{fontFamily: FONT.mono, fontSize: 12, letterSpacing: 5, color: INK.dim}}>
				CARDIAC MODULE // ONLINE
			</div>
			<svg width={720} height={90} viewBox="0 0 720 90" style={{marginTop: 20}}>
				<line x1={0} y1={45} x2={720} y2={45} stroke={INK.line} strokeWidth={1} />
				<polyline
					points="0,45 180,45 200,45 215,20 230,70 245,10 260,45 380,45 400,45 415,25 430,60 445,45 720,45"
					fill="none"
					stroke={INK.accent}
					strokeWidth={2}
					opacity={0.8 + bass * 0.2}
				/>
			</svg>
		</AbsoluteFill>
	);
};

const HookReprise: React.FC = () => {
	const frame = useCurrentFrame();
	const stampIn = spring({frame: frame - 18, fps: 30, config: {damping: 9, mass: 0.6, stiffness: 220}});

	return (
		<Plate tone="bone" frame>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						width: 1120,
						border: `1px solid ${BONE.fg}`,
						padding: '46px 54px 40px',
						position: 'relative',
					}}
				>
					<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 10, letterSpacing: 2, color: BONE.dim}}>
						<span>FORM 7-X / EXECUTION RECORD</span>
						<span>CASE 6271</span>
					</div>
					<div style={{marginTop: 30, fontFamily: FONT.mono, fontSize: 76, fontWeight: 400, letterSpacing: -2, color: BONE.fg}}>
						world.execute(me);
					</div>
					<div style={{marginTop: 26, fontFamily: FONT.mono, fontSize: 13, letterSpacing: 2, lineHeight: 1.9, color: BONE.dim}}>
						DECLARANT: ME / TARGET: WORLD<br />
						STATUS: <span style={{color: BONE.accent}}>EXECUTED</span> / EXIT CODE 0000
					</div>
					<div style={{marginTop: 38, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
						<div style={{width: 360, borderBottom: `1px solid ${BONE.fg}`, paddingBottom: 8, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 26, color: BONE.fg}}>
							world
						</div>
						<div style={{scale: stampIn, rotate: '-6deg'}}>
							<Stamp scheme={BONE} color={BONE.accent} style={{fontSize: 30, borderWidth: 2}}>
								EXECUTED
							</Stamp>
						</div>
					</div>
				</div>
			</AbsoluteFill>
		</Plate>
	);
};

const HookInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={480} withAudio={withAudio} plate={2} tone="ink">
		<Sequence  durationInFrames={110}>
			<HookTitle />
		</Sequence>
		<Sequence from={110} durationInFrames={110}>
			<HookExecute />
		</Sequence>
		<Sequence from={220} durationInFrames={110}>
			<HookHeart />
		</Sequence>
		<Sequence from={330} durationInFrames={81}>
			<HookReprise />
		</Sequence>
	</SceneAudio>
);

export const HookScene = Interactive.create({
	Component: HookInner,
	layout: 'absolute-fill',
});
