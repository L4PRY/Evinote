import { writable, derived, get } from 'svelte/store';
import { bounds, canvasSize } from './viewport';

export const MAX_ZOOM = 2;
export const DEFAULT_ZOOM = 1;
export const STEP = 0.1;

export const minZoom = derived([bounds, canvasSize], ([$bounds, $canvas]) => {
	if (!$bounds.width || !$canvas.width) return 0.55;
	const minX = $bounds.width / $canvas.width;
	const minY = $bounds.height / $canvas.height;
	return Math.max(minX, minY);
});

const currentZoom = writable(DEFAULT_ZOOM);

function getMinZoom() {
	return get(minZoom);
}

function set(value: number) {
	const clampedValue = Math.min(MAX_ZOOM, Math.max(getMinZoom(), value));
	currentZoom.set(clampedValue);
}

function increment() {
	currentZoom.update(value => {
		const newValue = Math.round((value + STEP) * 10) / 10;
		return Math.min(MAX_ZOOM, newValue);
	});
}

function decrement() {
	currentZoom.update(value => {
		const newValue = Math.round((value - STEP) * 10) / 10;
		return Math.max(getMinZoom(), newValue);
	});
}

function reset() {
	currentZoom.set(DEFAULT_ZOOM);
}

export const zoomLevel = {
	subscribe: currentZoom.subscribe,
	set,
	increment,
	decrement,
	reset
};
