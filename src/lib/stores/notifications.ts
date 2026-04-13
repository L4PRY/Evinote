import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	title: string;
	message?: string;
	type?: 'info' | 'success' | 'warning' | 'error';
	duration?: number;
}

const { subscribe, update } = writable<Toast[]>([]);

export const notifications = {
	subscribe,
	add: (toast: Omit<Toast, 'id'>) => {
		const id = crypto.randomUUID();
		const duration = toast.duration || 5000;
		const newToast = { ...toast, id, duration, type: toast.type || 'info' };
		
		update((all) => {
			const next = [...all, newToast];
			// Fade out modals after 5 instances
			if (next.length > 5) {
				return next.slice(next.length - 5);
			}
			return next;
		});

		setTimeout(() => {
			notifications.remove(id);
		}, duration);
	},
	remove: (id: string) => {
		update((all) => all.filter((t) => t.id !== id));
	}
};
