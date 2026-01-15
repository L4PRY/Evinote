export const validateUsername = (username: unknown): username is string =>
	typeof username === 'string' &&
	username.length >= 3 &&
	username.length <= 31 &&
	/^[a-z0-9_-]+$/.test(username);

export const validatePassword = (password: unknown): password is string =>
	typeof password === 'string' && password.length >= 6 && password.length <= 255;

export const validateEmail = (email: unknown): email is string =>
	typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
