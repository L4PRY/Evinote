import { requireLogin } from '$lib/server/auth.js';

export const GET = async ({ params }) => {
	const user = requireLogin();
};
