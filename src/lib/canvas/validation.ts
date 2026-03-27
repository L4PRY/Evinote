import type { CanvasData } from '../types/canvas/CanvasData';
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
