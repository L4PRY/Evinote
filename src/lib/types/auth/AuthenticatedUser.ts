import type { validateSessionToken } from '../../server/auth';

export type AuthenticatedUser = NonNullable<
	Awaited<ReturnType<typeof validateSessionToken>>['user']
>;
