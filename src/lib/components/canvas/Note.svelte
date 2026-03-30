<script lang="ts">
	import type { NoteData } from '$lib/types/canvas/NoteData';
	import type { File } from '$lib/types/canvas/File';
	import { bringToFront, initializeZIndex } from '$lib/stores/noteZIndex';
	import { parseColor } from '$lib/parseColor';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import { onMount } from 'svelte';
	import { zoomLevel } from '$lib/stores/zoomLevel';
	import { canvasSize } from '$lib/stores/viewport';

	let { data = $bindable(), remove, gridSnap = 5 }: { data: NoteData; remove: () => void; gridSnap?: number } = $props();
	
	const MIN_WIDTH = 150;
	const MAX_WIDTH = 800;
	const MIN_HEIGHT = 100;
	const MAX_HEIGHT = 800;

	let note: HTMLDivElement;

	// Capture initial position as static value for position plugin (non-reactive)
	const initialPosition = { x: data.position?.x ?? 0, y: data.position?.y ?? 0 };

	let notePosition = $state(data.position ?? { x: 0, y: 0, z: 1 });
	let noteSize = $state(data.size ?? { width: 200, height: 200 });
	let color = $state('var(--default-bg-color)');
	let isCurrentlyDragging = $state(false);

	let sanitizedContent = $derived(
		data.content?.map(entry =>
			// entry
			typeof entry === 'string'
				? DOMPurify.sanitize(entry, {
						ALLOWED_TAGS: ['code', 'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li']
					})
				: entry
		)
	);

	$effect(() => {
		// set colors
		if (typeof data.color !== 'string') color = parseColor(data.color);
	});

	function dragNote(node: HTMLElement) {
		let isDragging = false;
		let startClientX = 0;
		let startClientY = 0;
		let startNoteX = 0;
		let startNoteY = 0;

		function onPointerDown(e: PointerEvent) {
			const handle = node.querySelector('.handle');
			if (!handle || !handle.contains(e.target as Node)) return;
			if (e.button !== 0) return;

			isDragging = true;
			isCurrentlyDragging = true;
			startClientX = e.clientX;
			startClientY = e.clientY;
			startNoteX = notePosition.x;
			startNoteY = notePosition.y;

			node.setPointerCapture(e.pointerId);

			const z = bringToFront(notePosition.z);
			notePosition = { ...notePosition, z };
			data = { ...data, position: notePosition };
			e.preventDefault();
		}

		function onPointerMove(e: PointerEvent) {
			if (!isDragging) return;

			const physicalDx = e.clientX - startClientX;
			const physicalDy = e.clientY - startClientY;

			let newX = startNoteX + physicalDx / $zoomLevel;
			let newY = startNoteY + physicalDy / $zoomLevel;

			newX = Math.round(newX / gridSnap) * gridSnap;
			newY = Math.round(newY / gridSnap) * gridSnap;

			const w = Math.max(0, $canvasSize.width - node.offsetWidth);
			const h = Math.max(0, $canvasSize.height - node.offsetHeight);

			newX = Math.max(0, Math.min(newX, w));
			newY = Math.max(0, Math.min(newY, h));

			notePosition = { x: newX, y: newY, z: notePosition.z };
			data = { ...data, position: notePosition };
		}

		function onPointerUp(e: PointerEvent) {
			if (!isDragging) return;
			isDragging = false;
			isCurrentlyDragging = false;
			node.releasePointerCapture(e.pointerId);
		}

		node.addEventListener('pointerdown', onPointerDown);
		node.addEventListener('pointermove', onPointerMove);
		node.addEventListener('pointerup', onPointerUp);
		node.addEventListener('pointercancel', onPointerUp);

		return {
			destroy() {
				node.removeEventListener('pointerdown', onPointerDown);
				node.removeEventListener('pointermove', onPointerMove);
				node.removeEventListener('pointerup', onPointerUp);
				node.removeEventListener('pointercancel', onPointerUp);
			}
		};
	}
	function resizeNote(node: HTMLElement, direction: string) {
		let isResizing = false;
		let startClientX = 0;
		let startClientY = 0;
		let startWidth = 0;
		let startHeight = 0;
		let startX = 0;
		let startY = 0;

		function onPointerDown(e: PointerEvent) {
			if (e.button !== 0) return;
			isResizing = true;
			startClientX = e.clientX;
			startClientY = e.clientY;
			startWidth = noteSize.width;
			startHeight = noteSize.height;
			startX = notePosition.x;
			startY = notePosition.y;

			node.setPointerCapture(e.pointerId);
			e.stopPropagation();
			e.preventDefault();
		}

		function onPointerMove(e: PointerEvent) {
			if (!isResizing) return;

			const dx = (e.clientX - startClientX) / $zoomLevel;
			const dy = (e.clientY - startClientY) / $zoomLevel;

			let newWidth = startWidth;
			let newHeight = startHeight;
			let newX = startX;
			let newY = startY;

			// Horizontal resizing logic
			if (direction.includes('e')) {
				newWidth = Math.max(MIN_WIDTH, Math.min(startWidth + dx, MAX_WIDTH));
			} else if (direction.includes('w')) {
				const maxDx = startWidth - MIN_WIDTH;
				const clampedDx = Math.min(dx, maxDx);
				const potentialWidth = startWidth - clampedDx;
				
				if (potentialWidth > MAX_WIDTH) {
					const excess = potentialWidth - MAX_WIDTH;
					newWidth = MAX_WIDTH;
					newX = startX + clampedDx + excess;
				} else {
					newWidth = potentialWidth;
					newX = startX + clampedDx;
				}
			}

			// Vertical resizing logic
			if (direction.includes('s')) {
				newHeight = Math.max(MIN_HEIGHT, Math.min(startHeight + dy, MAX_HEIGHT));
			} else if (direction.includes('n')) {
				const maxDy = startHeight - MIN_HEIGHT;
				const clampedDy = Math.min(dy, maxDy);
				const potentialHeight = startHeight - clampedDy;
				
				if (potentialHeight > MAX_HEIGHT) {
					const excess = potentialHeight - MAX_HEIGHT;
					newHeight = MAX_HEIGHT;
					newY = startY + clampedDy + excess;
				} else {
					newHeight = potentialHeight;
					newY = startY + clampedDy;
				}
			}

			// Apply snapping to resizing results
			newWidth = Math.round(newWidth / gridSnap) * gridSnap;
			newHeight = Math.round(newHeight / gridSnap) * gridSnap;
			newX = Math.round(newX / gridSnap) * gridSnap;
			newY = Math.round(newY / gridSnap) * gridSnap;

			noteSize = { width: newWidth, height: newHeight };
			notePosition = { x: newX, y: newY, z: notePosition.z };
			data = { ...data, size: noteSize, position: notePosition };
		}

		function onPointerUp(e: PointerEvent) {
			if (!isResizing) return;
			isResizing = false;
			node.releasePointerCapture(e.pointerId);
		}

		node.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerUp);

		return {
			destroy() {
				node.removeEventListener('pointerdown', onPointerDown);
				window.removeEventListener('pointermove', onPointerMove);
				window.removeEventListener('pointerup', onPointerUp);
				window.removeEventListener('pointercancel', onPointerUp);
			}
		};
	}
