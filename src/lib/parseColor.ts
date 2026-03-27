import type { Color } from './types/canvas/Color';

export function parseColor(color: Color | string | null | undefined): string {
	if (!color) return '#000000';
	if (typeof color === 'string') return color;
	
	try {
		if (!color.type || color.value === undefined) return '#000000';

		switch (color.type) {
			case 'oklch': {
				const [l, c, h, a] = color.value as any[];
				return `oklch(${l ?? 0} ${c ?? 0} ${h ?? 0}${a !== undefined ? ' / ' + a : ''})`;
			}
			case 'rgb': {
				const [r, g, b, a] = color.value as any[];
				return `rgb(${r ?? 0}, ${g ?? 0}, ${b ?? 0}${a !== undefined ? ' / ' + a : ''})`;
			}
			case 'hsl': {
				const [h, s, l, a] = color.value as any[];
				return `hsl(${h ?? 0} ${s ?? 0}% ${l ?? 0}%${a !== undefined ? ' / ' + a : ''})`;
			}
			case 'hex': {
				const value = String(color.value);
				const regex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
				if (!regex.test(value)) return '#000000';
				return value;
			}
			default:
				return '#000000';
		}
	} catch (e) {
		console.warn('parseColor failed:', e);
		return '#000000';
	}
}
