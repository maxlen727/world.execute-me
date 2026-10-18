import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const Fade: React.FC<{
	readonly duration: number;
	readonly children: React.ReactNode;
	readonly fade?: number;
}> = ({duration, children, fade = 6}) => {
	const frame = useCurrentFrame();
	const opacity = Math.min(clamp01(frame / fade), clamp01((duration - frame) / fade));
	return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};
