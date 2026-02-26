//! NOT FINAL VERSION!!!
import type { Color } from './Color';

export type CanvasData = {
	background:
		| { type: 'Image'; value: 'URL' }
		| { type: 'Solid'; value: Color }
		| { type: 'Grid'; value: { gridSize: number; gridColor: Color } }
		| { type: 'Custom'; value: string };
	size: { width: number; height: number; zoom: number };
};
