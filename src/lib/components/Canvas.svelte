<script lang="ts">
	import type { CanvasData } from '$lib/types/CanvasData';
	import { parseColor } from '$lib/parseColor';
	import type { Snippet } from 'svelte';

	const {
		children,
		data
	}: {
		children: Snippet;
		data: CanvasData;
	} = $props();

	// svelte-ignore state_referenced_locally
	let canvasData = $state<CanvasData>(data);

	// Drag state
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let scrollStartX = $state(0);
	let scrollStartY = $state(0);

	// Compute background CSS based on background type
	let backgroundStyle = $derived.by(() => {
		const bg = canvasData.background;
		switch (bg.type) {
			case 'Image':
				return {
					backgroundImage: `url(${bg.value.toString()})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat'
				};
			case 'Solid':
				return {
					backgroundColor: parseColor(bg.value)
				};
			case 'Grid': {
				const grid = bg.value;
				const gridColor = parseColor(grid.color);
				const backgroundColor = parseColor(grid.background);
				if (grid.type === 'Dot') {
					// Create a dotted grid pattern using radial gradients
					const size = grid.size;
					const spacing = size * 10; // spacing between dots
					return {
						backgroundImage: `radial-gradient(circle, ${gridColor} ${size}px, transparent ${size}px)`,
						backgroundSize: `${spacing}px ${spacing}px`,
						backgroundPosition: '0 0',
						backgroundColor
					};
				} else {
					// Line grid pattern using linear gradients
					const width = grid.width;
					const spacing = width * 20; // spacing between lines
					return {
						backgroundImage: `
							linear-gradient(to right, ${gridColor} ${width}px, transparent ${width}px),
							linear-gradient(to bottom, ${gridColor} ${width}px, transparent ${width}px)
						`,
						backgroundSize: `${spacing}px ${spacing}px`,
						backgroundPosition: '0 0',
						backgroundColor
					};
				}
			}
			case 'Custom':
				// Custom CSS background - parse as raw CSS value
				return {
					background: bg.value
				};
			default:
				return {};
		}
	});

	// Convert style object to CSS string
	let backgroundCss = $derived(
		Object.entries(backgroundStyle)
			.map(([key, value]) => {
				// Convert camelCase to kebab-case
				const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
				return `${cssKey}: ${value}`;
			})
			.join('; ')
	);

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
		canvasElement.releasePointerCapture(e.pointerId);
	}

	// Prevent scroll wheel events
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
	}

	// Function to update canvas data programmatically
	export function setBackground(background: CanvasData['background']) {
		canvasData.background = background;
	}

	export function setSize(size: CanvasData['size']) {
		canvasData.size = size;
	}

	export function setData(newData: CanvasData) {
		canvasData = newData;
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
	style:zoom={canvasData.size.zoom}
	class:dragging={isDragging}
	role="application"
	aria-label="Draggable canvas"
	tabindex="0"
>
	<!-- Inner content container that provides the scrollable area -->
	<div
		class="canvas-content"
		bind:this={contentElement}
		style={backgroundCss}
		style:width={`${canvasData.size.width}px`}
		style:height={`${canvasData.size.height}px`}
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
		height: 100vh;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		border: 5px solid var(--default-text-color);
		/* Enable scrolling but hide scrollbars */
		overflow: scroll;
		scrollbar-width: none;
		-ms-overflow-style: none;
		/* Prevent text selection while dragging */
		user-select: none;
		-webkit-user-select: none;
		/* Prevent touch scrolling (only drag allowed) */
		touch-action: none;
		/* Cursor feedback */
		cursor: grab;
	}

	#canvas::-webkit-scrollbar {
		display: none;
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
