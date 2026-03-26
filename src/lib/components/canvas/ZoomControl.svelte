<script lang="ts">
	import { zoomLevel, minZoom, MAX_ZOOM, DEFAULT_ZOOM } from '$lib/stores/zoomLevel';
	const DEFAULT_PERCENTAGE = DEFAULT_ZOOM * 100; // 100%
	const SNAP_THRESHOLD = 3; // Snap when within 8% of default
	const SLOW_DRAG_THRESHOLD = 15; // Velocity threshold for "slow" dragging

	// Convert zoom (0.5-2) to percentage (50-200) for display
	let zoomPercentage = $derived(Math.round($zoomLevel * 100));

	// Slider value synced with zoom
	let sliderValue = $derived($zoomLevel * 100);

	// Tracking for sticky snap behavior
	let lastValue = $state(100);
	let lastTime = $state(Date.now());
	let isSnapped = $state(false);

	function handleSliderInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const currentValue = Number(target.value);
		const currentTime = Date.now();

		// Calculate velocity (change per ms)
		const timeDelta = currentTime - lastTime;
		const valueDelta = Math.abs(currentValue - lastValue);
		const velocity = timeDelta > 0 ? (valueDelta / timeDelta) * 100 : 0; // scale for readability

		// Check if we're near the default value and moving slowly
		const distanceFromDefault = Math.abs(currentValue - DEFAULT_PERCENTAGE);
		const isNearDefault = distanceFromDefault <= SNAP_THRESHOLD;
		const isMovingSlowly = velocity < SLOW_DRAG_THRESHOLD;

		// Update tracking values
		lastValue = currentValue;
		lastTime = currentTime;

		// Snap to default if conditions are met
		if (isNearDefault && isMovingSlowly && !isSnapped) {
			isSnapped = true;
			zoomLevel.set(DEFAULT_ZOOM);
			return;
		}

		// Release snap if we've moved far enough away
		if (isSnapped) {
			if (distanceFromDefault > SNAP_THRESHOLD) {
				isSnapped = false;
			} else {
				// Still within snap zone, don't update
				return;
			}
		}

		zoomLevel.set(currentValue / 100);
	}

	function zoomIn() {
		zoomLevel.increment();
	}

	function zoomOut() {
		zoomLevel.decrement();
	}

	function resetZoom() {
		zoomLevel.reset();
	}
</script>

<div class="zoom-control">
	<div class="button-group left">
		<button
			class="zoom-btn reset"
			onclick={resetZoom}
			disabled={$zoomLevel === DEFAULT_ZOOM}
			aria-label="Reset zoom to 100%"
			title="Reset to 100%"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
				<path d="M3 3v5h5" />
			</svg>
		</button>
		<div class="separator"></div>
		<button
			class="zoom-btn"
			onclick={zoomOut}
			disabled={$zoomLevel <= $minZoom}
			aria-label="Zoom out"
			title="Zoom out"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</button>
	</div>

	<div class="slider-container">
		<input
			type="range"
			min={Math.round($minZoom * 100)}
			max={MAX_ZOOM * 100}
			step="1"
			value={sliderValue}
			oninput={handleSliderInput}
			class="zoom-slider"
			aria-label="Zoom level"
		/>
		<span class="zoom-label">{zoomPercentage}%</span>
	</div>

	<div class="button-group right">
		<button
			class="zoom-btn"
			onclick={zoomIn}
			disabled={$zoomLevel >= MAX_ZOOM}
			aria-label="Zoom in"
			title="Zoom in"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</button>
	</div>
</div>

<style>
	.zoom-control {
		position: fixed;
		bottom: 20px;
		left: 20px;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 340px;
		height: 110px;
		padding: 16px 20px;
		box-sizing: border-box;
		background: var(--editor-interface-background);
		backdrop-filter: blur(10px);
		border: 1px solid var(--editor-interface-border);
		border-radius: var(--border-radius);
	}

	.button-group {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.button-group.left {
		flex-shrink: 0;
	}

	.button-group.right {
		flex-shrink: 0;
	}

	.separator {
		width: 1px;
		height: 20px;
		background-color: var(--button-stroke-color);
		margin: 0 4px;
	}

	.zoom-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: var(--default-border);
		border-radius: 8px;
		background-color: var(--default-blur-color);
		color: var(--default-text-color);
		cursor: pointer;
		transition: all 0.1s ease-in-out;
	}

	.zoom-btn:hover:not(:disabled) {
		background-color: var(--default-blur-hover-color);
	}

	.zoom-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.zoom-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.zoom-btn svg {
		width: 18px;
		height: 18px;
	}

	.zoom-btn.reset svg {
		width: 16px;
		height: 16px;
	}

	.slider-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.zoom-slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: var(--button-stroke-color);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
	}

	.zoom-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--fancygradient);
		cursor: pointer;
		border: 2px solid var(--default-bg-color);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		transition: transform 0.1s ease;
	}

	.zoom-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	.zoom-slider::-webkit-slider-thumb:active {
		transform: scale(0.95);
	}

	.zoom-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--fancygradient);
		cursor: pointer;
		border: 2px solid var(--default-bg-color);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		transition: transform 0.1s ease;
	}

	.zoom-slider::-moz-range-thumb:hover {
		transform: scale(1.1);
	}

	.zoom-slider::-moz-range-track {
		height: 6px;
		border-radius: 3px;
		background: var(--button-stroke-color);
	}

	.zoom-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--default-text-color);
		opacity: 0.8;
		min-width: 40px;
		text-align: center;
	}
</style>
