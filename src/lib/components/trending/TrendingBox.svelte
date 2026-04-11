<script lang="ts">
	let {
		id,
		href = '',
		name = '',
		src = '',
		type = 'board',
		likes = 0,
		liked = false,
		onclick
	}: {
		id?: number;
		href?: any;
		name?: string;
		src?: string;
		type?: 'createNew' | 'board';
		likes?: number;
		liked?: boolean;
		onclick?: (e: MouseEvent) => void;
	} = $props();

	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { notifications } from '$lib/stores/notifications';

	let isLiked = $state(liked);
	let likesCount = $state(likes);
	let lastSyncedLiked = liked;

	let isHovered = $state(false);

	async function syncLike() {
		if (isLiked === lastSyncedLiked || !id) return;

		const targetLiked = isLiked;
		const previousSyncedLiked = lastSyncedLiked;
		const method = targetLiked ? 'POST' : 'DELETE';
		lastSyncedLiked = targetLiked;

		try {
			const res = await fetch(`/api/boards/${id}/like`, { method });

			if (res.status === 401) {
				throw new Error('Please log in to like boards');
			}

			if (!res.ok) {
				throw new Error('Failed to update like');
			}

			const data = await res.json();
			if (data && data.likes !== undefined) {
				likesCount = data.likes;
			}
		} catch (err) {
			console.error(err);
			// Rollback state on error
			isLiked = previousSyncedLiked;
			lastSyncedLiked = previousSyncedLiked;
			likesCount += isLiked ? 1 : -1;

			notifications.add({
				title: 'Error',
				message: (err as Error).message || 'Could not update like. Please try again.',
				type: 'error'
			});
		}
	}

	function toggleLike(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (!id) return;

		// Optimistic update
		isLiked = !isLiked;
		likesCount += isLiked ? 1 : -1;

		// Immediate sync
		syncLike();
	}
</script>

{#if type === 'board'}
	<a {href} class="dashboard-box">
		<div class="preview-container">
			<div class="placeholder">
				<img {src} alt="" />
			</div>
		</div>
		<div class="info">
			<h3>{name}</h3>
			<div class="arrow">
				<p>
					Go to board
					<LucideSymbol symbol="ArrowRight" size={20} strokeWidth={2} />
				</p>
			</div>
		</div>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<button
			class="stats interactive"
			class:is-liked={isLiked}
			onclick={toggleLike}
			onmouseenter={() => (isHovered = true)}
			onmouseleave={() => (isHovered = false)}
			aria-label={isLiked ? 'Unlike board' : 'Like board'}
		>
			<p>
				<LucideSymbol
					symbol="Heart"
					size={20}
					strokeWidth={2}
					fill={isLiked ? '#ff4d4d' : (isHovered ? '#ff4d4d33' : 'none')}
				/>
				{likesCount}
			</p>
		</button>
	</a>
{:else if type === 'createNew'}
	<button class="dashboard-box create-new" {onclick}>
		<div class="preview-container">
			<div class="placeholder">
				<LucideSymbol symbol="Plus" size={42} strokeWidth={1.5} />
			</div>
		</div>
	</button>
{/if}

<style>
	img {
		position: absolute;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
		top: 0;
		left: 0;
	}

	.dashboard-box {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 200px;
		border-radius: var(--border-radius);
		background-color: var(--default-bg-color-transparent);
		border: 1px solid var(--default-stroke-color);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
		position: relative;
	}

	.dashboard-box:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.5);
		border: 1px solid var(--default-stroke-color);
		background-color: var(--default-blur-hover-color);
	}

	.create-new {
		border: none;
		cursor: pointer;
	}

	.create-new:hover {
		border: none;
	}

	.preview-container {
		flex: 1;
		width: 100%;
		background: linear-gradient(135deg, var(--fancycolor-1), var(--fancycolor-2));
		opacity: 0.85;
		transition: opacity 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		position: relative;
	}

	.dashboard-box:hover .preview-container {
		opacity: 1;
	}

	.placeholder {
		position: absolute;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		/* opacity: 0.5; */
		transition: transform 0.5s ease-out;
		top: 0;
		left: 0;
	}

	.dashboard-box:hover .placeholder {
		transform: scale(1.1);
	}

	.info {
		padding: 1rem 1.2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--default-bg-color);
		border-top: 1px solid var(--default-stroke-color);
		z-index: 10;
	}

	h3 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 500;
		color: var(--default-text-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex-grow: 1;
		min-width: 0;
	}

	.arrow {
		flex-shrink: 0;
		margin-left: 0.5rem;
	}

	.arrow > * {
		color: var(--default-text-color);
		opacity: 0.4;
		transition: all 0.3s ease;
		transform: translateX(-5px);
	}

	.dashboard-box:hover .arrow > * {
		opacity: 1;
		transform: translateX(0);
		font-size: 0.95rem;
	}

	.stats {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 20;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background: var(--default-bg-color-transparent);
		border: 1px solid var(--default-stroke-color, rgba(255, 255, 255, 0.1));
		border-radius: 8px;
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		opacity: 0;
		transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
		overflow: hidden;
		min-width: 50px;
		height: 32px;
		padding: 0 0.5rem;
		color: var(--default-text-color);
	}

	.dashboard-box:hover .stats {
		opacity: 1;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.stats.interactive {
		cursor: pointer;
		border: 1px solid var(--default-stroke-color, rgba(255, 255, 255, 0.1));
	}

	.stats.interactive:hover {
		background: rgba(255, 0, 0, 0.15);
		border-color: rgba(255, 0, 0, 0.3);
		color: #ff4d4d;
		transform: scale(1.05);
	}

	.stats.interactive:active {
		transform: scale(0.95);
	}

	.stats.interactive.is-liked {
		color: #ff4d4d;
	}

	.stats p {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
	}

	@media (max-width: 600px) {
		.dashboard-box {
			height: 275px;
		}
	}
</style>
