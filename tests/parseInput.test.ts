import { validateEmail, validatePassword, validateUrl, validateUsername } from '$lib/parseInput';
import { describe, it, expect } from 'vitest';

describe('validateEmail', () => {
	it('should validate correct email addresses', () => {
		expect(validateEmail('test@example.com')).toBe(true);
	});

	it('should invalidate incorrect email addresses', () => {
		expect(validateEmail('testexample.com')).toBe(false);
		expect(validateEmail('test@.com')).toBe(false);
		expect(validateEmail('test@com')).toBe(false);
		expect(validateEmail('')).toBe(false);
	});

	it('should validate correct passwords', () => {
		expect(validatePassword('Password123!')).toBe(true);
		expect(validatePassword('password')).toBe(true);
		expect(validatePassword('PASSWORD123')).toBe(true);
		expect(validatePassword('Pass123')).toBe(true);
	});

	it('should invalidate incorrect passwords', () => {
		expect(validatePassword('')).toBe(false);
	});

	it('should validate correct URLs', () => {
		expect(validateUrl('https://www.example.com')).toBe(true);
		expect(validateUrl('http://example.com')).toBe(true);
		expect(validateUrl('http://example.com/file.png')).toBe(true);
		expect(validateUrl('https://example.com/file.png')).toBe(true);
	});

	it('should invalidate incorrect URLs', () => {
		expect(validateUrl('htp://example.com')).toBe(false);
		expect(validateUrl('example')).toBe(false);
		expect(validateUrl('')).toBe(false);
	});

	it('should validate correct usernames', () => {
		expect(validateUsername('user_name123')).toBe(true);
		expect(validateUsername('username')).toBe(true);
	});

	it('should invalidate incorrect usernames', () => {
		expect(validateUsername('user name')).toBe(false);
		expect(validateUsername('user-name')).toBe(false);
		expect(validateUsername('user.name')).toBe(false);
		expect(validateUsername('')).toBe(false);
	});
});
