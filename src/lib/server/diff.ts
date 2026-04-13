import type { NoteData, NotesRecord } from '$lib/types/canvas/NoteData';
import diff from 'microdiff';
import { saveLogger } from './logger';

export function diffNotes(oldNotes: NotesRecord, newNotes: NotesRecord): NotesRecord {
	// If old notes was an array (migration case)
	if (Array.isArray(oldNotes)) {
		const tempRecord: NotesRecord = {};
		oldNotes.forEach(n => (tempRecord[n.id] = n));
		oldNotes = tempRecord;
	}

	const differences = diff(oldNotes, newNotes);

	console.log(
		'Calculating differences between old and new notes record',
		differences.map(d => ({
			type: d.type,
			path: d.path
		}))
	);

	// For 3-way merges: start with oldNotes, then apply updates from newNotes
	const mergedNotes: NotesRecord = {};

	// First, preserve all notes from oldNotes
	for (const id in oldNotes) {
		mergedNotes[id] = JSON.parse(JSON.stringify(oldNotes[id]));
	}

	// Then, apply/override with updates from newNotes
	for (const id in newNotes) {
		if (oldNotes[id]) {
			// If the note exists in both, we need to check if there are differences
			const noteDiffs = differences.filter(d => d.path[0] === id);
			if (noteDiffs.length > 0) {
				// If there are differences, we need to apply them to the old note
				mergedNotes[id] = JSON.parse(JSON.stringify(oldNotes[id])); // Start with old note
				for (const diffItem of noteDiffs) {
					const [_, ...path] = diffItem.path; // Remove the note ID from the path
					let target: any = mergedNotes[id];
					for (let i = 0; i < path.length - 1; i++) {
						target = target[path[i]];
					}
					const lastKey = path[path.length - 1];
					if (diffItem.type === 'CREATE' || diffItem.type === 'CHANGE') {
						target[lastKey] = JSON.parse(JSON.stringify(diffItem.value));
					} else if (diffItem.type === 'REMOVE') {
						delete target[lastKey];
					}
				}
			} else {
				// If there are no differences, just keep the old note
				mergedNotes[id] = JSON.parse(JSON.stringify(oldNotes[id]));
			}
		} else {
			// If the note is new, add it directly
			mergedNotes[id] = JSON.parse(JSON.stringify(newNotes[id]));
		}
		// mergedNotes[id] = JSON.parse(JSON.stringify(newNotes[id]));
	}

	saveLogger.info('Merged notes record after applying changes', {
		count: Object.keys(mergedNotes).length
	});

	return mergedNotes;
}
