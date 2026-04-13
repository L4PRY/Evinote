import type { Color } from './Color';
import type { File } from './File';

export type ChecklistItem = {
	text: string;
	checked: boolean;
};

export type NoteContent = {
	type: 'text' | 'file' | 'checkbox' | 'checklist';
	value: string | File | ChecklistItem[];
	checked?: boolean;
	height?: number;
	textAlign?: 'left' | 'center' | 'right' | 'justify';
	fontSize?: number;
	verticalAlign?: 'top' | 'middle' | 'bottom';
};

export type NoteData = {
	id: string;
	title: string | null;
	position: { x: number; y: number; z: number };
	size: { width: number; height: number };
	color: Color | 'var(--default-bg-color)';
	content: (string | File | NoteContent)[];
};

export type NotesRecord = Record<string, NoteData | null>;
