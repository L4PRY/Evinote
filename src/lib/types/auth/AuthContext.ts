import type { AuthenticatedSession } from './AuthenticatedSession';
import type { AuthenticatedUser } from './AuthenticatedUser';

export type AuthContext = {
	user: AuthenticatedUser;
	session: AuthenticatedSession;
};
