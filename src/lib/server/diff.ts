import type { NoteData } from '$lib/types/canvas/NoteData';
import diff from 'microdiff';
import { saveLogger } from './logger';

/**
 * Helper function to set a value at a given path in an object
 */
function setAtPath(obj: any, path: (string | number)[], value: any): void {
	let current = obj;
	for (let i = 0; i < path.length - 1; i++) {
		const key = path[i];
		if (!(key in current)) {
			current[key] = typeof path[i + 1] === 'number' ? [] : {};
		}
		current = current[key];
	}
	current[path[path.length - 1]] = value;
}

/**
 * Helper function to delete a value at a given path in an object
 */
function deleteAtPath(obj: any, path: (string | number)[]): void {
	let current = obj;
	for (let i = 0; i < path.length - 1; i++) {
		const key = path[i];
		current = current[key];
	}
	delete current[path[path.length - 1]];
}

export function diffNotes(oldNotes: NoteData[], newNotes: NoteData[]) {
	const differences = diff(oldNotes, newNotes);

	saveLogger.info('Calculating differences between old and new notes', {
		differences
	});

	const mergedNotes = [...oldNotes];

	for (const difference of differences) {
		switch (difference.type) {
			case 'CREATE':
				setAtPath(mergedNotes, difference.path, difference.value);
				break;
			case 'REMOVE':
				deleteAtPath(mergedNotes, difference.path);
				break;
			case 'CHANGE':
				setAtPath(mergedNotes, difference.path, difference.value);
				break;
		}
	}

	saveLogger.info('Merged notes after applying differences', {
		mergedNotes
	});

	return mergedNotes;
}
