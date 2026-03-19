import type { Color } from './Color';
import type { File } from './File';

export type NoteData = {
	title: string | null;
	position: { x: number; y: number; z: number };
	color: Color | 'var(--default-bg-color)';
	content: (string | File)[];
};
