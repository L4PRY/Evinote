import type { NoteData, NotesRecord } from '$lib/types/canvas/NoteData';
import diff from 'microdiff';
import { saveLogger } from './logger';

export function diffNotes(oldNotes: NotesRecord, newNotes: NotesRecord): NotesRecord {
	// If old notes was an array (migration case)
	if (Array.isArray(oldNotes)) {
		const tempRecord: NotesRecord = {};
		oldNotes.forEach(n => tempRecord[n.id] = n);
		oldNotes = tempRecord;
	}

	const differences = diff(oldNotes, newNotes);

	saveLogger.info('Calculating differences between old and new notes record', differences);

	// With records, we can just return newNotes if we trust the client's state,
	// but the current diffNotes logic seems to want to "merge" them carefully.
	// Since keys (IDs) are stable, we can just iterate the newNotes.
	
	const mergedNotes: NotesRecord = {};

	// In a key-value system, if the user sends a record, it usually represents 
	// the desired state of ALL notes. 
	// If we want to be safe and preserve things not mentioned (though unlikely in this app),
	// we'd merge. But usually, missing key = deleted.
	
	// Let's stick to the principle of "newNotes is the source of truth" 
	// but keeping the logging/diffing for visibility.

	for (const id in newNotes) {
		mergedNotes[id] = JSON.parse(JSON.stringify(newNotes[id]));
	}

	saveLogger.info('Merged notes record after applying changes', {
		count: Object.keys(mergedNotes).length
	});

	return mergedNotes;
}
