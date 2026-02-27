import type { Color } from './types/Color';

export function parseColor(color: Color): string {
	switch (color.type) {
		case 'oklch': {
			const [l, c, h, a] = color.value;
			return `oklch(${l}% ${c} ${h}deg ${a ? '/ ' + a : ''})`;
		}
		case 'rgb': {
			const [r, g, b, a] = color.value;
			return `rgb(${r}, ${g}, ${b} ${a ? '/ ' + a : ''})`;
		}
		case 'hsl': {
			const [h, s, l, a] = color.value;
			return `hsl(${h} ${s}% ${l}%) ${a ? '/ ' + a : ''}`;
		}
		case 'hex':
			return color.value;
	}
}
