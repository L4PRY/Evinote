export type Color =
	| { type: 'hex'; value: string }
	| { type: 'rgb'; value: [r: number, g: number, b: number, a?: number] }
	| { type: 'hsl'; value: [h: number, s: number, l: number, a?: number] }
	| { type: 'oklch'; value: [l: number, c: number, h: number, a?: number] };
