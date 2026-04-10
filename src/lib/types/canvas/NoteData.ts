import type { Color } from './Color';
import type { File } from './File';

export type NoteContent = {
	type: 'text' | 'file';
	value: string | File;
	height?: number;
	textAlign?: 'left' | 'center' | 'right' | 'justify';
	fontSize?: number;
};

export type NoteData = {
	id: string;
	title: string | null;
	position: { x: number; y: number; z: number };
	size: { width: number; height: number };
	color: Color | 'var(--default-bg-color)';
	content: (string | File | NoteContent)[];
};
