import { db } from '../src/lib/server/db';
import { User, Session, Board, Note, Permissions } from '../src/lib/server/db/schema';
import type { NoteData } from '../src/lib/server/db/schema';
import { hash } from '@node-rs/argon2';
import { createSession } from '../src/lib/server/auth';

// Sample password hash for "password123" - in production, use proper hashing
const samplePasshash = await hash('password123', {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
});

async function seedDatabase() {
	console.log('🌱 Seeding database with sample data...');

	try {
		// Clear existing data (in reverse order of dependencies)
		console.log('Clearing existing data...');
		await db.delete(Note);
		await db.delete(Permissions);
		await db.delete(Session);
		await db.delete(Board);
		await db.delete(User);

		// Insert Users
		console.log('Inserting users...');
		const users = await db
			.insert(User)
			.values([
				{
					username: 'alice',
					email: 'alice@example.com',
					passhash: samplePasshash,
					role: 'Admin'
				},
				{
					username: 'bob',
					email: 'bob@example.com',
					passhash: samplePasshash,
					role: 'User'
				},
				{
					username: 'charlie',
					email: 'charlie@example.com',
					passhash: samplePasshash,
					role: 'User'
				},
				{
					username: 'diana',
					email: 'diana@example.com',
					passhash: samplePasshash,
					role: 'User'
				}
			])
			.returning();

		console.log(`✓ Created ${users.length} users`);

		const [alice, bob, charlie, diana] = users;

		// Insert Sessions using createSession method
		console.log('Inserting sessions...');

		const sessionResults = await Promise.all([
			createSession(alice.id, 'Alice primary session - Desktop'),
			createSession(alice.id, 'Alice mobile session'),
			createSession(bob.id, 'Bob laptop session'),
			createSession(charlie.id, 'Charlie work computer')
		]);

		const sessions = sessionResults.filter((s: unknown) => s !== undefined).flat();

		console.log(`✓ Created ${sessions.length} sessions`);

		// Insert Boards
		console.log('Inserting boards...');
		const boards = await db
			.insert(Board)
			.values([
				{
					name: 'Project Ideas',
					owner: alice.id,
					type: 'Private',
					updated: new Date()
				},
				{
					name: 'Team Collaboration',
					owner: alice.id,
					type: 'Public',
					updated: new Date()
				},
				{
					name: 'Personal Notes',
					owner: bob.id,
					type: 'Private',
					updated: new Date()
				},
				{
					name: 'Shared Resources',
					owner: bob.id,
					type: 'Unlisted',
					updated: new Date()
				},
				{
					name: 'Meeting Notes',
					owner: charlie.id,
					type: 'Private',
					updated: new Date()
				},
				{
					name: 'Design Inspiration',
					owner: diana.id,
					type: 'Public',
					updated: new Date()
				}
			])
			.returning();

		console.log(`✓ Created ${boards.length} boards`);

		const [projectIdeas, teamCollab, personalNotes, sharedResources, meetingNotes, designBoard] =
			boards;

		// Insert Notes
		console.log('Inserting notes...');

		const sampleNotes: { bid: number; data: NoteData }[] = [
			// Notes for Project Ideas board
			{
				bid: projectIdeas.id,
				data: {
					title: 'App Feature Brainstorm',
					position: [100, 150],
					color: ['preset', 'yellow'],
					content: ['- Real-time collaboration', '- Dark mode support', '- Export to PDF']
				}
			},
			{
				bid: projectIdeas.id,
				data: {
					title: 'Technical Stack',
					position: [350, 150],
					color: ['preset', 'blue'],
					content: ['Frontend: SvelteKit', 'Backend: PostgreSQL + Drizzle', 'Deployment: Vercel']
				}
			},
			{
				bid: projectIdeas.id,
				data: {
					title: 'Timeline',
					position: [600, 150],
					color: ['preset', 'green'],
					content: ['Phase 1: MVP (2 weeks)', 'Phase 2: Beta (1 month)', 'Phase 3: Launch']
				}
			},
			// Notes for Team Collaboration board
			{
				bid: teamCollab.id,
				data: {
					title: 'Sprint Goals',
					position: [100, 100],
					color: ['preset', 'purple'],
					content: [
						'Complete user authentication',
						'Implement board sharing',
						'Add note editing features'
					]
				}
			},
			{
				bid: teamCollab.id,
				data: {
					title: 'Team Assignments',
					position: [400, 100],
					color: ['preset', 'orange'],
					content: ['Alice: Backend APIs', 'Bob: Frontend UI', 'Charlie: Testing', 'Diana: Design']
				}
			},
			// Notes for Personal Notes board
			{
				bid: personalNotes.id,
				data: {
					title: 'Shopping List',
					position: [50, 50],
					color: ['preset', 'pink'],
					content: ['Milk', 'Bread', 'Eggs', 'Coffee']
				}
			},
			{
				bid: personalNotes.id,
				data: {
					title: 'Book Recommendations',
					position: [300, 50],
					color: ['preset', 'teal'],
					content: [
						'The Pragmatic Programmer',
						'Clean Code',
						'Design Patterns',
						'System Design Interview'
					]
				}
			},
			// Notes for Shared Resources board
			{
				bid: sharedResources.id,
				data: {
					title: 'Useful Links',
					position: [100, 200],
					color: ['preset', 'cyan'],
					content: [
						'MDN Web Docs',
						'Svelte Documentation',
						'Drizzle ORM Docs',
						'TypeScript Handbook'
					]
				}
			},
			// Notes for Meeting Notes board
			{
				bid: meetingNotes.id,
				data: {
					title: 'Weekly Standup - 01/15',
					position: [100, 100],
					color: ['preset', 'yellow'],
					content: [
						'Discussed project timeline',
						'Reviewed blockers',
						'Action items assigned',
						'Next meeting: Friday'
					]
				}
			},
			{
				bid: meetingNotes.id,
				data: {
					title: 'Client Call Notes',
					position: [400, 100],
					color: ['preset', 'red'],
					content: [
						'Client requested new features',
						'Deadline moved to March',
						'Budget approved for extra resources'
					]
				}
			},
			// Notes for Design Inspiration board
			{
				bid: designBoard.id,
				data: {
					title: 'Color Palette Ideas',
					position: [150, 150],
					color: ['custom', '#FF6B6B'],
					content: [
						'Primary: #667EEA',
						'Secondary: #764BA2',
						'Accent: #FF6B6B',
						'Background: #1A1A2E'
					]
				}
			},
			{
				bid: designBoard.id,
				data: {
					title: 'Typography',
					position: [450, 150],
					color: ['custom', '#667EEA'],
					content: ['Headings: Inter Bold', 'Body: Inter Regular', 'Code: Fira Code']
				}
			},
			{
				bid: designBoard.id,
				data: {
					title: 'UI Components',
					position: [300, 350],
					color: ['custom', '#764BA2'],
					content: [
						'Buttons with rounded corners',
						'Subtle shadows',
						'Smooth transitions',
						'Glassmorphism cards'
					]
				}
			}
		];

		const notes = await db.insert(Note).values(sampleNotes).returning();

		console.log(`✓ Created ${notes.length} notes`);

		// Insert Permissions
		console.log('Inserting permissions...');
		const permissions = await db
			.insert(Permissions)
			.values([
				// Bob and Charlie can read Alice's Project Ideas board
				{ bid: projectIdeas.id, uid: bob.id, perm: 'Read' },
				{ bid: projectIdeas.id, uid: charlie.id, perm: 'Read' },
				// All team members can write to Team Collaboration board
				{ bid: teamCollab.id, uid: bob.id, perm: 'Write' },
				{ bid: teamCollab.id, uid: charlie.id, perm: 'Write' },
				{ bid: teamCollab.id, uid: diana.id, perm: 'Write' },
				// Alice can read Bob's shared resources
				{ bid: sharedResources.id, uid: alice.id, perm: 'Read' },
				{ bid: sharedResources.id, uid: charlie.id, perm: 'Write' },
				// Diana shares her design board with Alice for editing
				{ bid: designBoard.id, uid: alice.id, perm: 'Write' }
			])
			.returning();

		console.log(`✓ Created ${permissions.length} permissions`);

		console.log('\n✅ Database seeding completed successfully!');
		console.log('\nSummary:');
		console.log(`  - Users: ${users.length}`);
		console.log(`  - Sessions: ${sessions.length}`);
		console.log(`  - Boards: ${boards.length}`);
		console.log(`  - Notes: ${notes.length}`);
		console.log(`  - Permissions: ${permissions.length}`);
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
	}
}

// Run the seed function
seedDatabase()
	.then(() => {
		console.log('\n🎉 Done!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Failed to seed database:', error);
		process.exit(1);
	});
