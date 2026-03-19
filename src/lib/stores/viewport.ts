import { writable, derived, get } from 'svelte/store';
import type { ViewportBounds } from '../types/stores/ViewportBounds';
import type { ViewportPosition } from '../types/stores/ViewportPosition';
import type { CanvasSize } from '../types/stores/CanvasSize';

// Create the stores
const createViewportBoundsStore = () => {
	const { subscribe, set, update } = writable<ViewportBounds>({
		width: 0,
		height: 0
	});

	return {
		subscribe,
		set,
		update,
		setSize: (width: number, height: number) => set({ width, height })
	};
};

const createViewportPositionStore = () => {
	const { subscribe, set, update } = writable<ViewportPosition>({
		left: 0,
		top: 0
	});

	return {
		subscribe,
		set,
		update,
		setPosition: (left: number, top: number) => set({ left, top }),
		scrollTo: (left: number, top: number) => set({ left, top }),
		scrollBy: (deltaLeft: number, deltaTop: number) => {
			update(pos => ({
				left: pos.left + deltaLeft,
				top: pos.top + deltaTop
			}));
		}
	};
};

const createCanvasSizeStore = () => {
	const { subscribe, set, update } = writable<CanvasSize>({
		width: 0,
		height: 0
	});

	return {
		subscribe,
		set,
		update,
		setSize: (width: number, height: number) => set({ width, height })
	};
};

export const bounds = createViewportBoundsStore();
export const position = createViewportPositionStore();
export const canvasSize = createCanvasSizeStore();

// Derived store that combines viewport info for the mini viewport
export const viewportInfo = derived(
	[bounds, position, canvasSize],
	([$bounds, $position, $canvas]) => ({
		// Viewport dimensions
		viewportWidth: $bounds.width,
		viewportHeight: $bounds.height,
		// Scroll position
		scrollLeft: $position.left,
		scrollTop: $position.top,
		// Canvas dimensions
		canvasWidth: $canvas.width,
		canvasHeight: $canvas.height,
		// Computed values
		maxScrollLeft: Math.max(0, $canvas.width - $bounds.width),
		maxScrollTop: Math.max(0, $canvas.height - $bounds.height),
		// Viewport position as percentage of canvas
		scrollLeftPercent: $canvas.width > 0 ? ($position.left / $canvas.width) * 100 : 0,
		scrollTopPercent: $canvas.height > 0 ? ($position.top / $canvas.height) * 100 : 0,
		// Viewport size as percentage of canvas
		viewportWidthPercent: $canvas.width > 0 ? ($bounds.width / $canvas.width) * 100 : 100,
		viewportHeightPercent: $canvas.height > 0 ? ($bounds.height / $canvas.height) * 100 : 100
	})
);

// Helper to clamp scroll position within bounds
export function clampScrollPosition(
	left: number,
	top: number,
	canvasWidth: number,
	canvasHeight: number,
	viewportWidth: number,
	viewportHeight: number
): ViewportPosition {
	return {
		left: Math.max(0, Math.min(left, canvasWidth - viewportWidth)),
		top: Math.max(0, Math.min(top, canvasHeight - viewportHeight))
	};
}

// Utility to get current values synchronously
export function getViewportInfo() {
	return get(viewportInfo);
}

export function getViewportPosition() {
	return get(position);
}

export function getViewportBounds() {
	return get(bounds);
}

export function getCanvasSize() {
	return get(canvasSize);
}
