import { generateETag } from '$lib/cache/generateETag';
import { parseBackground } from '$lib/parseBackground.js';
import { parseColor } from '$lib/parseColor.js';
import { checkLogin } from '$lib/server/auth.js';
import { db } from '$lib/server/db/index.js';
import * as table from '$lib/server/db/schema.js';
import { routeLogger } from '$lib/server/logger.js';
import { checkBoardPerms, getBoard } from '$lib/server/perms.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import satori from 'satori';

const fonts = [
	{
		name: 'monofur',
		data: readFileSync('./static/monofur.ttf').buffer
	}
] satisfies Parameters<typeof satori>[1]['fonts'];

export const GET = async ({ params, url, request }) => {
	const { id } = params;
	const theme = (url.searchParams.get('theme') as 'light' | 'dark') ?? 'dark';
	const leftParam = url.searchParams.get('left');
	const topParam = url.searchParams.get('top');
	const zoomParam = url.searchParams.get('zoom');

	const viewportLeft = leftParam ? parseFloat(leftParam) : 0;
	const viewportTop = topParam ? parseFloat(topParam) : 0;
	const zoom = zoomParam ? parseFloat(zoomParam) : 1;

	const { board, likes } = await getBoard(id);

	if (!board) {
		throw error(404, 'Board not found');
	}

	checkBoardPerms(board);

	// Generate ETag from board data BEFORE rendering
	const etag = await generateETag(board, theme);

	const ifNoneMatch = request.headers.get('if-none-match');
	routeLogger.info(`Received request for board ${id} thumbnail with ETag: ${ifNoneMatch}`);
	routeLogger.info(`Generated ETag for board ${id}: ${etag}`);

	if (ifNoneMatch === etag) {
		routeLogger.info(`Cache hit for board ${id} thumbnail`);
		return new Response(null, {
			status: 304,
			headers: {
				ETag: etag,
				'Cache-Control': 'public, max-age=3600'
			}
		});
	}

	const { canvas, notes } = board;
	const viewportSize = { width: 600, height: 400 };

	const canvasWidth = canvas!.size.width;
	const canvasHeight = canvas!.size.height;

	if (canvasWidth === 0 || canvasHeight === 0) {
		return error(400, 'invalid canvas size');
	}

	// Calculate the zoomed canvas size
	const zoomedCanvasWidth = canvasWidth * zoom;
	const zoomedCanvasHeight = canvasHeight * zoom;

	// Create note elements for the zoomed viewport
	const noteElements = (notes || [])
		.map(note => {
			const noteLeft = note.position.x * zoom - viewportLeft * zoom;
			const noteTop = note.position.y * zoom - viewportTop * zoom;
			const noteWidth = note.size.width * zoom;
			const noteHeight = note.size.height * zoom;

			// Only render notes that are within or partially visible in the viewport
			if (
				noteLeft + noteWidth > 0 &&
				noteLeft < viewportSize.width &&
				noteTop + noteHeight > 0 &&
				noteTop < viewportSize.height
			) {
				// Extract text content from the note
				const textParts: string[] = [];
				if (note.title) {
					textParts.push(note.title);
				}
				if (note.content && Array.isArray(note.content)) {
					for (const entry of note.content) {
						if (typeof entry === 'string') {
							// Strip HTML tags for plain text display
							const plainText = entry.replace(/<[^>]*>/g, '');
							if (plainText.trim()) {
								textParts.push(plainText.trim());
							}
						}
					}
				}
				const contentText = textParts.join(' ').substring(0, 200);

				return {
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							left: `${noteLeft}px`,
							top: `${noteTop}px`,
							width: `${Math.max(6, noteWidth)}px`,
							height: `${Math.max(4, noteHeight)}px`,
							backgroundColor: parseColor(note.color),
							borderRadius: '2px',
							border: `1px solid ${parseColor(note.color)}`,
							opacity: 0.8,
							boxShadow:
								'inset 0 1px 1px rgba(255, 255, 255, 0.4), inset 0 -1px 1px rgba(0, 0, 0, 0.3), 0 0 2px rgba(0, 0, 0, 0.3)',
							zIndex: note.position.z ?? 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '2px 4px',
							overflow: 'hidden'
						}
						// MAYBE idk
						// children: contentText
						// 	? [
						// 			{
						// 				type: 'div',
						// 				props: {
						// 					style: {
						// 						display: 'flex',
						// 						flexDirection: 'column',
						// 						// align to top-left corner
						// 						alignItems: 'flex-start',
						// 						justifyContent: 'flex-start',

						// 						// fontSize: '22px',
						// 						color: 'rgba(255, 255, 255, 0.9)',
						// 						overflow: 'hidden',
						// 						textOverflow: 'ellipsis',
						// 						whiteSpace: 'nowrap',
						// 						maxWidth: '100%',
						// 						wordWrap: 'break-word',
						// 						textAlign: 'center'
						// 					},
						// 					children: textParts.map((part, index) => ({
						// 						type: 'p',
						// 						props: {
						// 							children: part,
						// 							style: {
						// 								display: 'block',
						// 								fontWeight: index === 0 ? 'bold' : 'normal',
						// 								fontSize: index === 0 ? '22px' : '18px',
						// 								color:
						// 									index === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
						// 								// overflow: 'hidden',
						// 								// textOverflow: 'ellipsis',
						// 								// whiteSpace: 'nowrap',
						// 								// maxWidth: '100%',
						// 								// wordWrap: 'break-word',
						// 								textAlign: 'left'
						// 							}
						// 						}
						// 					}))
						// 				}
						// 			}
						// 		]
						// 	: []
					}
				};
			}
			return null;
		})
		.filter(Boolean);

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					alignItems: 'flex-start',
					justifyContent: 'flex-start',
					width: `${viewportSize.width}px`,
					height: `${viewportSize.height}px`,
					borderRadius: '4px',
					overflow: 'hidden',
					position: 'relative'
				},
				children: [
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								position: 'absolute',
								width: `${zoomedCanvasWidth}px`,
								height: `${zoomedCanvasHeight}px`,
								left: `${-viewportLeft}px`,
								top: `${-viewportTop}px`,
								zoom,
								// apply background if its something extraordinaire, otherwise use theme based background
								...parseBackground(canvas!),
								borderRadius: '4px'
							},
							children: noteElements
						}
					}
				]
			}
		},
		{
			width: viewportSize.width,
			height: viewportSize.height,
			fonts
		}
	);

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=3600',
			'Last-Modified': board.updated?.toUTCString()!,
			ETag: etag
		}
	});
};
