<script lang="ts">
	import { onMount } from 'svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { fly, fade } from 'svelte/transition';

	interface Props {
		src: string;
		onCrop: (blob: Blob) => void;
		onCancel: () => void;
	}

	let { src, onCrop, onCancel }: Props = $props();

	let overlayElement: HTMLDivElement;
	let imageElement: HTMLImageElement;
	let workspaceElement: HTMLDivElement;
	let headerElement: HTMLDivElement;
	let footerElement: HTMLDivElement;

	let imageLoaded = $state(false);
	let imgWidth = $state(0);
	let imgHeight = $state(0);
	let naturalWidth = $state(0);
	let naturalHeight = $state(0);

	// Crop box state (in CSS pixels relative to the displayed image)
	let cropX = $state(50);
	let cropY = $state(50);
	let cropW = $state(200);
	let cropH = $state(200);

	let activeHandle = $state<string | null>(null);
	let isDragging = $state(false);
	let startX = 0;
	let startY = 0;
	let startCrop = { x: 0, y: 0, w: 0, h: 0 };

	let aspectRatio = $state<number | null>(null); // null for freeform

	function handleImageLoad(e: Event) {
		const img = e.target as HTMLImageElement;
		naturalWidth = img.naturalWidth;
		naturalHeight = img.naturalHeight;

		const imgRatio = naturalWidth / naturalHeight;

		// Measure fixed chrome heights (header + footer are always in DOM)
		const headerH = headerElement?.offsetHeight ?? 56;
		const footerH = footerElement?.offsetHeight ?? 72;

		// Viewport budget (leave a small margin for aesthetics)
		const margin = 24;
		const borderPad = 2; // For modal border thickness
		const maxImgW = window.innerWidth  - margin - borderPad;
		const maxImgH = window.innerHeight - margin - borderPad - headerH - footerH;

		// Always fill the full available width, then clamp by height if needed
		let iw = maxImgW;
		let ih = iw / imgRatio;
		if (ih > maxImgH) { ih = maxImgH; iw = ih * imgRatio; }

		// Don't upscale small images if they fit perfectly natively
		if (naturalWidth < iw && naturalHeight < maxImgH) {
			iw = naturalWidth;
			ih = naturalHeight;
		}

		imgWidth  = iw;
		imgHeight = ih;

		// Initial crop box (centered 80% of min dimension)
		const boxSize = Math.min(imgWidth, imgHeight) * 0.8;
		cropW = boxSize;
		cropH = boxSize;
		cropX = (imgWidth - cropW) / 2;
		cropY = (imgHeight - cropH) / 2;

		imageLoaded = true;
	}

	function startInteraction(e: PointerEvent, handle: string | null) {
		e.preventDefault();
		e.stopPropagation();
		
		activeHandle = handle;
		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;
		startCrop = { x: cropX, y: cropY, w: cropW, h: cropH };

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', endInteraction);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		if (activeHandle === 'move') {
			cropX = Math.max(0, Math.min(startCrop.x + dx, imgWidth - cropW));
			cropY = Math.max(0, Math.min(startCrop.y + dy, imgHeight - cropH));
		} else if (activeHandle) {
			let newX = startCrop.x;
			let newY = startCrop.y;
			let newW = startCrop.w;
			let newH = startCrop.h;

			if (activeHandle.includes('e')) newW = Math.max(50, Math.min(startCrop.w + dx, imgWidth - startCrop.x));
			if (activeHandle.includes('w')) {
				const availableDx = startCrop.x;
				const clampedDx = Math.max(-availableDx, Math.min(dx, startCrop.w - 50));
				newX = startCrop.x + clampedDx;
				newW = startCrop.w - clampedDx;
			}
			if (activeHandle.includes('s')) newH = Math.max(50, Math.min(startCrop.h + dy, imgHeight - startCrop.y));
			if (activeHandle.includes('n')) {
				const availableDy = startCrop.y;
				const clampedDy = Math.max(-availableDy, Math.min(dy, startCrop.h - 50));
				newY = startCrop.y + clampedDy;
				newH = startCrop.h - clampedDy;
			}

			if (aspectRatio) {
				// Enforce aspect ratio
				if (activeHandle.includes('e') || activeHandle.includes('w')) {
					newH = newW / aspectRatio;
					if (newY + newH > imgHeight) {
						newH = imgHeight - newY;
						newW = newH * aspectRatio;
						if (activeHandle.includes('w')) newX = startCrop.x + (startCrop.w - newW);
					}
				} else {
					newW = newH * aspectRatio;
					if (newX + newW > imgWidth) {
						newW = imgWidth - newX;
						newH = newW / aspectRatio;
						if (activeHandle.includes('n')) newY = startCrop.y + (startCrop.h - newH);
					}
				}
			}

			cropX = newX;
			cropY = newY;
			cropW = newW;
			cropH = newH;
		}
	}

	function endInteraction() {
		isDragging = false;
		activeHandle = null;
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', endInteraction);
	}

	async function confirmCrop() {
		if (!imageElement) return;

		const canvas = document.createElement('canvas');
		const scale = naturalWidth / imgWidth;
		
		canvas.width = cropW * scale;
		canvas.height = cropH * scale;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.drawImage(
			imageElement,
			cropX * scale, cropY * scale, cropW * scale, cropH * scale,
			0, 0, canvas.width, canvas.height
		);

		canvas.toBlob((blob) => {
			if (blob) onCrop(blob);
		}, 'image/png', 0.9);
	}

	function setPreset(ratio: number | null) {
		aspectRatio = ratio;
		if (ratio) {
			const currentRatio = cropW / cropH;
			if (currentRatio > ratio) {
				cropW = cropH * ratio;
			} else {
				cropH = cropW / ratio;
			}
			// Center fix if out of bounds
			if (cropX + cropW > imgWidth) cropX = imgWidth - cropW;
			if (cropY + cropH > imgHeight) cropY = imgHeight - cropH;
		}
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}
</script>

