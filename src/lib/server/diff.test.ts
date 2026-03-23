import { diffNotes } from './diff';
import { describe, it, expect, vi } from 'vitest';
import type { NoteData } from '$lib/types/canvas/NoteData';

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

	it('should handle property creation (CREATE operation)', () => {
		const oldNotes = [createMockNote({ title: null })];
		const newNotes = [createMockNote({ title: 'New Title' })];

		const result = diffNotes(oldNotes, newNotes);

		expect(result).toHaveLength(1);
		expect(result[0].title).toBe('New Title');
	});

	it('should handle property changes (CHANGE operation)', () => {
		const oldNotes = [createMockNote({ title: 'Old Title', color: 'var(--default-bg-color)' })];
		const newNotes = [createMockNote({ title: 'Updated Title', color: 'var(--default-bg-color)' })];

		const result = diffNotes(oldNotes, newNotes);

		expect(result).toHaveLength(1);
		expect(result[0].title).toBe('Updated Title');
	});

	it('should handle nested property changes', () => {
		const oldNotes = [createMockNote({ position: { x: 0, y: 0, z: 0 } })];
		const newNotes = [createMockNote({ position: { x: 100, y: 200, z: 0 } })];

		const result = diffNotes(oldNotes, newNotes);

		expect(result).toHaveLength(1);
		expect(result[0].position.x).toBe(100);
		expect(result[0].position.y).toBe(200);
	});

	it('should handle array modifications', () => {
		const oldNotes = [createMockNote({ content: ['text1', 'text2'] })];
		const newNotes = [createMockNote({ content: ['text1', 'text2', 'text3'] })];

		const result = diffNotes(oldNotes, newNotes);

		expect(result).toHaveLength(1);
		expect(result[0].content).toContain('text3');
		expect(result[0].content).toHaveLength(3);
	});

	it('should handle multiple note changes', () => {
		const oldNotes = [
			createMockNote({ id: '1', title: 'Note 1' }),
			createMockNote({ id: '2', title: 'Note 2' })
		];
		const newNotes = [
			createMockNote({ id: '1', title: 'Note 1 Updated' }),
			createMockNote({ id: '2', title: 'Note 2 Updated' })
		];

		const result = diffNotes(oldNotes, newNotes);

		expect(result).toHaveLength(2);
		expect(result[0].title).toBe('Note 1 Updated');
		expect(result[1].title).toBe('Note 2 Updated');
	});

	it('should handle adding new notes', () => {
		const oldNotes = [createMockNote({ id: '1' })];
		const newNotes = [createMockNote({ id: '1' }), createMockNote({ id: '2', title: 'New Note' })];

		const result = diffNotes(oldNotes, newNotes);

		expect(result).toHaveLength(2);
		expect(result[1].id).toBe('2');
		expect(result[1].title).toBe('New Note');
	});

	it('should handle removing notes', () => {
		const oldNotes = [createMockNote({ id: 'foo' }), createMockNote({ id: 'bar' })];
		const newNotes = [createMockNote({ id: 'foo' })];

		const result = diffNotes(oldNotes, newNotes);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('foo');
	});

	it('should handle complex nested changes', () => {
		const oldNotes = [
			createMockNote({
				size: { width: 300, height: 300 },
				position: { x: 0, y: 0, z: 0 }
			})
		];
		const newNotes = [
			createMockNote({
				size: { width: 500, height: 400 },
				position: { x: 100, y: 150, z: 1 }
			})
		];

		const result = diffNotes(oldNotes, newNotes);

		expect(result).toHaveLength(1);
		expect(result[0].size.width).toBe(500);
		expect(result[0].size.height).toBe(400);
		expect(result[0].position.x).toBe(100);
		expect(result[0].position.y).toBe(150);
		expect(result[0].position.z).toBe(1);
	});

	it('should not mutate the original notes', () => {
		const oldNotes = [createMockNote({ title: 'Original' })];
		const newNotes = [createMockNote({ title: 'Updated' })];

		diffNotes(oldNotes, newNotes);

		expect(oldNotes[0].title).toBe('Original');
		expect(newNotes[0].title).toBe('Updated');
	});

	it('should gracefully handle 3 way merges', () => {
		// the board has a common origin (eg 1 note with the id of 'foo')
		// a person adds another note with the id of 'foo', then saves it
		// then a new person, who hasn't had their changes update yet,
		// adds another note called 'baz'
		// in the end there should be 3 notes with [foo, bar, baz]

		const origin = [createMockNote({ id: 'foo' })];
		const user1 = [createMockNote({ id: 'foo' }), createMockNote({ id: 'bar' })];
		const user2 = [createMockNote({ id: 'foo' }), createMockNote({ id: 'baz' })];

		const merge1 = diffNotes(origin, user1);
		const merge2 = diffNotes(merge1, user2);

		expect(merge2).toHaveLength(3);
		expect(merge2.find(note => note.id === 'foo')).toBeDefined();
		expect(merge2.find(note => note.id === 'bar')).toBeDefined();
		expect(merge2.find(note => note.id === 'baz')).toBeDefined();
	});
});
