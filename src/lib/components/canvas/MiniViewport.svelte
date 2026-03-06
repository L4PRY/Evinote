<script lang="ts">
	import { draggable, bounds, BoundsFrom, position, events } from '@neodrag/svelte';
	import type { NoteData } from '$lib/types/NoteData';
	import { parseColor } from '$lib/parseColor';
	import {
		viewportBounds,
		viewportPosition,
		canvasSize,
		clampScrollPosition
	} from '$lib/stores/viewportBounds';
	import { zoomLevel } from '$lib/stores/zoomLevel';

	// Props
	let {
		notes = [],
		miniWidth = 200,
		miniHeight = 150
	}: {
		notes: NoteData[];
		miniWidth?: number;
		miniHeight?: number;
	} = $props();

	// Track if we're currently dragging to prevent feedback loops
	let isDragging = $state(false);

	// Store note bounds - populated client-side only via $effect
	let noteBounds = $state<{ noteId: string; rect: DOMRect }[]>([]);

	// Calculate scale factor between mini viewport and actual canvas
	let scale = $derived.by(() => {
		if ($canvasSize.width === 0 || $canvasSize.height === 0) return 1;
		// Scale based on canvas size to fit within mini viewport
		const scaleX = miniWidth / $canvasSize.width;
		const scaleY = miniHeight / $canvasSize.height;
		return Math.min(scaleX, scaleY);
	});

	// Effective zoom for calculations (canvas content is scaled by zoom)
	let effectiveCanvasWidth = $derived($canvasSize.width * $zoomLevel);
	let effectiveCanvasHeight = $derived($canvasSize.height * $zoomLevel);

	// Scale factor for the zoomed canvas
	let zoomedScale = $derived.by(() => {
		if (effectiveCanvasWidth === 0 || effectiveCanvasHeight === 0) return 1;
		const scaleX = miniWidth / effectiveCanvasWidth;
		const scaleY = miniHeight / effectiveCanvasHeight;
		return Math.min(scaleX, scaleY);
	});

	// Viewport indicator dimensions (scaled)
	let viewportIndicatorWidth = $derived($viewportBounds.width * zoomedScale);
	let viewportIndicatorHeight = $derived($viewportBounds.height * zoomedScale);

	// Viewport indicator position (scaled from scroll position)
	let viewportIndicatorLeft = $derived($viewportPosition.left * zoomedScale);
	let viewportIndicatorTop = $derived($viewportPosition.top * zoomedScale);

	// Sync position from store when not dragging
	$effect(() => {
		if (!isDragging) {
			currentPosition = {
				x: viewportIndicatorLeft,
				y: viewportIndicatorTop
			};
		}
	});

	// Handle drag events to update viewport position
	function handleDrag(data: { offset: { x: number; y: number } }) {
		// Update local position immediately for smooth dragging
		currentPosition = { x: data.offset.x, y: data.offset.y };

		// Convert mini viewport position back to actual scroll position
		const newScrollLeft = data.offset.x / zoomedScale;
		const newScrollTop = data.offset.y / zoomedScale;

		// Clamp and update the viewport position store
		const clamped = clampScrollPosition(
			newScrollLeft,
			newScrollTop,
			effectiveCanvasWidth,
			effectiveCanvasHeight,
			$viewportBounds.width,
			$viewportBounds.height
		);

		viewportPosition.scrollTo(clamped.left, clamped.top);
	}

	// Update note bounds when notes change (client-side only)
	$effect(() => {
		const updateBounds = () => {
			noteBounds = notes.map(note => {
				const element = document.getElementById(note.title ?? '');
				if (element) {
					return { noteId: note.title ?? '', rect: element.getBoundingClientRect() };
				}
				return { noteId: note.title ?? '', rect: new DOMRect(0, 0, 0, 0) };
			});
		};

		// Initial update
		updateBounds();

		// Also update after a short delay to catch any late-rendering notes
		const timeout = setTimeout(updateBounds, 100);

		return () => clearTimeout(timeout);
	});
</script>

<div class="mini-viewport-container" style:width="{miniWidth}px" style:height="{miniHeight}px">
	<!-- Mini canvas background showing the full canvas area -->
	<div
		class="mini-canvas"
		style:width="{effectiveCanvasWidth * zoomedScale}px"
		style:height="{effectiveCanvasHeight * zoomedScale}px"
	>
		<!-- Note indicators -->
		{#each notes as note, i (note.title ?? i)}
			{@const pos = { left: note.position.x * scale, top: note.position.y * scale }}
			{@const color = parseColor(note.color)}
			{@const noteBound = noteBounds[i]}
			{@const noteIndicatorWidth =
				noteBound && noteBound.rect.width > 0
					? noteBound.rect.width * scale
					: Math.max(6, 12 * scale)}
			{@const noteIndicatorHeight =
				noteBound && noteBound.rect.height > 0
					? noteBound.rect.height * scale
					: Math.max(4, 8 * scale)}
			<div
				class="note-indicator"
				style:left="{pos.left}px"
				style:top="{pos.top}px"
				style:width="{noteIndicatorWidth}px"
				style:height="{noteIndicatorHeight}px"
				style:background-color={color}
				title={note.title ?? 'Note'}
			></div>
		{/each}

		<!-- Viewport indicator (draggable) -->
		<div
			{@attach draggable([
				bounds(BoundsFrom.parent()),
				position({
					current: currentPosition
				}),
				events({
					onDragStart: () => {
						isDragging = true;
					},
					onDrag: handleDrag,
					onDragEnd: () => {
						isDragging = false;
					}
				})
			])}
			class="viewport-indicator"
			style:width="{Math.max(viewportIndicatorWidth, 10)}px"
			style:height="{Math.max(viewportIndicatorHeight, 10)}px"
			role="button"
			aria-label="Drag to move viewport position"
			tabindex="0"
		></div>
	</div>
</div>

<style>
	.mini-viewport-container {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background-color: rgba(30, 30, 35, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mini-canvas {
		position: relative;
		background-color: rgba(50, 50, 60, 0.5);
		border-radius: 4px;
		overflow: hidden;
	}

	.note-indicator {
		position: absolute;
		border-radius: 2px;
		pointer-events: none;
		opacity: 0.8;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
	}

	.viewport-indicator {
		position: absolute;
		border: 2px solid rgba(100, 150, 255, 0.8);
		background-color: rgba(100, 150, 255, 0.15);
		border-radius: 3px;
		cursor: grab;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	.viewport-indicator:hover {
		border-color: rgba(130, 180, 255, 1);
		background-color: rgba(100, 150, 255, 0.25);
	}

	.viewport-indicator:active {
		cursor: grabbing;
		border-color: rgba(150, 200, 255, 1);
		background-color: rgba(100, 150, 255, 0.35);
	}
</style>
