import type { Color } from './Color';

export type Grid =
	| { type: 'Line'; background: Color; width: number; color: Color }
	| { type: 'Dot'; background: Color; size: number; color: Color };
