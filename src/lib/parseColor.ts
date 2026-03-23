import type { Color } from './types/canvas/Color';

export function parseColor(color: Color | string): string {
	if (typeof color === 'string') return color;
	if (!color.type || !color.value) throw new Error('Invalid color object');
	switch (color.type) {
		case 'oklch': {
			const [l, c, h, a] = color.value;
			return `oklch(${l} ${c} ${h}${a !== undefined ? ' / ' + a : ''})`;
		}
		case 'rgb': {
			const [r, g, b, a] = color.value;
			return `rgb(${r}, ${g}, ${b}${a !== undefined ? ' / ' + a : ''})`;
		}
		case 'hsl': {
			const [h, s, l, a] = color.value;
			return `hsl(${h} ${s}% ${l}%${a !== undefined ? ' / ' + a : ''})`;
		}
		case 'hex':
			const regex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
			if (!regex.test(color.value)) throw new Error('Invalid hex color value');
			else return color.value;
	}
}
