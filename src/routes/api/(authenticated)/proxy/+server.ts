// certain files require to be proxied to be able to be loaded by the client because of some cors issues on the client due not being able to load foreign data
// this would also stop the client from needing to reach out to the home server for the resources, thus exposing their ip address
// url schema should be /api/proxy?url=<file_url>

import { proxyLogger } from '$lib/server/logger';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const fileUrl = url.searchParams.get('url');
	if (!fileUrl) {
		return new Response('Missing url parameter', { status: 400 });
	}

	try {
		const response = await fetch(fileUrl, {
			headers: {
				'User-Agent': 'curl/7.54.1', // Set a custom User-Agent
				'Accept-Encoding': 'gzip, deflate, br' // Accept compressed responses
			}
		});
		if (!response.ok) {
			return new Response('Failed to fetch the file', { status: response.status });
		}

		const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
		const blob = await response.blob();
		return new Response(blob, { headers: { 'Content-Type': contentType } });
	} catch (error) {
		proxyLogger.error('Error fetching the file: ', error);
		return new Response('Error fetching the file: ', { status: 500 });
	}
};

export const HEAD = GET;
