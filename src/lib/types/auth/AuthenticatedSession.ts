import type { validateSessionToken } from '../../server/auth';

export type AuthenticatedSession = NonNullable<
	Awaited<ReturnType<typeof validateSessionToken>>['session']
>;
