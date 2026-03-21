import type { Color } from './Color';
import type { File } from './File';

export type NoteData = {
	id: string;
	title: string | null;
	position: { x: number; y: number; z: number };
	size: { width: number; height: number };
	color: Color | 'var(--default-bg-color)';
	content: (string | File)[];
};
