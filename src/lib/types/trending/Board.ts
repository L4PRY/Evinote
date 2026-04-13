export type Board = {
	id: number;
	title: string;
	type: 'public' | 'private';
	updated: string;
	likes: number;
	liked?: boolean;
	username: string;
};
