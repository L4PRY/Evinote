import { requireLogin } from '$lib/server/auth';

export const load = async () => {
	const user = requireLogin();
	return { user };
};
