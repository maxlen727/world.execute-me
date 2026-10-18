import {Interactive, Sequence} from 'remotion';
import {SCHEMES} from '../theme';
import {SceneAudio} from '../core/SceneAudio';
import {Beat} from '../kit/Beat';
import {
	CatDiagram,
	EggplantDiagram,
	EyeGodDiagram,
	IsolationDiagram,
	MergeDiagram,
	SpiralDiagram,
	ToggleDiagram,
	TomatoDiagram,
	WaveRingsDiagram,
	ClockDiagram,
} from '../kit/Diagrams';

const ProduceInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={2222} withAudio={withAudio} plate={6} tone="ink">
		<Sequence  durationInFrames={106}>
			<Beat
				duration={106}
				scheme="purple"
				pattern="dots"
				tag="01 / IF I'M"
				cardScheme="paperPurple"
				lines={["If I'm an eggplant", 'Then I will give you my']}
				lineDelays={[0, 41]}
				lineSize={70}
				keyword="NUTRIENTS"
				keywordFont="serif"
				keywordColor={SCHEMES.purple.accent}
				keywordDelay={77}
				renderDiagram={(progress) => <EggplantDiagram scheme="purple" progress={progress} size={700} />}
			/>
		</Sequence>
		<Sequence from={106} durationInFrames={113}>
			<Beat
				duration={113}
				scheme="cream"
				pattern="grid"
				layout="flip"
				tag="02 / IF I'M"
				lines={["If I'm a tomato", 'Then I will give you']}
				lineDelays={[0, 50]}
				lineSize={70}
				keyword="ANTIOXIDANTS"
				keywordFont="serif"
				keywordDelay={81}
				renderDiagram={(progress) => <TomatoDiagram scheme="cream" progress={progress} size={700} />}
			/>
		</Sequence>
		<Sequence from={219} durationInFrames={112}>
			<Beat
				duration={112}
				scheme="yellow"
				pattern="dots"
				tag="03 / IF I'M"
				cardScheme="paperOrange"
				lines={["If I'm a tabby cat", 'Then I will purr for your']}
				lineDelays={[0, 44]}
				lineSize={70}
				keyword="ENJOYMENT"
				keywordFont="display"
				keywordColor="#DE3B2F"
				keywordDelay={78}
				renderDiagram={(progress) => <CatDiagram scheme="yellow" progress={progress} size={640} />}
			/>
		</Sequence>
		<Sequence from={331} durationInFrames={105}>
			<Beat
				duration={105}
				scheme="ink"
				pattern="dots"
				layout="center"
				tag="04 / IF I'M"
				lines={["If I'm the only god", "Then you're the proof of my"]}
				lineDelays={[0, 44]}
				lineSize={70}
				keyword="EXISTENCE"
				keywordFont="serif"
				keywordDelay={75}
				renderDiagram={(progress) => <EyeGodDiagram scheme="ink" progress={progress} size={660} />}
			/>
		</Sequence>
	</SceneAudio>
);

export const ProduceScene = Interactive.create({
	Component: ProduceInner,
	layout: 'absolute-fill',
});

const SwitchInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={2658} withAudio={withAudio} plate={7} tone="ink">
		<Sequence  durationInFrames={103}>
			<Beat
				duration={103}
				scheme="pink"
				pattern="grid"
				tag="01 / SWITCH"
				lines={['Switch my gender', 'To F to M']}
				lineDelays={[0, 48]}
				lineSize={68}
				renderDiagram={(progress) => (
					<ToggleDiagram scheme="pink" left="F" right="M" progress={progress} size={640} />
				)}
			/>
		</Sequence>
		<Sequence from={103} durationInFrames={104}>
			<Beat
				duration={104}
				scheme="blue"
				pattern="dots"
				layout="flip"
				tag="02 / SWITCH"
				lines={['And then do whatever', 'From AM to PM']}
				lineDelays={[0, 58]}
				lineSize={72}
				renderDiagram={(progress) => <ClockDiagram scheme="blue" mode="ampm" progress={progress} size={700} />}
			/>
		</Sequence>
		<Sequence from={207} durationInFrames={116}>
			<Beat
				duration={116}
				scheme="purple"
				pattern="grid"
				tag="03 / SWITCH"
				lines={['Oh switch my role', 'To S to M']}
				lineDelays={[0, 68]}
				lineSize={72}
				renderDiagram={(progress) => (
					<ToggleDiagram scheme="purple" left="S" right="M" progress={progress} size={640} />
				)}
			/>
		</Sequence>
		<Sequence from={323} durationInFrames={124}>
			<Beat
				duration={124}
				scheme="ink"
				pattern="dots"
				layout="center"
				tag="04 / SWITCH"
				lines={['So we can enter', 'The trance the trance']}
				lineDelays={[0, 64]}
				lineSize={70}
				keyword="TRANCE"
				keywordFont="serif"
				keywordDelay={52}
				renderDiagram={(progress) => <SpiralDiagram scheme="ink" progress={progress} size={660} />}
			/>
		</Sequence>
	</SceneAudio>
);

export const SwitchScene = Interactive.create({
	Component: SwitchInner,
	layout: 'absolute-fill',
});

const VibrationInner: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
	<SceneAudio startFrame={3105} withAudio={withAudio} plate={8} tone="ink">
		<Sequence  durationInFrames={112}>
			<Beat
				duration={112}
				scheme="cream"
				pattern="dots"
				tag="01 / SIGNAL"
				lines={['If I can', 'If I can feel your']}
				lineDelays={[0, 21]}
				lineSize={72}
				keyword="VIBRATIONS"
				keywordFont="serif"
				keywordDelay={74}
				renderDiagram={(progress) => <WaveRingsDiagram scheme="cream" progress={progress} size={660} />}
			/>
		</Sequence>
		<Sequence from={112} durationInFrames={110}>
			<Beat
				duration={110}
				scheme="pink"
				pattern="grid"
				layout="flip"
				tag="02 / SIGNAL"
				lines={['Then I can', 'Then I can finally be']}
				lineDelays={[0, 20]}
				lineSize={72}
				keyword="COMPLETION"
				keywordFont="serif"
				keywordDelay={80}
				renderDiagram={(progress) => <MergeDiagram scheme="pink" progress={progress} size={640} kind="orb" />}
			/>
		</Sequence>
		<Sequence from={222} durationInFrames={146}>
			<Beat
				duration={146}
				scheme="ink"
				pattern="dots"
				layout="center"
				lines={['Though you have left', 'You have left', 'You have left', 'You have left', 'You have left']}
				lineDelays={[0, 40, 66, 98, 120]}
				lineSize={56}
				renderDiagram={(progress) => <IsolationDiagram scheme="ink" progress={progress} size={700} />}
			/>
		</Sequence>
		<Sequence from={368} durationInFrames={77}>
			<Beat
				duration={77}
				scheme="ink"
				pattern="scan"
				tag="04 / SIGNAL"
				lines={['You have left me in']}
				lineSize={72}
				keyword="ISOLATION"
				keywordFont="display"
				keywordDelay={35}
				renderDiagram={(progress) => <IsolationDiagram scheme="ink" progress={progress} size={660} />}
			/>
		</Sequence>
	</SceneAudio>
);

export const VibrationScene = Interactive.create({
	Component: VibrationInner,
	layout: 'absolute-fill',
});