</script>

<div
	use:dragNote
	class="note"
	class:dragging={isCurrentlyDragging}
	title={data.title}
	id={data.id ?? data.title}
	style:background-color={color}
	style:z-index={notePosition.z}
	style:left={notePosition.x + 'px'}
	style:top={notePosition.y + 'px'}
	bind:this={note}
	bind:clientWidth={noteSize.width}
	bind:clientHeight={noteSize.height}
	style:width={noteSize.width + 'px'}
	style:height={noteSize.height + 'px'}
>
	<div class="top-container">
		<h1 class="note-title">{data.title}</h1>
		<div class="handle" unselectable="on"></div>
		<button class="delete-btn" onclick={remove} aria-label="Delete note" title="Delete note"
			><LucideSymbol symbol={'X'} size={16} strokeWidth={2} /></button
		>
	</div>

	<div class="note-meta">
		<div class="note-coordinates">
			<code>[{Math.floor(notePosition.x)}x {Math.floor(notePosition.y)}y {notePosition.z}z]</code>
			<code>[{Math.floor(noteSize.width)}w x {Math.floor(noteSize.height)}h]</code>
		</div>
	</div>
	<div class="note-content-wrapper">
		<div class="note-content">
			{#each sanitizedContent as entry, i}
				<div class="entry">
					{#if typeof entry === 'string'}
						<p>{@html entry}</p>
					{:else}
						{@const file = entry as File}
						{@const mimeType = file.mime.toString()}
						{@const url = file.location.toString()}

						<!-- todo later, get and check types via the server, then validate if its on the allowlist, if not then do something to stop it from loading idk -->
						{#if mimeType.startsWith('image/')}
							<img src={url} alt="" loading="lazy" />
						{:else if mimeType.startsWith('video/')}
							<video crossorigin="anonymous" controls preload="metadata">
								<source src={url} type={mimeType} />
								<track kind="captions" />
								Your browser does not support the video tag.
							</video>
						{:else if mimeType.startsWith('audio/')}
							<audio controls preload="metadata" src={url}>
								Your browser does not support the audio element.
							</audio>
						{:else if mimeType === 'application/pdf'}
							<object
								data={url}
								aria-labelledby="note"
								type="application/pdf"
								width="100%"
								height="500px"
							>
								<p>
									Unable to display PDF. <button onclick={() => window.open(url, '_blank')}
										>Download</button
									> instead.
								</p>
							</object>
						{:else if mimeType.startsWith('text/')}
							<iframe src={url} title="Text content" sandbox="allow-same-origin"></iframe>
						{:else}
							<button onclick={() => window.open(url, '_blank')}>Download file ({mimeType})</button>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Edge resize handles -->
	<div class="resize-handle n" use:resizeNote={'n'}></div>
	<div class="resize-handle s" use:resizeNote={'s'}></div>
	<div class="resize-handle e" use:resizeNote={'e'}></div>
	<div class="resize-handle w" use:resizeNote={'w'}></div>

	<!-- Corner resize handles -->
	<div class="resize-handle nw" use:resizeNote={'nw'}></div>
	<div class="resize-handle ne" use:resizeNote={'ne'}></div>
	<div class="resize-handle sw" use:resizeNote={'sw'}></div>
	<div class="resize-handle se" use:resizeNote={'se'}>
		<LucideSymbol symbol={'maximize-2'} size={14} strokeWidth={2} />
	</div>
</div>

<style>
	* {
		cursor: default;
	}

	.top-container {
		position: absolute;
		display: flex;
		justify-content: space-between;
		width: 100%;
		height: 30px;
		overflow: visible;
	}

	.handle {
		position: absolute;
		left: 50%;
		top: 10px;
		transform: translateX(-50%);
		width: 40px;
		height: 10px;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 999px;
		cursor: grab;
		transition: background-color 0.2s;
		z-index: 50;
		margin-left: 12.5px;
		margin-right: 12.5px;

		&:hover {
			background-color: rgba(255, 255, 255, 0.4);
		}
	}

	.delete-btn {
		position: absolute;
		right: 5px;
		top: 5px;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		border-radius: 50%;
		display: flex;
		width: 20px;
		height: 20px;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 10;

		&:hover {
			color: white;
			background-color: rgba(255, 255, 255, 0.1);
		}
	}

	.note-title {
		position: absolute;
		top: 5px;
		left: 12.5px;
		font-size: 0.85rem;
		font-weight: 600;
		max-width: 35%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.8;
		z-index: 10;
		pointer-events: none;
	}

	.note-meta {
		margin-top: 30px;
		padding: 0 16px 8px 16px;
	}

	.note-coordinates {
		display: flex;
		gap: 8px;
		opacity: 0.5;
		margin-top: 4px;
	}

	.note-coordinates code {
		font-size: 0.7rem;
	}

	.note-content {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.entry {
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		word-wrap: break-word;
		padding: 8px 16px;
	}

	.entry:first-child {
		border-top: none;
	}

	.note {
		background-color: var(--default-bg-color);
		margin-bottom: 16px;
		width: fit-content;
		height: fit-content;
		position: absolute;
		border-radius: 16px;
		min-width: 150px;
		max-width: 800px;
		min-height: 100px;
		max-height: 800px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease;

		&.dragging {
			z-index: 1000 !important;
			transform: scale(1.02);
			box-shadow: 0 10px 20px 5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
			opacity: 0.95;
			cursor: grabbing !important;
		}
	}

	.note-content-wrapper {
		flex: 1;
		overflow: scroll;
		scrollbar-width: none;
		overscroll-behavior: none;
	}

	.resize-handle {
		position: absolute;
		z-index: 100;
	}

	/* Edge handles */
	.resize-handle.n { top: 0; left: 8px; right: 8px; height: 6px; cursor: ns-resize; }
	.resize-handle.s { bottom: 0; left: 8px; right: 8px; height: 6px; cursor: ns-resize; }
	.resize-handle.e { top: 8px; bottom: 8px; right: 0; width: 6px; cursor: ew-resize; }
	.resize-handle.w { top: 8px; bottom: 8px; left: 0; width: 6px; cursor: ew-resize; }

	/* Corner handles */
	.resize-handle.nw { top: 0; left: 0; width: 10px; height: 10px; cursor: nwse-resize; }
	.resize-handle.ne { top: 0; right: 0; width: 10px; height: 10px; cursor: nesw-resize; }
	.resize-handle.sw { bottom: 0; left: 0; width: 10px; height: 10px; cursor: nesw-resize; }
	.resize-handle.se { bottom: 0; right: 0; width: 10px; height: 10px; cursor: nwse-resize; }		

	.note > * {
		/*color: var(--default-text-color);*/
		color: white;
	}

	.entry img {
		object-fit: cover;
		width: 100%;
		border-radius: 5px;
		padding: 10px;
		height: auto;
	}
</style>
