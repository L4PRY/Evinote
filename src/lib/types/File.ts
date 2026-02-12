import type { MIMEType } from 'util';

export type File = {
	mime: MIMEType | string;
	location: URL | string;
};
