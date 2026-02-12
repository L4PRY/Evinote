import type { File } from './File';

export type NoteData = {
	title: string | null;
	position: { x: number; y: number; z: number };
	color:
		| { type: 'hex'; value: string }
		| { type: 'rgb'; value: [r: number, g: number, b: number, a?: number] }
		| { type: 'hsl'; value: [h: number, s: number, l: number, a?: number] }
		| { type: 'oklch'; value: [l: number, c: number, h: number, a?: number] };
	content: (string | File)[];
};
