import type { Color } from './Color';
import type { File } from './File';

export type NoteData = {
	title: string | null;
	position: { x: number; y: number; z: number };
	color: Color;
	content: (string | File)[];
};
