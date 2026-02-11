//! NOT FINAL VERSION!!!

export type BoardData = {
	background: {
		type: 'Grid' | 'Image' | 'Custom' | 'Solid';
		value: URL | string | number[];
	};
	version: number;
};
