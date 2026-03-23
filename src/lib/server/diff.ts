import type { NoteData } from '$lib/types/canvas/NoteData';
import diff from 'microdiff';
import { saveLogger } from './logger';

export function diffNotes(oldNotes: NoteData[], newNotes: NoteData[]) {
	saveLogger.info('Calculating differences between old and new notes', {
		oldNotes,
		newNotes
	});

	const differences = diff(oldNotes, newNotes);

	// Find indices that microdiff explicitly considers "removed"
	// This happens when the new array is shorter and an item is missing.
	// If an item is replaced by another (e.g., id changes), microdiff reports a CHANGE, not a REMOVE at the root level.
	const removedIndices = new Set<number>();
	for (const d of differences) {
		if (d.type === 'REMOVE' && d.path.length === 1 && typeof d.path[0] === 'number') {
			removedIndices.add(d.path[0]);
		}
	}

	const explicitlyRemovedIds = new Set<string>();
	for (const idx of removedIndices) {
		if (oldNotes[idx]) {
			explicitlyRemovedIds.add(oldNotes[idx].id);
		}
	}

	const mergedNotes: NoteData[] = [];
	const mergedMap = new Map<string, number>();

	// Preserve old notes that were not explicitly removed
	for (let i = 0; i < oldNotes.length; i++) {
		const oldNote = oldNotes[i];
		if (!explicitlyRemovedIds.has(oldNote.id)) {
			const copied = JSON.parse(JSON.stringify(oldNote));
			mergedNotes.push(copied);
			mergedMap.set(copied.id, mergedNotes.length - 1);
		}
	}

	// Apply updates and additions from newNotes
	for (const newNote of newNotes) {
		const noteId = newNote.id;

		if (mergedMap.has(noteId)) {
			// Update existing note with new values
			const index = mergedMap.get(noteId)!;
			mergedNotes[index] = JSON.parse(JSON.stringify(newNote));
		} else {
			// Add completely new note
			const copied = JSON.parse(JSON.stringify(newNote));
			mergedNotes.push(copied);
			mergedMap.set(copied.id, mergedNotes.length - 1);
		}
	}

	saveLogger.info('Merged notes after applying differences', {
		mergedNotes
	});

	return mergedNotes;
}
