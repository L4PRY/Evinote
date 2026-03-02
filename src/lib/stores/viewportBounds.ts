import { writable } from 'svelte/store';

// store current size of the visible part of the canvas (viewport)
// store the position from the top left part of the canvas to the top right part of the viewport

export const viewportBounds = writable({
	width: 0,
	height: 0
});

export const viewportPosition = writable({
	x: 0,
	y: 0
});

function updateViewportBounds(width: number, height: number) {
	viewportBounds.set({ width, height });
}

function updateViewportPosition(x: number, y: number) {
	viewportPosition.set({ x, y });
}