<div class="cropper-overlay" transition:fade={{ duration: 200 }} bind:this={overlayElement} use:portal>
	<div
		class="cropper-modal"
		transition:fly={{ y: 20, duration: 300 }}
		style:width={imgWidth ? `${imgWidth + 2}px` : undefined}
	>
		<div class="cropper-header" bind:this={headerElement}>
			<h3>Crop Image</h3>
			<button class="icon-btn" onclick={onCancel} title="Cancel">
				<LucideSymbol symbol="X" size={20} />
			</button>
		</div>

		<div class="cropper-workspace" bind:this={workspaceElement}>
			{#if !imageLoaded}
				<div class="loader">
					<div class="spinner"></div>
					<span>Loading image...</span>
				</div>
			{/if}
			
			<div
				class="image-container"
				style:width="{imgWidth}px"
				style:height="{imgHeight}px"
				style:aspect-ratio="{naturalWidth}/{naturalHeight}"
				class:visible={imageLoaded}
			>
				<img {src} alt="To crop" bind:this={imageElement} onload={handleImageLoad} crossorigin="anonymous" />
				
				<div class="mask">
					<div class="mask-top" style:height="{cropY}px"></div>
					<div class="mask-middle">
						<div class="mask-left" style:width="{cropX}px"></div>
						<div 
							class="crop-box" 
							style:width="{cropW}px" 
							style:height="{cropH}px"
							onpointerdown={(e) => startInteraction(e, 'move')}
						>
							<div class="grid-lines"></div>
							
							<!-- Handles -->
							<div class="handle nw" onpointerdown={(e) => startInteraction(e, 'nw')}></div>
							<div class="handle ne" onpointerdown={(e) => startInteraction(e, 'ne')}></div>
							<div class="handle sw" onpointerdown={(e) => startInteraction(e, 'sw')}></div>
							<div class="handle se" onpointerdown={(e) => startInteraction(e, 'se')}></div>
							<div class="handle n" onpointerdown={(e) => startInteraction(e, 'n')}></div>
							<div class="handle s" onpointerdown={(e) => startInteraction(e, 's')}></div>
							<div class="handle e" onpointerdown={(e) => startInteraction(e, 'e')}></div>
							<div class="handle w" onpointerdown={(e) => startInteraction(e, 'w')}></div>
						</div>
						<div class="mask-right"></div>
					</div>
					<div class="mask-bottom"></div>
				</div>
			</div>
		</div>

		<div class="cropper-footer" bind:this={footerElement}>
			<div class="presets">
				<button class:active={aspectRatio === null} onclick={() => setPreset(null)}>Free</button>
				<button class:active={aspectRatio === 1} onclick={() => setPreset(1)}>1:1</button>
				<button class:active={aspectRatio === 4/3} onclick={() => setPreset(4/3)}>4:3</button>
				<button class:active={aspectRatio === 16/9} onclick={() => setPreset(16/9)}>16:9</button>
			</div>
			
			<div class="actions">
				<button class="btn secondary" onclick={onCancel}>Cancel</button>
				<button class="btn primary" onclick={confirmCrop}>Apply Crop</button>
			</div>
		</div>
	</div>
</div>

<style>
	.cropper-overlay {
		position: fixed;
		inset: 0;
		background: var(--default-bg-color-transparent);
		backdrop-filter: blur(8px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.cropper-modal {
		background: var(--default-bg-color);
		border: var(--default-border-visible);
		border-radius: 12px;
		height: fit-content;
		width: fit-content;
		max-width: calc(100vw - 24px);
		max-height: calc(100vh - 24px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
		transition: max-width 0.2s ease;
	}

	.cropper-header {
		padding: 16px 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: var(--default-border-visible);
	}

	.cropper-header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--default-text-color);
	}

	.cropper-workspace {
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		position: relative;
		flex: 1;
		min-height: 0;
	}

	.image-container {
		position: relative;
		opacity: 0;
		transition: opacity 0.3s;
	}

	.image-container.visible {
		opacity: 1;
	}

	.image-container img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		user-select: none;
		pointer-events: none;
	}

	.mask {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		pointer-events: none;
	}

	.mask-top, .mask-bottom, .mask-left, .mask-right {
		background: rgba(0, 0, 0, 0.6);
	}

	.mask-middle {
		display: flex;
		flex: 1;
	}

	.mask-right {
		flex: 1;
	}

	.crop-box {
		position: relative;
		border: 2px solid white;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.2);
		cursor: move;
		pointer-events: auto;
	}

	.grid-lines {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.grid-lines::before, .grid-lines::after {
		content: '';
		position: absolute;
		background: rgba(255, 255, 255, 0.3);
	}

	.grid-lines::before {
		inset: 33.33% 0;
		border-top: 1px solid rgba(255, 255, 255, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.3);
	}

	.grid-lines::after {
		inset: 0 33.33%;
		border-left: 1px solid rgba(255, 255, 255, 0.3);
		border-right: 1px solid rgba(255, 255, 255, 0.3);
	}

	.handle {
		position: absolute;
		width: 12px;
		height: 12px;
		background: white;
		border: 1px solid #000;
		border-radius: 2px;
	}

	.handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
	.handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
	.handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
	.handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
	
	.handle.n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; width: 24px; }
	.handle.s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; width: 24px; }
	.handle.e { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; height: 24px; }
	.handle.w { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; height: 24px; }

	.cropper-footer {
		padding: 16px 20px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		background: var(--default-bg-color);
		border-top: var(--default-border-visible);
		gap: 16px;
	}

	.presets {
		display: flex;
		gap: 8px;
	}

	.presets button {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--default-text-color-o7);
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.presets button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.presets button.active {
		background: #4da6ff;
		border-color: #4da6ff;
		color: white;
	}

	.actions {
		display: flex;
		gap: 12px;
	}

	.btn {
		padding: 10px 20px;
		border-radius: 10px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn.primary {
		background: #4da6ff;
		color: white;
	}

	.btn.primary:hover {
		background: #3a91e6;
		transform: translateY(-1px);
	}

	.btn.secondary {
		background: rgba(255, 255, 255, 0.05);
		color: var(--default-text-color);
	}

	.btn.secondary:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.icon-btn {
		background: transparent;
		border: none;
		color: var(--default-text-color-o5);
		cursor: pointer;
		padding: 4px;
		display: flex;
		transition: color 0.2s;
	}

	.icon-btn:hover {
		color: white;
	}

	.loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		color: rgba(255, 255, 255, 0.5);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top-color: #4da6ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
