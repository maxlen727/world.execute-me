export type Act = {
	readonly id: string;
	readonly label: string;
	readonly from: number;
	readonly duration: number;
};

export const ACTS: readonly Act[] = [
	{id: 'power', label: 'POWER ON', from: 0, duration: 480},
	{id: 'hook', label: 'EXECUTE', from: 480, duration: 411},
	{id: 'geometry', label: 'GEOMETRY', from: 891, duration: 443},
	{id: 'current', label: 'CURRENT', from: 1334, duration: 443},
	{id: 'give', label: 'STIMULATION', from: 1777, duration: 445},
	{id: 'produce', label: 'OBJECTS', from: 2222, duration: 436},
	{id: 'switch', label: 'SWITCH', from: 2658, duration: 447},
	{id: 'vibration', label: 'SIGNAL', from: 3105, duration: 445},
	{id: 'fragments', label: 'FRAGMENTS', from: 3550, duration: 387},
	{id: 'trial', label: 'TRIAL', from: 3937, duration: 493},
	{id: 'execution', label: 'EXECUTION', from: 4430, duration: 449},
	{id: 'trapped', label: 'TRAPPED', from: 4879, duration: 439},
	{id: 'love', label: 'LO-O-OVE', from: 5318, duration: 856},
	{id: 'end', label: 'EOF', from: 6174, duration: 186},
];

export const actAt = (frame: number) => {
	let active = ACTS[0];
	for (const act of ACTS) {
		if (frame >= act.from) {
			active = act;
		}
	}
	return active;
};
