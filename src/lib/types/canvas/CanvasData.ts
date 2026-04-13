//! NOT FINAL VERSION!!!
import type { Color } from './Color';
import type { File } from './File';
import type { Grid } from './Grid';

export type CanvasData = {
	thumbnail: File | undefined;
	background:
		| { type: 'Image'; value: URL } // background imageuh
		| { type: 'Solid'; value: Color } // solid color
		| { type: 'Grid'; value: Grid } // dotted or line grid type shi
		| { type: 'Custom'; value: string }; // custom css background
	size: { width: number; height: number }; // zoom has been moved to a store
};
