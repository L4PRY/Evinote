<script lang="ts">
	import type { NoteData } from '$lib/types/canvas/NoteData';
	import type { File } from '$lib/types/canvas/File';
	import type { Color } from '$lib/types/canvas/Color';
	import { bringToFront, initializeZIndex } from '$lib/stores/noteZIndex';
	import { parseColor } from '$lib/parseColor';
	import DOMPurify from 'isomorphic-dompurify';
	import { onMount } from 'svelte';
	import { zoomLevel } from '$lib/stores/zoomLevel';
	import { canvasSize } from '$lib/stores/viewport';
	import { spring } from 'svelte/motion';
	import { fly } from 'svelte/transition';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';

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
	let isCurrentlyResizing = $state(false);
	// True once the user has manually dragged a resize handle
	let manuallyResized = $state(
		// Consider it manually resized if the stored size differs from the default
		!!(data.size && (data.size.width !== 200 || data.size.height !== 200))
	);

	let displayPos = spring(
		{ x: data.position?.x ?? 0, y: data.position?.y ?? 0 },
		{ stiffness: 0.1, damping: 0.35 }
	);

	let displayScale = spring(1, {
		stiffness: 0.2, damping: 0.4
	});

	$effect(() => {
		displayPos.set(
			{ x: notePosition.x, y: notePosition.y },
			{ hard: isCurrentlyResizing }
		);
	});

	$effect(() => {
		displayScale.set(isCurrentlyDragging ? 1.02 : 1);
	});

	let rotation = $derived(Math.max(-90, Math.min(90, (notePosition.x - $displayPos.x) * 0.12)));

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
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerUp);
			node.releasePointerCapture(e.pointerId);
		}

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
			window.addEventListener('pointermove', onPointerMove);
			window.addEventListener('pointerup', onPointerUp);
			window.addEventListener('pointercancel', onPointerUp);

			const z = bringToFront(notePosition.z);
			notePosition = { ...notePosition, z };
			data = { ...data, position: notePosition };
			e.preventDefault();
		}

		node.addEventListener('pointerdown', onPointerDown);

		return {
			destroy() {
				node.removeEventListener('pointerdown', onPointerDown);
				window.removeEventListener('pointermove', onPointerMove);
				window.removeEventListener('pointerup', onPointerUp);
				window.removeEventListener('pointercancel', onPointerUp);
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
			isCurrentlyResizing = false;
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerUp);
			node.releasePointerCapture(e.pointerId);
		}

		function onPointerDown(e: PointerEvent) {
			if (e.button !== 0) return;
			isResizing = true;
			isCurrentlyResizing = true;
			startClientX = e.clientX;
			startClientY = e.clientY;
			startWidth = noteSize.width;
			// Use the DOM-rendered height so auto-height notes start from correct value
			const noteEl = (node.closest('.note') ?? node) as HTMLElement;
			startHeight = noteEl.offsetHeight;
			// Lock height immediately so vertical resize is visible during the drag
			noteSize = { width: noteSize.width, height: startHeight };
			manuallyResized = true;
			startX = notePosition.x;
			startY = notePosition.y;

			node.setPointerCapture(e.pointerId);
			window.addEventListener('pointermove', onPointerMove);
			window.addEventListener('pointerup', onPointerUp);
			window.addEventListener('pointercancel', onPointerUp);

			e.stopPropagation();
			e.preventDefault();
		}

		node.addEventListener('pointerdown', onPointerDown);

		return {
			destroy() {
				node.removeEventListener('pointerdown', onPointerDown);
				window.removeEventListener('pointermove', onPointerMove);
				window.removeEventListener('pointerup', onPointerUp);
				window.removeEventListener('pointercancel', onPointerUp);
			}
		};
	}

	// Auto-focus the first entry if it's a brand-new note with a single empty text slot
	let editingIndex = $state<number | null>(
		data.content?.length === 1 && data.content[0] === '' ? 0 : null
	);

	function autoResize(node: HTMLTextAreaElement) {
		const updateHeight = () => {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		};
		updateHeight();
		node.addEventListener('input', updateHeight);
		return {
			destroy() {
				node.removeEventListener('input', updateHeight);
			}
		};
	}

	let isEditingMetadata = $state(false);

	function selectColor(c: string) {
		const result: Color = { type: 'hex', value: c };
		data.color = result;
		color = c;
	}

	function resetColor() {
		data.color = 'var(--default-bg-color)';
		color = 'var(--default-bg-color)';
	}
