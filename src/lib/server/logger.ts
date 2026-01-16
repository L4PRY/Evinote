import { Logger } from '@mecra/logger';

export const authLogger = new Logger('auth', {
	color: '#00D6FF',
	level: 'info'
});

export const routeLogger = new Logger('route', {
	color: '#FFAC45',
	level: 'trace'
});
