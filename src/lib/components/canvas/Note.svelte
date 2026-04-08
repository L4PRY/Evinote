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

	let { data = $bindable(), remove, gridSnap = 5, readonly = false }: { data: NoteData; remove: () => void; gridSnap?: number; readonly?: boolean } = $props();
	
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
			if (!isDragging || readonly) return;

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
			if (e.button !== 0 || readonly) return;

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
			if (e.button !== 0 || readonly) return;
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
	let editingSettingsIndex = $state<number | null>(null);

	function updateEntrySetting(index: number, key: 'textAlign' | 'fontSize', value: any) {
		const entry = data.content[index];
		if (typeof entry === 'object' && entry !== null && 'type' in entry) {
			(entry as any)[key] = value;
		} else {
			const type = typeof entry === 'string' ? 'text' : 'file';
			data.content[index] = { type, value: entry as any, [key]: value };
		}
		data.content = [...data.content];
	}

	function selectColor(c: string) {
		const result: Color = { type: 'hex', value: c };
		data.color = result;
		color = c;
	}

	function resetColor() {
		data.color = 'var(--default-bg-color)';
		color = 'var(--default-bg-color)';
	}

	let showAddMenu = $state(false);
	let addingImage = $state(false);
	let newImageUrl = $state('');

	function addTextBlock() {
		data.content = [...data.content, ''];
		showAddMenu = false;
	}

	async function addImageBlock() {
		if (!newImageUrl.trim()) return;
		
		let mime = 'image/png'; // Default
		const url = newImageUrl.trim();
		
		try {
			// Try to fetch MIME type via proxy if possible (same as in +page.svelte)
			const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, { method: 'HEAD' });
			if (response.ok) {
				mime = response.headers.get('Content-Type') ?? 'image/png';
			}
		} catch (e) {
			console.error('Failed to detect MIME type, defaulting to image', e);
		}

		data.content = [...data.content, { mime, location: url }];
		newImageUrl = '';
		addingImage = false;
		showAddMenu = false;
	}

	function removeBlock(index: number) {
		const newContent = [...data.content];
		newContent.splice(index, 1);
		data.content = newContent;
	}

	function resizeEntry(node: HTMLElement, index: number) {
		let isResizing = false;
		let startY = 0;
		let startHeight = 0;

		function onPointerMove(e: PointerEvent) {
			if (!isResizing || readonly) return;
			const dy = (e.clientY - startY) / $zoomLevel;
			let newHeight = Math.max(20, startHeight + dy);
			
			const entry = data.content[index];
			if (typeof entry === 'object' && entry !== null && 'type' in entry) {
				(entry as any).height = newHeight;
			} else {
				// Convert simple entry to object-style entry on first resize
				const type = typeof entry === 'string' ? 'text' : 'file';
				data.content[index] = { type, value: entry as any, height: newHeight };
			}
			data.content = [...data.content]; // Trigger reactivity
		}

		function onPointerUp() {
			isResizing = false;
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
		}

		function onPointerDown(e: PointerEvent) {
			if (e.button !== 0 || readonly) return;
			isResizing = true;
			startY = e.clientY;
			// Get current height of the entry div
			startHeight = node.getBoundingClientRect().height / $zoomLevel;
			
			window.addEventListener('pointermove', onPointerMove);
			window.addEventListener('pointerup', onPointerUp);
			e.stopPropagation();
			e.preventDefault();
		}

		const handle = node.querySelector('.entry-resize-handle') as HTMLElement;
		if (handle) {
			handle.addEventListener('pointerdown', onPointerDown);
		}

		return {
			destroy() {
				if (handle) handle.removeEventListener('pointerdown', onPointerDown);
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
	class:resizing={isCurrentlyResizing}
	class:readonly={readonly}
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
		{#if !readonly}
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
		{/if}

		{#if isEditingMetadata && !readonly}
			<div class="config-popup" transition:fly={{ y: 8, duration: 200 }}>
				<div class="edit-toolbar">
					<input
						type="text"
						bind:value={data.title}
						onkeydown={(e) => e.key === 'Enter' && (isEditingMetadata = false)}
						class="title-input"
						placeholder="Note title..."
						autofocus={true}
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

		{#if editingSettingsIndex !== null && !readonly}
			{@const currentEntry = data.content[editingSettingsIndex]}
			{@const isObject = typeof currentEntry === 'object' && currentEntry !== null && 'type' in currentEntry}
			{@const currentTextAlign = isObject ? ((currentEntry as any).textAlign ?? 'left') : 'left'}
			{@const currentFontSize = isObject ? ((currentEntry as any).fontSize ?? 16) : 16}

			<div class="entry-settings-toolbar" transition:fly={{ y: -5, duration: 200 }}>
				<div class="toolbar-section">
					<span class="toolbar-label">Align</span>
					<div class="toolbar-buttons">
						<button 
							class:active={currentTextAlign === 'left'} 
							onclick={() => updateEntrySetting(editingSettingsIndex!, 'textAlign', 'left')}
							title="Align left"
						>
							<LucideSymbol symbol="AlignLeft" size={14} strokeWidth={2} />
						</button>
						<button 
							class:active={currentTextAlign === 'center'} 
							onclick={() => updateEntrySetting(editingSettingsIndex!, 'textAlign', 'center')}
							title="Align center"
						>
							<LucideSymbol symbol="AlignCenter" size={14} strokeWidth={2} />
						</button>
						<button 
							class:active={currentTextAlign === 'right'} 
							onclick={() => updateEntrySetting(editingSettingsIndex!, 'textAlign', 'right')}
							title="Align right"
						>
							<LucideSymbol symbol="AlignRight" size={14} strokeWidth={2} />
						</button>
						<button 
							class:active={currentTextAlign === 'justify'} 
							onclick={() => updateEntrySetting(editingSettingsIndex!, 'textAlign', 'justify')}
							title="Justify"
						>
							<LucideSymbol symbol="AlignJustify" size={14} strokeWidth={2} />
						</button>
					</div>
				</div>
				<div class="toolbar-divider"></div>
				<div class="toolbar-section">
					<span class="toolbar-label">Size</span>
					<div class="toolbar-buttons">
						<button onclick={() => updateEntrySetting(editingSettingsIndex!, 'fontSize', Math.max(8, currentFontSize - 1))}>
							<LucideSymbol symbol="Minus" size={14} strokeWidth={2} />
						</button>
						<span class="toolbar-value">{currentFontSize}px</span>
						<button onclick={() => updateEntrySetting(editingSettingsIndex!, 'fontSize', Math.min(72, currentFontSize + 1))}>
							<LucideSymbol symbol="Plus" size={14} strokeWidth={2} />
						</button>
					</div>
				</div>
				<button class="toolbar-close" onclick={() => editingSettingsIndex = null}>
					<LucideSymbol symbol="X" size={14} strokeWidth={2} />
				</button>
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
				{@const isObjectEntry = typeof entry === 'object' && entry !== null && 'type' in entry}
				{@const entryType = isObjectEntry ? (entry as any).type : (typeof entry === 'string' ? 'text' : 'file')}
				{@const entryValue = isObjectEntry ? (entry as any).value : entry}
				{@const entryHeight = isObjectEntry ? (entry as any).height : undefined}
				{@const entryTextAlign = isObjectEntry ? ((entry as any).textAlign ?? 'left') : 'left'}
				{@const entryFontSize = isObjectEntry ? ((entry as any).fontSize ?? 16) : 16}

				{@const entryRef = {
					get value() { return isObjectEntry ? (data.content[i] as any).value : (data.content[i] as string) },
					set value(v) { 
						if (isObjectEntry) (data.content[i] as any).value = v; 
						else data.content[i] = v;
					}
				}}

				<div class="entry-container" use:resizeEntry={i} style:height={entryHeight ? entryHeight + 'px' : 'auto'}>
					<div class="entry">
						{#if entryType === 'text'}
							<textarea
									readonly={readonly}
									bind:value={entryRef.value}
									onblur={() => (editingIndex = null)}
									onkeydown={(e) => {
										if (e.key === 'Tab') {
											e.preventDefault();
											const target = e.target as HTMLTextAreaElement;
											const start = target.selectionStart;
											const end = target.selectionEnd;

											const currentValue = entryRef.value;
											const newValue = currentValue.substring(0, start) + '    ' + currentValue.substring(end);
											
											entryRef.value = newValue;
											
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
									style:text-align={entryTextAlign}
									style:font-size={entryFontSize + 'px'}
								></textarea>
						{:else}
							{@const file = entryValue as File}
							{@const mimeType = file.mime.toString()}
							{@const url = file.location.toString()}

							<!-- todo later, get and check types via the server, then validate if its on the allowlist, if not then do something to stop it from loading idk -->
							{#if mimeType.startsWith('image/')}
								<img src={url} alt="" loading="lazy" draggable={false} />
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
						{#if !readonly}
							<button class="remove-entry-btn" onclick={() => removeBlock(i)} title="Remove block">
								<LucideSymbol symbol="X" size={12} strokeWidth={2} />
							</button>
							{#if entryType === 'text'}
								<button 
									class="edit-entry-btn" 
									class:active={editingSettingsIndex === i}
									onclick={() => editingSettingsIndex = editingSettingsIndex === i ? null : i} 
									title="Entry settings"
								>
									<LucideSymbol symbol="Settings2" size={12} strokeWidth={2} />
								</button>
							{/if}
							<div class="entry-resize-handle"></div>
						{/if}
					</div>
				</div>
			{/each}

			{#if !readonly}
				<div class="add-content-container" class:always-visible={showAddMenu || addingImage}>
					{#if addingImage}
						<div class="image-input-popup" transition:fly={{ y: 5, duration: 150 }}>
							<input 
								type="text" 
								bind:value={newImageUrl} 
								placeholder="Paste image URL here..." 
								onkeydown={(e) => {
									if (e.key === 'Enter') addImageBlock();
									if (e.key === 'Escape') addingImage = false;
								}}
								autofocus={true}
							/>
							<div class="image-input-actions">
								<button class="cancel-btn" onclick={() => addingImage = false}>Cancel</button>
								<button class="confirm-btn" onclick={addImageBlock}>Add Image</button>
							</div>
						</div>
					{:else if showAddMenu}
						<div class="add-menu" transition:fly={{ y: 5, duration: 150 }}>
							<button onclick={addTextBlock}>
								<LucideSymbol symbol="Type" size={14} strokeWidth={2} />
								<span>Text</span>
							</button>
							<button onclick={() => addingImage = true}>
								<LucideSymbol symbol="Image" size={14} strokeWidth={2} />
								<span>Image</span>
							</button>
							<button class="close-menu-btn" onclick={() => showAddMenu = false}>
								<LucideSymbol symbol="X" size={14} strokeWidth={2} />
							</button>
						</div>
					{:else}
						<button 
							class="add-placeholder" 
							onclick={() => showAddMenu = true}
							transition:fly={{ y: 2, duration: 200 }}
						>
							<LucideSymbol symbol="Plus" size={16} strokeWidth={2} />
							<span>Add Content</span>
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Edge resize handles -->
	{#if !readonly}
		<div class="resize-handle n" use:resizeNote={'n'}></div>
		<div class="resize-handle s" use:resizeNote={'s'}></div>
		<div class="resize-handle e" use:resizeNote={'e'}></div>
		<div class="resize-handle w" use:resizeNote={'w'}></div>

		<!-- Corner resize handles -->
		<div class="resize-handle nw" use:resizeNote={'nw'}></div>
		<div class="resize-handle ne" use:resizeNote={'ne'}></div>
		<div class="resize-handle sw" use:resizeNote={'sw'}></div>
		<div class="resize-handle se" use:resizeNote={'se'}></div>
	{/if}
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
		gap: 6px;
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
		margin-bottom: 2px;
		padding: 0;
		cursor: text;
        position: relative;


		&:hover {
			border: 2px dashed rgba(255, 255, 255, 0.1);
		}
	}

	.note.readonly .entry:hover {
		border: 2px dashed transparent;
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
		padding-bottom: 20px;

		&.editing-meta {
			overflow: visible !important;
		}

		&.dragging {
			z-index: 1000 !important;
			box-shadow: 0 10px 20px 5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
			opacity: 0.95;
			cursor: grabbing !important;
		}

		&.resizing .add-content-container {
			opacity: 0 !important;
			max-height: 0 !important;
			padding: 0 !important;
			pointer-events: none !important;
		}
	}

	.note-content-wrapper {
		flex: 1;
		overflow: visible;
		overscroll-behavior: none;
	}

	.note.manual-size .note-content-wrapper {
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}

    .entry-resize-handle {
        position: absolute;
        bottom: 0px;
        left: 0;
        right: 0;
        height: 6px;
        background: transparent;
        cursor: ns-resize;
        z-index: 5;
        transition: background 0.2s;
    }

    .entry:hover .entry-resize-handle {
        background: rgba(255, 255, 255, 0.05);
    }

    .entry-resize-handle:hover {
        background: rgba(255, 255, 255, 0.15) !important;
    }

    .entry-container {
        position: relative;
        min-height: 20px;
        overflow: hidden;
    }

    .entry {
        height: 100%;
    }

    .entry img, .entry video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 5px;
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


    .entry-container {
        position: relative;
    }

    .remove-entry-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: #1e1e1e;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: all 0.2s;
        z-index: 10;
    }

    .remove-entry-btn:hover {
        background: rgba(255, 60, 60, 0.9);
        color: white;
        border-color: rgba(255, 60, 60, 0.4);
    }
	.entry:hover .remove-entry-btn,
	.entry:hover .edit-entry-btn {
		opacity: 1;
	}

	.edit-entry-btn {
		position: absolute;
		top: 4px;
		right: 26px;
		width: 18px;
		height: 18px;
		border-radius: 4px;
		background: #1e1e1e;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0;
		transition: all 0.2s;
		z-index: 10;
	}

	.edit-entry-btn:hover, .edit-entry-btn.active {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border-color: rgba(255, 255, 255, 0.4);
	}

	.edit-entry-btn.active {
		background: #4da6ff;
		border-color: #4da6ff;
	}

	.entry-settings-toolbar {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 0;
		right: 0;
		background: #1e1e1e;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		padding: 6px 10px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		z-index: 500;
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: fit-content;
	}

	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.toolbar-label {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.toolbar-buttons {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.toolbar-buttons button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 0.2s;
	}

	.toolbar-buttons button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.toolbar-buttons button.active {
		background: rgba(77, 166, 255, 0.2);
		border-color: #4da6ff;
		color: #4da6ff;
	}

	.toolbar-divider {
		width: 1px;
		height: 20px;
		background: rgba(255, 255, 255, 0.1);
	}

	.toolbar-value {
		font-size: 0.72rem;
		color: white;
		min-width: 32px;
		text-align: center;
	}

	.toolbar-close {
		margin-left: auto;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		padding: 4px;
		display: flex;
		&:hover { color: white; }
	}

	.add-content-container {
		padding: 0 10px;
		max-height: 0;
		position: relative;
		opacity: 0;
		overflow: hidden;
		transition: all 0.2s ease-in-out;
		pointer-events: none;
	}

	.note:hover .add-content-container,
	.add-content-container.always-visible {
		padding: 0 10px 10px 10px;
		max-height: 100px;
		opacity: 1;
		pointer-events: auto;
	}

	.add-placeholder {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px;
		background: transparent;
		border: 2px dashed rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			background: rgba(255, 255, 255, 0.03);
			border-color: rgba(255, 255, 255, 0.2);
			color: rgba(255, 255, 255, 0.7);
		}
	}

	.add-menu {
		display: flex;
		align-items: center;
		gap: 4px;
		background: #252525;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		width: 100%;

		button {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			padding: 8px;
			border-radius: 6px;
			border: none;
			background: transparent;
			color: rgba(255, 255, 255, 0.8);
			font-size: 0.8rem;
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				background: rgba(255, 255, 255, 0.05);
				color: white;
			}
		}

		.close-menu-btn {
			flex: 0 0 32px;
			color: rgba(255, 255, 255, 0.4);
			&:hover { color: rgba(255, 255, 255, 0.8); }
		}
	}

	.image-input-popup {
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: #252525;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 10px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		width: 100%;

		input {
			background: rgba(0, 0, 0, 0.2);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 4px;
			color: white;
			padding: 6px 8px;
			font-size: 0.8rem;
			outline: none;

			&:focus {
				border-color: rgba(255, 255, 255, 0.3);
			}
		}
	}

	.image-input-actions {
		display: flex;
		justify-content: flex-end;
		gap: 6px;

		button {
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 0.7rem;
			cursor: pointer;
			border: none;
		}

		.cancel-btn {
			background: transparent;
			color: rgba(255, 255, 255, 0.6);
			&:hover { color: white; }
		}

		.confirm-btn {
			background: #4da6ff;
			color: white;
			&:hover { background: #3d86cc; }
		}
	}
</style>
