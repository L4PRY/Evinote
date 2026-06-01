import { eq } from 'drizzle-orm';
import { validateEmail, validatePassword, validateUsername } from '../src/lib/parseInput';
import * as auth from '../src/lib/server/auth';
import { db } from '../src/lib/server/db';
import { Board, BoardLikes, Permissions, Session, User } from '../src/lib/server/db/schema';
import type { CanvasData } from '../src/lib/types/canvas/CanvasData';
import type { NoteData, NotesRecord } from '../src/lib/types/canvas/NoteData';

type SeedUserInput = {
	username: string;
	email: string;
	password: string;
	userAgent: string;
};

const SESSION_DURATION_ONE_DAY_MS = 1000 * 60 * 60 * 24;

const defaultCanvas: CanvasData = {
	size: { width: 3200, height: 3200 },
	background: { type: 'Solid', value: { type: 'rgb', value: [255, 255, 255, 1] } },
	thumbnail: undefined
};

const mkNote = (id: string, title: string, x: number, y: number, text: string): NoteData => ({
	id,
	title,
	position: { x, y, z: 1 },
	size: { width: 280, height: 160 },
	color: { type: 'rgb', value: [255, 250, 200, 1] },
	content: [text]
});

const notesFrom = (
	...entries: [id: string, title: string, x: number, y: number, text: string][]
): NotesRecord =>
	Object.fromEntries(
		entries.map(([id, title, x, y, text]) => [id, mkNote(id, title, x, y, text)])
	) as NotesRecord;

const registerSeedUser = async ({ username, email, password, userAgent }: SeedUserInput) => {
	if (!validateUsername(username)) throw new Error(`Invalid username: ${username}`);
	if (!validateEmail(email)) throw new Error(`Invalid email: ${email}`);
	if (!validatePassword(password)) throw new Error(`Invalid password for: ${username}`);

	const existingUser = await db
		.select()
		.from(User)
		.where(eq(User.username, username))
		.then(r => r.at(0));

	if (existingUser) throw new Error(`Username already taken: ${username}`);

	const passhash = await auth.hashPassword(password);
	const user = await db
		.insert(User)
		.values({ username, passhash, email, role: 'User' })
		.returning()
		.then(r => r.at(0));

	if (!user) throw new Error(`Failed to create user: ${username}`);

	const session = await auth
		.createSession(user.id, userAgent, new Date(Date.now() + SESSION_DURATION_ONE_DAY_MS))
		.then(r => r.at(0));

	if (!session) throw new Error(`Failed to create session for: ${username}`);

	return { user, session };
};

async function seedDatabase() {
	console.log('🌱 Seeding database...');

	try {
		console.log('Clearing existing data...');
		await db.delete(BoardLikes);
		await db.delete(Permissions);
		await db.delete(Session);
		await db.delete(Board);
		await db.delete(User);

		console.log('Creating users and sessions...');
		const registrations = await Promise.all([
			registerSeedUser({
				username: 'alice',
				email: 'alice@example.com',
				password: 'AliceSeed#2026',
				userAgent: 'seed-alice-desktop'
			}),
			registerSeedUser({
				username: 'bob',
				email: 'bob@example.com',
				password: 'BobSeed#2026',
				userAgent: 'seed-bob-laptop'
			}),
			registerSeedUser({
				username: 'charlie',
				email: 'charlie@example.com',
				password: 'CharlieSeed#2026',
				userAgent: 'seed-charlie-tablet'
			}),
			registerSeedUser({
				username: 'diana',
				email: 'diana@example.com',
				password: 'DianaSeed#2026',
				userAgent: 'seed-diana-mobile'
			}),
			registerSeedUser({
				username: 'eve',
				email: 'eve@example.com',
				password: 'EveSeed#2026',
				userAgent: 'seed-eve-browser'
			})
		]);

		const [alice, bob, charlie, diana, eve] = registrations.map(({ user }) => user);
		const sessions = registrations.map(({ session }) => session);

		console.log('Creating boards with content...');
		const boards = await db
			.insert(Board)
			.values([
				{
					name: 'Open Product Roadmap',
					type: 'Public',
					owner: alice.id,
					updated: new Date(),
					canvas: defaultCanvas,
					notes: notesFrom(
						['roadmap_1', 'Q3 Goals', 120, 100, 'Ship board likes and sharing polish.'],
						['roadmap_2', 'Risks', 460, 100, 'Watch API performance under load.']
					)
				},
				{
					name: 'Invite-only Sprint Board',
					type: 'Unlisted',
					owner: bob.id,
					updated: new Date(),
					canvas: defaultCanvas,
					notes: notesFrom(
						['sprint_1', 'Sprint backlog', 120, 120, 'Finalize auth edge-case handling.'],
						['sprint_2', 'QA', 440, 120, 'Regression test board permissions.']
					)
				},
				{
					name: 'Private Architecture Notes',
					type: 'Private',
					owner: charlie.id,
					updated: new Date(),
					canvas: defaultCanvas,
					notes: notesFrom(
						['arch_1', 'DB indexes', 120, 150, 'Review board_likes query patterns.'],
						['arch_2', 'Session plan', 460, 150, 'Rotate stale sessions regularly.']
					)
				}
			])
			.returning();
		const [publicBoard, unlistedBoard, privateBoard] = boards;

		console.log('Creating contributors...');
		const permissions = await db
			.insert(Permissions)
			.values([
				{ bid: publicBoard.id, uid: bob.id, perm: 'Write' },
				{ bid: publicBoard.id, uid: charlie.id, perm: 'Read' },
				{ bid: publicBoard.id, uid: diana.id, perm: 'Write' },
				{ bid: unlistedBoard.id, uid: alice.id, perm: 'Read' },
				{ bid: unlistedBoard.id, uid: charlie.id, perm: 'Write' },
				{ bid: privateBoard.id, uid: bob.id, perm: 'Read' },
				{ bid: privateBoard.id, uid: diana.id, perm: 'Write' },
				{ bid: privateBoard.id, uid: eve.id, perm: 'Read' }
			])
			.returning();

		console.log('Creating board likes...');
		const boardLikes = await db
			.insert(BoardLikes)
			.values([
				{ board: publicBoard.id, user: bob.id },
				{ board: publicBoard.id, user: charlie.id },
				{ board: publicBoard.id, user: diana.id },
				{ board: publicBoard.id, user: eve.id },
				{ board: unlistedBoard.id, user: alice.id },
				{ board: unlistedBoard.id, user: charlie.id },
				{ board: privateBoard.id, user: bob.id },
				{ board: privateBoard.id, user: diana.id }
			])
			.returning();

		console.log('\n✅ Database seeding completed successfully!');
		console.log('\nSummary:');
		console.log(`  - Users: ${registrations.length}`);
		console.log(`  - Sessions: ${sessions.length}`);
		console.log(`  - Boards: ${boards.length}`);
		console.log(`  - Permissions: ${permissions.length}`);
		console.log(`  - Board Likes: ${boardLikes.length}`);
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
	}
}

seedDatabase()
	.then(() => process.exit(0))
	.catch(error => {
		console.error('Failed to seed database:', error);
		process.exit(1);
	});
