<script lang="ts">
	import {
		draggable,
		bounds as dragBounds,
		BoundsFrom,
		position as dragPosition,
		events
	} from '@neodrag/svelte';
	import type { NoteData } from '$lib/types/canvas/NoteData';
	import { parseColor } from '$lib/parseColor';
	import { zoomLevel } from '$lib/stores/zoomLevel';
	import { bounds, position, canvasSize, clampScrollPosition, isMiniViewportDragging } from '$lib/stores/viewport';

	let { notes = [] as NoteData[], size = 200 } = $props();

	let noteBounds = $state<{ noteId: string; rect: DOMRect }[]>([]);
	let isMiniDragging = $state(false);

	let effectiveCanvasWidth = $derived($canvasSize.width * $zoomLevel);
	let effectiveCanvasHeight = $derived($canvasSize.height * $zoomLevel);

	let scale = $derived.by(() => {
		if ($canvasSize.width === 0 || $canvasSize.height === 0) return 1;

		const scaleX = size / $canvasSize.width;
		const scaleY = size / $canvasSize.height;
		return Math.min(scaleX, scaleY);
	});

	// Scale factor for the zoomed canvas - MUST be defined before currentPosition
	let zoomedScale = $derived.by(() => {
		if (effectiveCanvasWidth === 0 || effectiveCanvasHeight === 0) return 1;
		const scaleX = size / effectiveCanvasWidth;
		const scaleY = size / effectiveCanvasHeight;
		return Math.min(scaleX, scaleY);
	});

	let viewportIndicatorWidth = $derived($bounds.width * zoomedScale);
	let viewportIndicatorHeight = $derived($bounds.height * zoomedScale);

	let viewportIndicatorLeft = $derived($position.left * zoomedScale);
	let viewportIndicatorTop = $derived($position.top * zoomedScale);

	let dragCoords = $state({ x: 0, y: 0 });
	
	$effect(() => {
		if (!$isMiniViewportDragging) {
			dragCoords = {
				x: viewportIndicatorLeft,
				y: viewportIndicatorTop
			};
		}
	});

	$effect(() => {
		$inspect('notebounds update ran');
		noteBounds = notes.map(note => {
			const x = note?.position?.x ?? 0;
			const y = note?.position?.y ?? 0;
			const width = note?.size?.width ?? 100;
			const height = note?.size?.height ?? 100;
			return {
				noteId: note.id ?? note.title,
				rect: new DOMRect(x, y, width, height)
			};
		});
	});

	// two way controls could be implemented in a way that actually uses 2 divs,
	// one for when the viewport is being dragged around on the canvas,
	// and one for when it's being dragged in the mini view.
	// when dragging on the canvas, hide the mini-dragger and show
	//
	// wait this is stupid
	// how the fuck could i make it so that it updates seamessly while dragging
	// on the canvas and on the mini-viewport???????????
</script>

<div class="mini-viewport-container" style:height="{size}px" style:width="{size}px">
	<div
		class="mini-canvas"
		style:width="{effectiveCanvasWidth * zoomedScale}px"
		style:height="{effectiveCanvasHeight * zoomedScale}px"
	>
		{#each notes as note, i (note.id ?? note.title)}
			{@const x = note?.position?.x ?? 0}
			{@const y = note?.position?.y ?? 0}
			{@const pos = { left: x * scale, top: y * scale }}
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
				style:z-index={note.position.z}
				style:background-color={color}
				title={note.title ?? 'Note'}
			></div>
		{/each}

		<div
			{@attach draggable([
				dragPosition({ current: dragCoords }),
				dragBounds(BoundsFrom.parent()),
				events({
					onDragStart: () => {
						$isMiniViewportDragging = true;
					},
					onDrag: (dragData) => {
						const newX = dragData.offset?.x ?? (dragData as any).offsetX;
						const newY = dragData.offset?.y ?? (dragData as any).offsetY;
						
						position.setPosition(
							newX / zoomedScale,
							newY / zoomedScale
						);
					},
					onDragEnd: () => {
						$isMiniViewportDragging = false;
					}
				})
			])}
			class={'viewport-indicator'}
			style:width="{Math.max(viewportIndicatorWidth, 10)-2}px"
			style:height="{Math.max(viewportIndicatorHeight, 10)-2}px"
			style:opacity={viewportIndicatorWidth > 100 && viewportIndicatorHeight > 100 ? 0.8 : 0.5}
			role="button"
			aria-label="Drag to move viewport position"
			tabindex="0"
		></div>
	</div>
</div>

<style>
	.mini-viewport-container {
		position: relative;
		float: right;
		overflow: hidden;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.15s ease;
		border-radius: 10px;
		background-color: transparent;
		top: 100%;
		transform: translateY(-100%) translateY(-20px) translateX(-20px);
	}

	.mini-canvas {
		position: relative;
		border-radius: 10px;
		overflow: hidden;
		backdrop-filter: blur(10px);
		border: 1px solid var(--editor-interface-border);
		background: var(--editor-interface-background);
		box-sizing: border-box;
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
		background-color: rgba(100, 150, 255, 0.25);
		cursor: grab;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
		border-radius: 10px;
		max-width: 100%;
		box-sizing: border-box;
	}

	.viewport-indicator:hover {
		border-color: rgba(130, 180, 255, 1);
		background-color: rgba(100, 150, 255, 0.5);
		filter: opacity(1);
	}

	.viewport-indicator:active {
		cursor: grabbing;
		border-color: rgba(150, 200, 255, 1);
		background-color: rgba(100, 150, 255, 0.35);
	}
</style>
