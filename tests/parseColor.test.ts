import { parseColor } from '$lib/parseColor';
import type { Color } from '$lib/types/canvas/Color';
import { describe, it, expect } from 'vitest';

describe('should parse colours into proper CSS values', () => {
	it('should parse hex colors', () => {
		const hexColor = { type: 'hex' as const, value: '#FF5733' };
		expect(parseColor(hexColor)).toBe('#FF5733');

		const hexColor2 = { type: 'hex' as const, value: '#000000' };
		expect(parseColor(hexColor2)).toBe('#000000');

		const hexColor3 = { type: 'hex' as const, value: '#FFFFFF' };
		expect(parseColor(hexColor3)).toBe('#FFFFFF');
	});

	it('should parse rgb colors with transparency', () => {
		const rgbColor: Color = { type: 'rgb' as const, value: [255, 100, 50] };
		expect(parseColor(rgbColor)).toBe('rgb(255, 100, 50)');

		const rgbColorWithAlpha: Color = { type: 'rgb' as const, value: [255, 100, 50, 0.5] };
		expect(parseColor(rgbColorWithAlpha)).toBe('rgb(255, 100, 50 / 0.5)');

		const rgbColorFullAlpha: Color = { type: 'rgb' as const, value: [0, 128, 255, 1] };
		expect(parseColor(rgbColorFullAlpha)).toBe('rgb(0, 128, 255 / 1)');
	});

	it('should parse hsl colors with transparency', () => {
		const hslColor: Color = { type: 'hsl' as const, value: [120, 100, 50] };
		expect(parseColor(hslColor)).toBe('hsl(120 100% 50%)');

		const hslColorWithAlpha: Color = { type: 'hsl' as const, value: [240, 100, 50, 0.75] };
		expect(parseColor(hslColorWithAlpha)).toBe('hsl(240 100% 50% / 0.75)');

		const hslColorZeroAlpha: Color = { type: 'hsl' as const, value: [0, 0, 0, 0] };
		expect(parseColor(hslColorZeroAlpha)).toBe('hsl(0 0% 0% / 0)');
	});

	it('should parse oklch colors with transparency', () => {
		const oklchColor: Color = { type: 'oklch' as const, value: [0.5, 0.1, 120] };
		expect(parseColor(oklchColor)).toBe('oklch(0.5 0.1 120)');

		const oklchColorWithAlpha: Color = { type: 'oklch' as const, value: [0.7, 0.15, 240, 0.8] };
		expect(parseColor(oklchColorWithAlpha)).toBe('oklch(0.7 0.15 240 / 0.8)');

		const oklchColorFullOpacity: Color = { type: 'oklch' as const, value: [1, 0.3, 0, 1] };
		expect(parseColor(oklchColorFullOpacity)).toBe('oklch(1 0.3 0 / 1)');
	});

	it('should pass through string colors unchanged', () => {
		expect(parseColor('red')).toBe('red');
		expect(parseColor('blue')).toBe('blue');
		expect(parseColor('rgba(255, 0, 0, 0.5)')).toBe('rgba(255, 0, 0, 0.5)');
		expect(parseColor('var(--primary-color)')).toBe('var(--primary-color)');
	});

	it('should return default for invalid color objects', () => {
		const invalidColor = { type: 'hex' } as any;
		expect(parseColor(invalidColor)).toBe('#000000');

		const noType = { value: '#FF0000' } as any;
		expect(parseColor(noType)).toBe('#000000');

		const noValue = { type: 'rgb' } as any;
		expect(parseColor(noValue)).toBe('#000000');
	});

	it('should return default for invalid hex color values', () => {
		const invalidHexColor = { type: 'hex' as const, value: 'FF5733' };
		console.log(parseColor(invalidHexColor));
		expect(parseColor(invalidHexColor)).toBe('#000000');
	});
});
