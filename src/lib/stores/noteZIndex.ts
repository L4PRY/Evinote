import { writable } from 'svelte/store';

// Shared store to track the current maximum z-index across all notes
const maxZIndex = writable(1);

/**
 * Gets the next z-index for a note being brought to front.
 * Only increments if the note isn't already at the top.
 */
export function bringToFront(currentZ: number): number {
	let newZ = currentZ;

	maxZIndex.update(max => {
		if (currentZ < max) {
			// This note isn't at the top, so bring it to front
			newZ = max + 1;
			return newZ;
		}
		// Already at the top, no change needed
		newZ = max;
		return max;
	});

	return newZ;
}

/**
 * Resets the z-index counter. Useful when re-normalizing z-indices
 * to prevent numbers from growing indefinitely over long sessions.
 */
export function resetZIndex(baseValue: number = 1): void {
	maxZIndex.set(baseValue);
}

/**
 * Initialize the max z-index based on existing notes.
 * Call this when loading a board with existing notes.
 */
export function initializeZIndex(notes: { position: { z: number } }[]): void {
	const maxZ = notes.reduce((max, note) => Math.max(max, note.position.z), 1);
	maxZIndex.set(maxZ);
}

export { maxZIndex };
