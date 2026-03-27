import type { CanvasData } from '../types/canvas/CanvasData';
import type { NoteData } from '../types/canvas/NoteData';
import type { Color } from '../types/canvas/Color';
import type { Grid } from '../types/canvas/Grid';

export const DEFAULT_CANVAS_DATA: CanvasData = {
	size: { width: 3200, height: 3200 },
	thumbnail: undefined,
	background: {
		type: 'Custom',
		value:
			'conic-gradient(#dc57af 90deg,#a80f75 90deg 180deg,#dc57af 180deg 270deg,#a80f75 270deg);'
	}
};

/**
 * Returns the "official" system default for a given background type.
 */
export function getBackgroundDefaults(type: CanvasData['background']['type']): CanvasData['background'] {
	switch (type) {
		case 'Solid':
			return { type: 'Solid', value: { type: 'hex', value: '#ffffff' } as Color };
		case 'Grid':
			return {
				type: 'Grid',
				value: {
					type: 'Dot',
					background: { type: 'hex', value: '#ffffff' } as Color,
					size: 20,
					color: { type: 'hex', value: '#cccccc' } as Color
				} as Grid
			};
		case 'Image':
			return { type: 'Image', value: '' as unknown as URL };
		case 'Custom':
		default:
			return DEFAULT_CANVAS_DATA.background;
	}
}

/**
 * Validates canvas data and returns a safe fallback if malformed.
 */
export function validateCanvasData(data: any): CanvasData {
	if (!data || typeof data !== 'object') return DEFAULT_CANVAS_DATA;

	const validated: Partial<CanvasData> = {};

	// Validate Size
	if (
		data.size &&
		typeof data.size.width === 'number' &&
		typeof data.size.height === 'number' &&
		!isNaN(data.size.width) &&
		!isNaN(data.size.height)
	) {
		validated.size = {
			width: Math.max(100, data.size.width),
			height: Math.max(100, data.size.height)
		};
	} else {
		validated.size = DEFAULT_CANVAS_DATA.size;
	}

	// Validate Background
	if (data.background && typeof data.background.type === 'string') {
		const bg = data.background;
		const type = bg.type;

		if (['Image', 'Solid', 'Grid', 'Custom'].includes(type) && bg.value !== undefined) {
			validated.background = bg;
		} else {
			validated.background = getBackgroundDefaults(type as any);
		}
	} else {
		validated.background = DEFAULT_CANVAS_DATA.background;
	}

	validated.thumbnail = data.thumbnail;

	return validated as CanvasData;
}

/**
 * Validates note data and returns a safe fallback if malformed.
 */
export function validateNoteData(note: any): NoteData {
	if (!note || typeof note !== 'object') {
		return {
			id: Math.random().toString(36).substr(2, 9),
			title: 'Note',
			position: { x: 0, y: 0, z: 1 },
			size: { width: 200, height: 200 },
			color: 'var(--default-bg-color)',
			content: []
		};
	}

	const validated: Partial<NoteData> = {
		id: note.id || Math.random().toString(36).substr(2, 9),
		title: note.title ?? 'Note',
		content: Array.isArray(note.content) ? note.content : [],
		color: note.color || 'var(--default-bg-color)'
	};

	// Validate Position
	if (
		note.position &&
		typeof note.position.x === 'number' &&
		typeof note.position.y === 'number' &&
		!isNaN(note.position.x) &&
		!isNaN(note.position.y)
	) {
		validated.position = {
			x: note.position.x,
			y: note.position.y,
			z: typeof note.position.z === 'number' ? note.position.z : 1
		};
	} else {
		validated.position = { x: 0, y: 0, z: 1 };
	}

	// Validate Size
	if (
		note.size &&
		typeof note.size.width === 'number' &&
		typeof note.size.height === 'number' &&
		!isNaN(note.size.width) &&
		!isNaN(note.size.height)
	) {
		validated.size = {
			width: Math.max(50, note.size.width),
			height: Math.max(50, note.size.height)
		};
	} else {
		validated.size = { width: 200, height: 200 };
	}

	return validated as NoteData;
}
