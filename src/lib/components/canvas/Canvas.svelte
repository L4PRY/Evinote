<script lang="ts">
	import type { CanvasData } from '$lib/types/canvas/CanvasData';
	import { validateCanvasData } from '$lib/canvas/validation';
	import { parseColor } from '$lib/parseColor';
	import { zoomLevel, minZoom, MAX_ZOOM } from '$lib/stores/zoomLevel';
	import { bounds, canvasSize, position, isMiniViewportDragging } from '$lib/stores/viewport';
	import { onMount, type Snippet } from 'svelte';
	import { parseBackground, parseBackgroundCss } from '$lib/parseBackground';

	const {
		children,
		data
	}: {
		children: Snippet;
		data: CanvasData;
	} = $props();

	// add a way for the current visible viewport and canvas to be movable indirectly
	// needs a bindable for the current viewport size, scroll position and zoom level

	// svelte-ignore state_referenced_locally
	let canvasData = $state<CanvasData>(validateCanvasData(data));

	// Track if canvas is being dragged (to prevent feedback loops with MiniViewport)
	let isCanvasDragging = $state(false);
	let shiftHeld = $state(false);

	// Drag state
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let scrollStartX = $state(0);
	let scrollStartY = $state(0);

	// Compute background CSS based on background type
	// Convert style object to CSS string
	let backgroundCss = $derived(parseBackgroundCss(parseBackground(canvasData)));

	// Reference to the canvas and content elements
	let canvasElement: HTMLDivElement;
	let contentElement: HTMLDivElement;

	// Drag event handlers
	function handlePointerDown(e: PointerEvent) {
		// Only start drag on primary button (left click) or touch
		if (e.button !== 0) return;

		// Only allow dragging if clicking directly on the canvas or content background, not on child elements
		if (e.target !== canvasElement && e.target !== contentElement) return;

		isDragging = true;
		isCanvasDragging = true;

		// add gliding logic to this, later
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		scrollStartX = canvasElement.scrollLeft;
		scrollStartY = canvasElement.scrollTop;

		// Capture pointer to receive events outside the element
		canvasElement.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;

		// Calculate delta and invert direction (drag left = scroll right)
		const deltaX = e.clientX - dragStartX;
		const deltaY = e.clientY - dragStartY;

		// Set scroll position - naturally clamped by the browser
		canvasElement.scrollLeft = scrollStartX - deltaX;
		canvasElement.scrollTop = scrollStartY - deltaY;
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDragging) return;

		isDragging = false;
		isCanvasDragging = false;
		canvasElement.releasePointerCapture(e.pointerId);
	}

	// Smooth zoom state
	let targetZoom = $state($zoomLevel);
	let zoomAnimationId: number | null = null;
	let lastCursorX = $state(0);
	let lastCursorY = $state(0);
	const ZOOM_LERP_SPEED = 0.15; // How fast zoom interpolates (0-1, higher = faster)
	const ZOOM_EPSILON = 0.001; // Stop animating when close enough

	// Sync targetZoom when zoom is changed externally (slider, buttons)
	$effect(() => {
		if (zoomAnimationId === null) {
			targetZoom = $zoomLevel;
		}
	});

	// Zoom with scroll wheel, zooming toward cursor position
	function handleWheel(e: WheelEvent) {
		if (shiftHeld) return; // Only zoom when Shift is held
		e.preventDefault();

		if (document.querySelector('.note')?.getAttribute('data-neodrag-state') === 'dragging') return;

		const zoomChange = -e.deltaY * 0.001; // Adjust zoom sensitivity
		targetZoom = Math.min(Math.max(targetZoom + zoomChange, $minZoom), MAX_ZOOM);

		// Track cursor position for zoom origin
		const rect = canvasElement.getBoundingClientRect();
		lastCursorX = e.clientX - rect.left;
		lastCursorY = e.clientY - rect.top;

		// Start smooth zoom animation if not already running
		if (zoomAnimationId === null) {
			zoomAnimationId = requestAnimationFrame(animateZoom);
		}
	}

	function animateZoom() {
		const currentZoom = $zoomLevel;
		const diff = targetZoom - currentZoom;

		if (Math.abs(diff) < ZOOM_EPSILON) {
			// Close enough — snap to target and stop
			applyZoomAtCursor(targetZoom);
			zoomAnimationId = null;
			return;
		}

		// Lerp toward target
		const nextZoom = currentZoom + diff * ZOOM_LERP_SPEED;
		applyZoomAtCursor(nextZoom);

		// Continue animation
		zoomAnimationId = requestAnimationFrame(animateZoom);
	}

	function applyZoomAtCursor(newZoom: number) {
		const oldZoom = $zoomLevel;
		if (oldZoom === newZoom) return;

		// Calculate the content position under the cursor before zoom
		const contentX = (canvasElement.scrollLeft + lastCursorX) / oldZoom;
		const contentY = (canvasElement.scrollTop + lastCursorY) / oldZoom;

		// Apply the new zoom
		zoomLevel.set(newZoom);

		// Adjust scroll so the same content point stays under cursor
		canvasElement.scrollLeft = contentX * newZoom - lastCursorX;
		canvasElement.scrollTop = contentY * newZoom - lastCursorY;
	}

	function handleScroll(e: Event) {
		updateViewportStores();
	}

	// Function to update canvas data programmatically
	export function setBackground(background: CanvasData['background']) {
		canvasData.background = background;
	}

	export function setSize(size: CanvasData['size']) {
		canvasData.size = size;
	}

	export function setData(newData: CanvasData) {
		canvasData = validateCanvasData(newData);
	}

	export function scrollTo(x: number, y: number) {
		if (canvasElement) {
			canvasElement.scrollLeft = x;
			canvasElement.scrollTop = y;
		}
	}

	export function getScroll() {
		if (canvasElement) {
			return { x: canvasElement.scrollLeft, y: canvasElement.scrollTop };
		}
		return { x: 0, y: 0 };
	}

	export function resetScroll() {
		if (canvasElement) {
			canvasElement.scrollLeft = 0;
			canvasElement.scrollTop = 0;
		}
	}

	export function centerScroll() {
		if (canvasElement) {
			const maxScrollX = canvasElement.scrollWidth - canvasElement.clientWidth;
			const maxScrollY = canvasElement.scrollHeight - canvasElement.clientHeight;
			canvasElement.scrollLeft = maxScrollX / 2;
			canvasElement.scrollTop = maxScrollY / 2;
		}
	}

	// Update stores when canvas element is available and on scroll
	function updateViewportStores() {
		if (!canvasElement) return;

		bounds.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
		if (!$isMiniViewportDragging) {
			position.setPosition(canvasElement.scrollLeft, canvasElement.scrollTop);
		}
		canvasSize.setSize(canvasData.size.width, canvasData.size.height);
	}

	// Initialize viewport stores on mount and observe resize
	$effect(() => {
		$inspect(shiftHeld);
		if (!canvasElement) return;

		// Initial update
		updateViewportStores();

		// Create ResizeObserver to track viewport size changes
		const resizeObserver = new ResizeObserver(() => {
			updateViewportStores();
		});

		resizeObserver.observe(canvasElement);

		// Cleanup on unmount
		return () => {
			resizeObserver.disconnect();
		};
	});

	// Listen to viewportPosition store changes (from MiniViewport dragging)
	$effect(() => {
		const unsubscribe = position.subscribe(pos => {
			// Only apply if we're not currently dragging the canvas
			if (!isCanvasDragging && canvasElement) {
				canvasElement.scrollLeft = pos.left;
				canvasElement.scrollTop = pos.top;
			}
		});

		return unsubscribe;
	});

	// Update canvas size when canvas data changes
	$effect(() => {
		canvasSize.setSize(canvasData.size.width, canvasData.size.height);
	});

	onMount(() => {
		window.addEventListener('keydown', e => e.key === 'Shift' && (shiftHeld = true));

		window.addEventListener('keyup', e => e.key === 'Shift' && (shiftHeld = false));
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	id="canvas"
	bind:this={canvasElement}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onwheel={handleWheel}
	onscroll={handleScroll}
	class:dragging={isDragging}
	role="application"
	aria-label="Draggable canvas"
	tabindex="0"
>
	<!-- Inner content container that provides the scrollable area -->
	<div
		class="canvas-content"
		style={backgroundCss}
		bind:this={contentElement}
		style:width={`${canvasData.size.width}px`}
		style:height={`${canvasData.size.height}px`}
		style:zoom={$zoomLevel}
	>
		{@render children()}
	</div>
</div>

<style>
	#canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		/* Enable scrolling with subtle scrollbars */
		overflow: scroll;
		scrollbar-width: thin;
		scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
		/* Prevent text selection while dragging */
		user-select: none;
		-webkit-user-select: none;
		/* Prevent touch scrolling (only drag allowed) */
		touch-action: none;
		/* Cursor feedback */
		cursor: grab;
		overscroll-behavior: none;
	}

	#canvas::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	#canvas::-webkit-scrollbar-track {
		background: transparent;
	}

	#canvas::-webkit-scrollbar-thumb {
		background-color: rgba(128, 128, 128, 0.3);
		border-radius: 4px;
		border: 2px solid transparent;
		background-clip: content-box;
	}

	#canvas::-webkit-scrollbar-thumb:hover {
		background-color: rgba(128, 128, 128, 0.5);
	}

	#canvas::-webkit-scrollbar-corner {
		background: transparent;
	}

	#canvas.dragging {
		cursor: grabbing;
	}

	.canvas-content {
		/* The content defines the scrollable area */
		position: relative;
		min-width: 100%;
		min-height: 100%;
	}
</style>
