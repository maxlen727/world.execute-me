import {AbsoluteFill, Track, useCurrentFrame} from 'remotion';
import {AudioAnalysis, GlobalFrame, SongAudio, useBands} from './core/Audio';
import {useImpact} from './core/impacts';
import {actAt} from './core/timeline';
import {PowerScene, HookScene} from './scenes/power';
import {GeometryScene, CurrentScene, GiveScene} from './scenes/verse';
import {ProduceScene, SwitchScene, VibrationScene} from './scenes/objects';
import {FragmentsScene, InterludeScene, ExecutionScene} from './scenes/turn';
import {TrappedScene, LoveScene, EndScene} from './scenes/finale';

const MasterInner: React.FC = () => {
	const frame = useCurrentFrame();
	const {bass} = useBands();
	const {strength} = useImpact();
	const act = actAt(frame);
	const since = frame - act.from;
	const cut = Math.max(0, 1 - since / 4);
	const shakeX = (Math.sin(frame * 1.7) + Math.sin(frame * 5.3)) * (strength * 8 + cut * 5);
	const shakeY = (Math.cos(frame * 2.1) + Math.cos(frame * 6.1)) * (strength * 7 + cut * 4);

	return (
		<AbsoluteFill
			style={{
				translate: `${shakeX}px ${shakeY}px`,
				scale: 1.004 + strength * 0.018 + cut * 0.012 + bass * 0.002,
			}}
		>
			<Track name="Scenes">
				<PowerScene name="01 Power" from={0} durationInFrames={480} />
				<HookScene name="02 Execute" from={480} durationInFrames={411} />
				<GeometryScene name="03 Geometry" from={891} durationInFrames={443} />
				<CurrentScene name="04 Current" from={1334} durationInFrames={443} />
				<GiveScene name="05 Stimulation" from={1777} durationInFrames={445} />
				<ProduceScene name="06 Objects" from={2222} durationInFrames={436} />
				<SwitchScene name="07 Switch" from={2658} durationInFrames={447} />
				<VibrationScene name="08 Signal" from={3105} durationInFrames={445} />
				<FragmentsScene name="09 Fragments" from={3550} durationInFrames={387} />
				<InterludeScene name="10 Trial" from={3937} durationInFrames={493} />
				<ExecutionScene name="11 Execution" from={4430} durationInFrames={449} />
				<TrappedScene name="12 Trapped" from={4879} durationInFrames={439} />
				<LoveScene name="13 Lo-o-ove" from={5318} durationInFrames={856} />
				<EndScene name="14 EOF" from={6174} durationInFrames={186} />
			</Track>
			<AbsoluteFill
				style={{
					backgroundColor: '#FF4D12',
					opacity: strength * 0.07 + cut * 0.05,
					pointerEvents: 'none',
				}}
			/>
		</AbsoluteFill>
	);
};

export const WorldExecuteMe: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: '#0A0A0B'}}>
			<GlobalFrame>
				<AudioAnalysis offsetInFrames={0}>
					<SongAudio />
					<MasterInner />
				</AudioAnalysis>
			</GlobalFrame>
		</AbsoluteFill>
	);
};
