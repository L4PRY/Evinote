import type { NoteData, NotesRecord } from '$lib/types/canvas/NoteData';
import { saveLogger } from './logger';

export function diffNotes(oldNotes: NotesRecord, newNotes: NotesRecord): NotesRecord {
	// If old notes was an array (migration case)
	if (Array.isArray(oldNotes)) {
		const tempRecord: NotesRecord = {};
		oldNotes.forEach(n => (tempRecord[n.id] = n));
		oldNotes = tempRecord;
	}

	const mergedNotes: NotesRecord = {};

	// First, preserve all notes from oldNotes
	for (const id in oldNotes) {
		mergedNotes[id] = JSON.parse(JSON.stringify(oldNotes[id]));
	}

	// Then, apply updates and additions from newNotes
	for (const id in newNotes) {
		// add case for if note exists in oldNotes with value, but in newNotes the value is undefined
		if (newNotes[id] === undefined) {
			delete mergedNotes[id];
		} else {
			mergedNotes[id] = JSON.parse(JSON.stringify(newNotes[id]));
		}
	}

	saveLogger.info('Merged notes record after applying changes', {
		count: Object.keys(mergedNotes).length
	});

	// cleanup all keys that are null values
	for (const id in mergedNotes) {
		for (const key in mergedNotes[id]) {
			if (mergedNotes[id] === null) {
				delete mergedNotes[id][key];
			}
		}
	}

	return mergedNotes;
}
