import { Logger } from '@mecra/logger';

export const authLogger = new Logger('auth', {
	color: '#00D6FF',
	level: 'info'
});

export const routeLogger = new Logger('route', {
	color: '#FFAC45',
	level: 'trace'
});

export const proxyLogger = new Logger('proxy', {
	color: '#FF45A1',
	level: 'trace'
});

export const saveLogger = new Logger('save', {
	color: '#45FF7A',
	level: 'trace'
});
