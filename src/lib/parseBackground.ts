import { parseColor } from './parseColor';
import type { CanvasData } from './types/canvas/CanvasData';
import { dev } from '$app/environment';
import type { Color } from './types/canvas/Color';

export function parseBackground(canvas: CanvasData) {
	switch (canvas.background.type) {
		case 'Image':
			// if (!dev)
			return {
				backgroundImage: `url(${canvas.background.value.toString()})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat'
			};
		case 'Solid':
			return {
				backgroundColor: parseColor(canvas.background.value)
			};
		case 'Grid': {
			const grid = canvas.background.value;
			const gridColor = parseColor(grid.color);
			const backgroundColor = parseColor(grid.background);
			if (grid.type === 'Dot') {
				// Create a dotted grid pattern using radial gradients
				const size = grid.size;
				const spacing = size * 10; // spacing between dots
				return {
					backgroundImage: `radial-gradient(circle, ${gridColor} ${size}px, transparent ${size}px)`,
					backgroundSize: `${spacing}px ${spacing}px`,
					backgroundPosition: '0 0',
					backgroundColor
				};
			} else {
				// Line grid pattern using linear gradients
				const width = grid.width;
				const spacing = width * 20; // spacing between lines
				return {
					backgroundImage: `
							linear-gradient(to right, ${gridColor} ${width}px, transparent ${width}px),
							linear-gradient(to bottom, ${gridColor} ${width}px, transparent ${width}px)
						`,
					backgroundSize: `${spacing}px ${spacing}px`,
					backgroundPosition: '0 0',
					backgroundColor
				};
			}
		}
		case 'Custom':
			// Custom CSS background - parse as raw CSS value
			return {
				background: canvas.background.value
			};
		default:
			return {};
	}
}

export const parseBackgroundCss = (background: ReturnType<typeof parseBackground>) =>
	Object.entries(background)
		.map(([key, value]) => {
			// Convert camelCase to kebab-case
			const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			return `${cssKey}: ${value}`;
		})
		.join('; ');
