<script lang="ts">
	import {
		draggable,
		bounds as dragBounds,
		BoundsFrom,
		position as dragPosition,
		disabled
	} from '@neodrag/svelte';
	import type { NoteData } from '$lib/types/canvas/NoteData';
	import { parseColor } from '$lib/parseColor';
	import { zoomLevel } from '$lib/stores/zoomLevel';
	import { bounds, position, canvasSize, clampScrollPosition } from '$lib/stores/viewport';

	let { notes = [] as NoteData[], size = 200 } = $props();

	let noteBounds = $state<{ noteId: string; rect: DOMRect }[]>([]);

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

	let currentPosition = $derived.by(() => ({
		x: viewportIndicatorLeft,
		y: viewportIndicatorTop
	}));

	$effect(() => {
		noteBounds = notes.map(note => {
			const element = document.getElementById(note.title ?? '');
			if (element) {
				return { noteId: note.title ?? '', rect: element.getBoundingClientRect() };
			}
			return { noteId: note.title ?? '', rect: new DOMRect(0, 0, 0, 0) };
		});
	});

	// $effect(() => {
	// 	$inspect(isDragging, positionComp.current, currentPosition);
	// });

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

		<div
			{@attach draggable([
				disabled(),
				dragPosition({ current: currentPosition }),
				dragBounds(BoundsFrom.parent())
			])}
			class={'viewport-indicator'}
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
		border-radius: 8px;
		/*cursor: grab;*/
		margin-top: 1px;
		/*margin-bottom: 1px;*/
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease;
	}

	/*.viewport-indicator:hover {*/
	/*border-color: rgba(130, 180, 255, 1);
		background-color: rgba(100, 150, 255, 0.25);*/
	/*cursor: not-allowed;*/
	/*}*/

	/*.viewport-indicator:active {
		cursor: grabbing;
		border-color: rgba(150, 200, 255, 1);
		background-color: rgba(100, 150, 255, 0.35);
	}*/
</style>
