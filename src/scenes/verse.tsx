import {Interactive, Sequence} from 'remotion';
import {SceneAudio} from '../core/SceneAudio';
import {Beat} from '../kit/Beat';
import {
	CircleDiagram,
	ClockDiagram,
	ExecuteButtonDiagram,
	InfinityDiagram,
	MergeDiagram,
	PointsDiagram,
	SineDiagram,
	SlidersDiagram,
	SmileyDiagram,
	SpiralDiagram,
	ToggleDiagram,
	TrapBoxDiagram,
} from '../kit/Diagrams';

const GeometryInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={891} withAudio={withAudio} plate={3} tone="ink">
		<Sequence  durationInFrames={110}>
			<Beat
				duration={110}
				scheme="cream"
				pattern="grid"
				tag="01 / GEOMETRY"
				lines={["If I'm a set of points", 'Then I will give you my']}
				lineDelays={[0, 42]}
				lineSize={72}
				keyword="DIMENSION"
				keywordFont="serif"
				keywordDelay={79}
				renderDiagram={(progress) => <PointsDiagram scheme="cream" progress={progress} size={660} />}
			/>
		</Sequence>
		<Sequence from={110} durationInFrames={110}>
			<Beat
				duration={110}
				scheme="blue"
				pattern="dots"
				layout="center"
				tag="02 / GEOMETRY"
				lines={["If I'm a circle", 'Then I will give you my']}
				lineDelays={[0, 37]}
				lineSize={70}
				keyword="CIRCUMFERENCE"
				keywordFont="serif"
				keywordColor="#F4C24E"
				keywordDelay={76}
				renderDiagram={(progress) => <CircleDiagram scheme="blue" progress={progress} size={660} />}
			/>
		</Sequence>
		<Sequence from={220} durationInFrames={110}>
			<Beat
				duration={110}
				scheme="mint"
				pattern="grid"
				layout="flip"
				tag="03 / GEOMETRY"
				lines={["If I'm a sine wave", 'Then you can sit on all my']}
				lineDelays={[0, 46]}
				lineSize={70}
				keyword="TANGENTS"
				keywordFont="display"
				keywordDelay={79}
				renderDiagram={(progress) => <SineDiagram scheme="mint" progress={progress} size={660} />}
			/>
		</Sequence>
		<Sequence from={330} durationInFrames={113}>
			<Beat
				duration={113}
				scheme="ink"
				pattern="dots"
				layout="center"
				tag="04 / GEOMETRY"
				lines={['If I approach infinity', 'Then you can be my']}
				lineDelays={[0, 49]}
				lineSize={70}
				keyword="LIMITATIONS"
				keywordFont="serif"
				keywordDelay={74}
				renderDiagram={(progress) => <InfinityDiagram scheme="ink" progress={progress} size={660} />}
			/>
		</Sequence>
	</SceneAudio>
);

export const GeometryScene = Interactive.create({
	Component: GeometryInner,
	layout: 'absolute-fill',
});

const CurrentInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={1334} withAudio={withAudio} plate={4} tone="ink">
		<Sequence  durationInFrames={97}>
			<Beat
				duration={97}
				scheme="blue"
				pattern="grid"
				tag="01 / CURRENT"
				lines={['Switch my current']}
				lineSize={70}
				keyword="AC / DC"
				keywordFont="display"
				keywordColor="#F4C24E"
				keywordDelay={32}
				renderDiagram={(progress) => (
					<ToggleDiagram scheme="blue" left="AC" right="DC" progress={progress} size={640} />
				)}
			/>
		</Sequence>
		<Sequence from={97} durationInFrames={111}>
			<Beat
				duration={111}
				scheme="purple"
				pattern="dots"
				layout="flip"
				tag="02 / CURRENT"
				lines={['And then blind my vision', 'So dizzy so dizzy']}
				lineDelays={[0, 56]}
				lineSize={72}
				renderDiagram={(progress) => <SpiralDiagram scheme="purple" progress={progress} size={660} />}
			/>
		</Sequence>
		<Sequence from={208} durationInFrames={112}>
			<Beat
				duration={112}
				scheme="pink"
				pattern="grid"
				tag="03 / CURRENT"
				lines={['Oh we can travel', 'To A.D to B.C']}
				lineDelays={[0, 56]}
				lineSize={68}
				keyword="A.D. / B.C."
				keywordFont="display"
				keywordDelay={46}
				renderDiagram={(progress) => <ClockDiagram scheme="pink" progress={progress} size={700} />}
			/>
		</Sequence>
		<Sequence from={320} durationInFrames={123}>
			<Beat
				duration={123}
				scheme="ink"
				pattern="dots"
				layout="center"
				tag="04 / CURRENT"
				lines={['And we can unite', 'So deeply so deeply']}
				lineDelays={[0, 55]}
				lineSize={72}
				keyword="UNITE"
				keywordFont="serif"
				keywordDelay={45}
				renderDiagram={(progress) => <MergeDiagram scheme="ink" progress={progress} size={640} kind="wave" />}
			/>
		</Sequence>
	</SceneAudio>
);

export const CurrentScene = Interactive.create({
	Component: CurrentInner,
	layout: 'absolute-fill',
});

const GiveInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={1777} withAudio={withAudio} plate={5} tone="ink">
		<Sequence  durationInFrames={129}>
			<Beat
				duration={129}
				scheme="yellow"
				pattern="dots"
				tag="01 / GIVE"
				lines={['If I can', 'If I can give you all the']}
				lineDelays={[0, 14]}
				lineSize={72}
				keyword="STIMULATIONS"
				keywordFont="serif"
				keywordColor="#DE3B2F"
				keywordDelay={72}
				renderDiagram={(progress) => <SlidersDiagram scheme="yellow" progress={progress} size={700} />}
			/>
		</Sequence>
		<Sequence from={129} durationInFrames={92}>
			<Beat
				duration={92}
				scheme="pink"
				pattern="grid"
				layout="flip"
				tag="02 / GIVE"
				lines={['Then I can be your only']}
				lineSize={68}
				keyword="SATISFACTION"
				keywordFont="serif"
				keywordDelay={46}
				renderDiagram={(progress) => <SmileyDiagram scheme="pink" progress={progress} size={660} />}
			/>
		</Sequence>
		<Sequence from={221} durationInFrames={104}>
			<Beat
				duration={104}
				scheme="red"
				pattern="rays"
				tag="03 / GIVE"
				lines={['If I can make you happy', 'I will run the']}
				lineDelays={[0, 50]}
				lineSize={72}
				keyword="EXECUTION"
				keywordFont="pixel"
				keywordColor="#F4C24E"
				keywordDelay={70}
				renderDiagram={(progress) => (
					<ExecuteButtonDiagram scheme="red" progress={progress} size={640} pressed={0.9} />
				)}
			/>
		</Sequence>
		<Sequence from={325} durationInFrames={120}>
			<Beat
				duration={120}
				scheme="ink"
				pattern="dots"
				layout="center"
				tag="04 / GIVE"
				lines={['Though we are trapped', 'In this strange strange']}
				lineDelays={[0, 50]}
				lineSize={70}
				keyword="SIMULATION"
				keywordFont="pixel"
				keywordDelay={83}
				renderDiagram={(progress) => <TrapBoxDiagram scheme="ink" progress={progress} size={700} />}
			/>
		</Sequence>
	</SceneAudio>
);

export const GiveScene = Interactive.create({
	Component: GiveInner,
	layout: 'absolute-fill',
});
