import type { File } from './File';

export type NoteData = {
	title: string | null;
	position: { x: number; y: number; z: number };
	color: {
		type: 'hex' | 'rgb' | 'hsl' | 'oklch';
		value: string | number[];
	};
	content: (string | File)[];
};