</script>

<div
	use:dragNote
	class="note"
	class:dragging={isCurrentlyDragging}
	class:editing-meta={isEditingMetadata}
	class:manual-size={manuallyResized}
	title={data.title}
	id={data.id ?? data.title}
	style:background-color={color}
	style:z-index={notePosition.z}
	style:left={$displayPos.x + 'px'}
	style:top={$displayPos.y + 'px'}
	style:transform="scale({$displayScale}) rotate({rotation}deg)"
	bind:this={note}
	bind:clientWidth={noteSize.width}
	style:width={noteSize.width + 'px'}
	style:height={manuallyResized ? noteSize.height + 'px' : 'auto'}
>
	<div class="top-container">
		<div class="header-section left">
			<h1 class="note-title" title={data.title}>{data.title}</h1>
		</div>
		<div class:dragging={isCurrentlyDragging} class="handle" unselectable="on"></div>
		<div class="header-section right">
			<button 
				class="config-btn" 
				class:active={isEditingMetadata}
				onclick={() => (isEditingMetadata = !isEditingMetadata)} 
				aria-label="Configure note" 
				title="Configure note"
				><LucideSymbol symbol={'Sliders'} size={16} strokeWidth={2} /></button
			>
			<button class="delete-btn" onclick={remove} aria-label="Delete note" title="Delete note"
				><LucideSymbol symbol={'X'} size={16} strokeWidth={2} /></button
			>
		</div>

		{#if isEditingMetadata}
			<div class="config-popup" transition:fly={{ y: 8, duration: 200 }}>
				<div class="edit-toolbar">
					<input
						type="text"
						bind:value={data.title}
						onkeydown={(e) => e.key === 'Enter' && (isEditingMetadata = false)}
						class="title-input"
						placeholder="Note title..."
						autofocus
					/>
					<div class="color-controls">
						<label class="custom-color-btn" title="Choose custom color">
							<input 
								type="color" 
								value={parseColor(data.color)} 
								oninput={(e) => selectColor((e.target as HTMLInputElement).value)} 
							/>
							<div class="color-swatch" style:background-color={parseColor(data.color)}></div>
							<span>Custom Color</span>
						</label>
						<button 
							class="reset-color-btn" 
							onclick={resetColor}
							aria-label="Reset to default color"
						>
							<LucideSymbol symbol={'refresh-ccw'} size={14} strokeWidth={2} />
							<span>Reset Default</span>
						</button>
					</div>
				</div>
                <div class="popup-arrow"></div>
			</div>
		{/if}
	</div>

	<!-- <div class="note-meta">
		<div class="note-coordinates">
			<code>[{Math.floor(notePosition.x)}x {Math.floor(notePosition.y)}y {notePosition.z}z]</code>
			<code>[{Math.floor(noteSize.width)}w x {Math.floor(noteSize.height)}h]</code>
		</div>
	</div> -->
	<div class="note-content-wrapper">
		<div class="note-content">
			{#each data.content as entry, i}
				<div class="entry">
					{#if typeof entry === 'string'}
						<textarea
								bind:value={(data.content[i] as string)}
								onblur={() => (editingIndex = null)}
								onkeydown={(e) => {
									if (e.key === 'Tab') {
										e.preventDefault();
										const target = e.target as HTMLTextAreaElement;
										const start = target.selectionStart;
										const end = target.selectionEnd;

										const currentValue = (data.content[i] as string);
										const newValue = currentValue.substring(0, start) + '    ' + currentValue.substring(end);
										
										data.content[i] = newValue;
										
										// Need to wait for Svelte to update the DOM value before setting selection
										setTimeout(() => {
											target.selectionStart = target.selectionEnd = start + 4;
										}, 0);
									}
									if (e.key === 'Escape') {
										editingIndex = null;
									}
								}}
								class="entry-edit"
							></textarea>
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
	<div class="resize-handle se" use:resizeNote={'se'}></div>
</div>

<style>
	* {
		cursor: default;
	}

	.top-container {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: 30px;
	}

	.header-section {
		flex: 1.2;
		min-width: 0;
		display: flex;
		align-items: center;
		height: 100%;
	}

	.header-section.left {
		flex: 0.5;
		padding-left: 12.5px;
		transition: flex 0.1s ease-in-out;
	}

	.note:not(:hover) .header-section.left {
		flex: 10;
	}

	.header-section.right {
		justify-content: flex-end;
		margin-right: 5px;
		min-width: 30px;
	}

	.handle {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 40px;
		height: 10px;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 999px;
		cursor: grab;
		transition: background-color 0.2s, opacity 0.3s;
		z-index: 100;
		opacity: 0;
		pointer-events: none;
		user-select: none;

		&:hover {
			background-color: rgba(255, 255, 255, 0.4);
		}

		&.dragging {
			cursor: grabbing !important;
			opacity: 1 !important;
		}
	}

	.note:hover .handle, .note.dragging .handle {
		opacity: 1;
		pointer-events: auto;
	}

	.delete-btn {
		border: none;
		cursor: pointer;
		border-radius: 50%;
		display: flex;
		width: 24px;
		height: 24px;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 60;

		&:hover {
			color: white;
			background-color: rgba(255, 255, 255, 0.1);
		}
	}

	.note-title {
		font-size: 1rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.8;
		z-index: 10;
		pointer-events: none;
	}

	.config-popup {
		position: absolute;
		bottom: calc(100% + 8px);
		right: 0;
		background: #1e1e1e;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		padding: 8px;
		box-shadow: 0 4px 2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.2);
		z-index: 500;
	}

	.popup-arrow {
		position: absolute;
		bottom: -6px;
		right: 32px;
		width: 12px;
		height: 12px;
		background: #1e1e1e;
		border-right: 1px solid rgba(255, 255, 255, 0.15);
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
		transform: rotate(45deg);
		z-index: -1;
	}

	.edit-toolbar {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 180px;
	}

	.title-input {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: white;
		font-size: 0.8rem;
		padding: 6px 10px;
		width: 100%;
		outline: none;
		transition: border-color 0.2s;

		&:focus {
			border-color: rgba(255, 255, 255, 0.3);
		}
	}

	.color-controls {
		display: flex;
		flex-direction: row;
		gap: 8px;
	}

	.custom-color-btn {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 6px;
		padding: 4px 8px;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 0.72rem;
		white-space: nowrap;

		&:hover {
			background: rgba(255, 255, 255, 0.1);
		}

		input[type="color"] {
			position: absolute;
			opacity: 0;
			width: 0;
			height: 0;
		}
	}

	.color-swatch {
		width: 16px;
		height: 16px;
		border-radius: 3px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.reset-color-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 4px 8px;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.72rem;
		transition: all 0.2s;

		&:hover {
			background: rgba(255, 255, 255, 0.05);
			color: white;
			border-color: rgba(255, 255, 255, 0.2);
		}
	}

	.config-btn, .delete-btn {
		border: none;
		cursor: pointer;
		border-radius: 50%;
		display: flex;
		width: 24px;
		height: 24px;
		padding: 4px;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 60;
		background: transparent;
		color: white;

		&:hover {
			background-color: rgba(255, 255, 255, 0.1);
		}

		&.active {
			background-color: rgba(255, 255, 255, 0.2);
			color: #4da6ff;
		}
	}

	.note-content {
		display: flex;
		flex-direction: column;
		gap: 15px;
		height: 100%;
		overflow: hidden;
	}

	.entry {
		word-wrap: break-word;
		margin: 10px 10px;
		transition: border 0.2s ease;
		box-sizing: border-box;
		border: 2px dashed transparent;
		border-radius: 10px;
		height: 100%;
		margin-top: 0px;
		margin-bottom: 8px;
		padding: 5px;
		cursor: text;


		&:hover {
			border: 2px dashed rgba(255, 255, 255, 0.1);
		}
	}

	.entry-edit {
		box-sizing: border-box;
		position: relative;
		width: 100%;
		height: 100%;
		background: transparent;
		border: none;
		color: white;
		font-family: inherit;
		font-size: 1rem;
		line-height: inherit;
		padding: 0;
		outline: none;
		resize: none;
		overflow: scroll;
		display: block;
		cursor: text;
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
		transition: box-shadow 0.2s ease;

		&.editing-meta {
			overflow: visible !important;
		}

		&.dragging {
			z-index: 1000 !important;
			box-shadow: 0 10px 20px 5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
			opacity: 0.95;
			cursor: grabbing !important;
		}
	}

	.note-content-wrapper {
		flex: 1;
		overflow: visible;
		overscroll-behavior: none;
	}

	.note.manual-size .note-content-wrapper {
		overflow: scroll;
		scrollbar-width: none;
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
