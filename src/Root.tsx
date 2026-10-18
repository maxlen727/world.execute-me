import {Composition, Folder} from 'remotion';
import {WorldExecuteMe} from './WorldExecuteMe';
import {PowerScene, HookScene} from './scenes/power';
import {GeometryScene, CurrentScene, GiveScene} from './scenes/verse';
import {ProduceScene, SwitchScene, VibrationScene} from './scenes/objects';
import {FragmentsScene, InterludeScene, ExecutionScene} from './scenes/turn';
import {TrappedScene, LoveScene, EndScene} from './scenes/finale';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="WorldExecuteMe"
				component={WorldExecuteMe}
				durationInFrames={6360}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Folder name="Scenes">
				<Composition
					id="Scene-01-Power"
					component={PowerScene}
					durationInFrames={480}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-02-Hook"
					component={HookScene}
					durationInFrames={411}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-03-Geometry"
					component={GeometryScene}
					durationInFrames={443}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-04-Current"
					component={CurrentScene}
					durationInFrames={443}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-05-Give"
					component={GiveScene}
					durationInFrames={445}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-06-Produce"
					component={ProduceScene}
					durationInFrames={436}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-07-Switch"
					component={SwitchScene}
					durationInFrames={447}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-08-Vibration"
					component={VibrationScene}
					durationInFrames={445}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-09-Fragments"
					component={FragmentsScene}
					durationInFrames={387}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-10-Trial"
					component={InterludeScene}
					durationInFrames={493}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-11-Execution"
					component={ExecutionScene}
					durationInFrames={449}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-12-Trapped"
					component={TrappedScene}
					durationInFrames={439}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-13-Love"
					component={LoveScene}
					durationInFrames={856}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
				<Composition
					id="Scene-14-End"
					component={EndScene}
					durationInFrames={186}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{withAudio: true}}
				/>
			</Folder>
		</>
	);
};
