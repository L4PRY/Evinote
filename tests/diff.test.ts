import { diffNotes } from '$lib/server/diff';
import { describe, it, expect } from 'vitest';
import type { NoteData, NotesRecord } from '$lib/types/canvas/NoteData';

describe('diffNotes', () => {
	const createMockNote = (overrides?: Partial<NoteData>): NoteData => ({
		id: '1',
		title: 'Test Note',
		position: { x: 0, y: 0, z: 0 },
		size: { width: 300, height: 300 },
		color: 'var(--default-bg-color)',
		content: [],
		...overrides
	});

	const toRecord = (notes: NoteData[]): NotesRecord => {
		const record: NotesRecord = {};
		notes.forEach(n => record[n.id] = n);
		return record;
	};

	it('should handle property creation (CREATE operation)', () => {
		const oldNotes = toRecord([createMockNote({ title: null })]);
		const newNotes = toRecord([createMockNote({ title: 'New Title' })]);

		const result = diffNotes(oldNotes, newNotes);
		const notes = Object.values(result);

		expect(notes).toHaveLength(1);
		expect(notes[0].title).toBe('New Title');
	});

	it('should handle property changes (CHANGE operation)', () => {
		const oldNotes = toRecord([createMockNote({ title: 'Old Title', color: 'var(--default-bg-color)' })]);
		const newNotes = toRecord([createMockNote({ title: 'Updated Title', color: 'var(--default-bg-color)' })]);

		const result = diffNotes(oldNotes, newNotes);
		const notes = Object.values(result);

		expect(notes).toHaveLength(1);
		expect(notes[0].title).toBe('Updated Title');
	});

	it('should handle nested property changes', () => {
		const oldNotes = toRecord([createMockNote({ position: { x: 0, y: 0, z: 0 } })]);
		const newNotes = toRecord([createMockNote({ position: { x: 100, y: 200, z: 0 } })]);

		const result = diffNotes(oldNotes, newNotes);
		const notes = Object.values(result);

		expect(notes).toHaveLength(1);
		expect(notes[0].position.x).toBe(100);
		expect(notes[0].position.y).toBe(200);
	});

	it('should handle array modifications', () => {
		const oldNotes = toRecord([createMockNote({ content: ['text1', 'text2'] })]);
		const newNotes = toRecord([createMockNote({ content: ['text1', 'text2', 'text3'] })]);

		const result = diffNotes(oldNotes, newNotes);
		const notes = Object.values(result);

		expect(notes).toHaveLength(1);
		expect(notes[0].content).toContain('text3');
		expect(notes[0].content).toHaveLength(3);
	});

	it('should handle multiple note changes', () => {
		const oldNotes = toRecord([
			createMockNote({ id: '1', title: 'Note 1' }),
			createMockNote({ id: '2', title: 'Note 2' })
		]);
		const newNotes = toRecord([
			createMockNote({ id: '1', title: 'Note 1 Updated' }),
			createMockNote({ id: '2', title: 'Note 2 Updated' })
		]);

		const result = diffNotes(oldNotes, newNotes);
		const notes = Object.values(result);

		expect(notes).toHaveLength(2);
		expect(result['1'].title).toBe('Note 1 Updated');
		expect(result['2'].title).toBe('Note 2 Updated');
	});

	it('should handle adding new notes', () => {
		const oldNotes = toRecord([createMockNote({ id: '1' })]);
		const newNotes = toRecord([createMockNote({ id: '1' }), createMockNote({ id: '2', title: 'New Note' })]);

		const result = diffNotes(oldNotes, newNotes);
		const notes = Object.values(result);

		expect(notes).toHaveLength(2);
		expect(result['2']).toBeDefined();
		expect(result['2'].title).toBe('New Note');
	});

	it('should handle removing notes', () => {
		const oldNotes = toRecord([createMockNote({ id: 'foo' }), createMockNote({ id: 'bar' })]);
		const newNotes = toRecord([createMockNote({ id: 'foo' })]);

		const result = diffNotes(oldNotes, newNotes);
		const notes = Object.values(result);

		expect(notes).toHaveLength(1);
		expect(result['foo']).toBeDefined();
		expect(result['bar']).toBeUndefined();
	});

	it('should handle complex nested changes', () => {
		const oldNotes = toRecord([
			createMockNote({
				size: { width: 300, height: 300 },
				position: { x: 0, y: 0, z: 0 }
			})
		]);
		const newNotes = toRecord([
			createMockNote({
				size: { width: 500, height: 400 },
				position: { x: 100, y: 150, z: 1 }
			})
		]);

		const result = diffNotes(oldNotes, newNotes);
		const notes = Object.values(result);

		expect(notes).toHaveLength(1);
		expect(notes[0].size.width).toBe(500);
		expect(notes[0].size.height).toBe(400);
		expect(notes[0].position.x).toBe(100);
		expect(notes[0].position.y).toBe(150);
		expect(notes[0].position.z).toBe(1);
	});

	it('should not mutate the original notes', () => {
		const oldNotes = toRecord([createMockNote({ title: 'Original' })]);
		const newNotes = toRecord([createMockNote({ title: 'Updated' })]);

		diffNotes(oldNotes, newNotes);

		expect(oldNotes['1'].title).toBe('Original');
		expect(newNotes['1'].title).toBe('Updated');
	});

	it('should gracefully handle 3 way merges (last sync wins)', () => {
		const origin = toRecord([createMockNote({ id: 'foo' })]);
		const user1 = toRecord([createMockNote({ id: 'foo' }), createMockNote({ id: 'bar' })]); // Added 'bar'
		const user2 = toRecord([createMockNote({ id: 'foo' }), createMockNote({ id: 'baz' })]); // Added 'baz'

		const merge1 = diffNotes(origin, user1); // Results in [foo, bar]
		const merge2 = diffNotes(merge1, user2); // Results in [foo, baz] (bar is removed as it's not in user2's source of truth)
		const notes = Object.values(merge2);

		expect(notes).toHaveLength(2);
		expect(merge2['foo']).toBeDefined();
		expect(merge2['bar']).toBeUndefined();
		expect(merge2['baz']).toBeDefined();
	});
});
