import { writable } from 'svelte/store';

export const MIN_ZOOM = 0.55;
export const MAX_ZOOM = 2;
export const DEFAULT_ZOOM = 1;
export const STEP = 0.1;

const currentZoom = writable(DEFAULT_ZOOM);

function set(value: number) {
	const clampedValue = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
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
		return Math.max(MIN_ZOOM, newValue);
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
