import {useCurrentFrame, useVideoConfig} from 'remotion';

/** Timestamps (seconds) of the words that should hit like a punch. */
export const IMPACTS = [
	6.38, 10.09, 13.89, 29.71, 33.41, 37.07, 40.71, 44.45, 51.36, 55.08,
	59.22, 63.53, 66.6, 70.08, 74.05, 77.58, 81.35, 85.08, 88.59, 92.02, 95.47,
	99.35, 103.49, 107.22, 110.9, 115.78, 118.33, 121.73, 125.71, 162.63, 166.02,
	169.82, 173.64, 177.25, 180.86, 184.54, 188.48, 196.5,

	16.0, 32.68, 36.29, 40.05, 43.51, 45.85, 49.53, 53.23, 56.92, 61.96,
	65.4, 69.26, 73.17, 76.96, 80.62, 84.27, 87.92, 90.2, 93.95, 97.74,
	101.47, 106.29, 110.22, 110.9, 115.78, 120.86, 124.89, 131.22, 147.66,
	148.6, 149.52, 150.54, 151.52, 152.28, 153.16, 153.98, 155.2, 156.08,
	157.04, 158.0, 158.9, 159.32, 159.66, 160.24, 160.69, 161.12, 161.58,
	165.17, 168.91, 172.71, 174.97, 179.93, 183.65, 187.66, 191.36, 205.81,
];

export const IMPACT_WINDOW = 0.55;

export const impactAt = (seconds: number) => {
	let strength = 0;
	let age = 999;
	for (const time of IMPACTS) {
		const delta = seconds - time;
		if (delta >= 0 && delta < IMPACT_WINDOW) {
			const value = 1 - delta / IMPACT_WINDOW;
			if (value > strength) {
				strength = value;
				age = delta;
			}
		}
	}
	return {strength, age};
};

export const useImpact = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return impactAt(frame / fps);
};

export const useCameraShake = () => {
	const frame = useCurrentFrame();
	return {
		x: Math.sin(frame * 1.7) * 3 + Math.sin(frame * 5.3) * 1.5,
		y: Math.cos(frame * 2.1) * 3 + Math.cos(frame * 6.1) * 1.5,
	};
};
