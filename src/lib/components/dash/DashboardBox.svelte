<script lang="ts">
	const {
		href = '',
		name = '',
		src = '',
		type = 'board',
		onclick
	}: {
		href?: any;
		name?: string;
		src?: string;
		type?: 'createNew' | 'board';
		onclick?: (e: MouseEvent) => void;
	} = $props();

	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { notifications } from '$lib/stores/notifications';

	let menuOpen = $state(false);

	function toggleMenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		menuOpen = !menuOpen;
	}

	function handleAction(action: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		menuOpen = false;
		if (action === 'share') {
			navigator.clipboard.writeText(`${window.location.origin}${href}`);
			notifications.add({
				title: 'Link Copied',
				message: 'Board link successfully copied to your clipboard.',
				type: 'success',
				duration: 3000
			});
		} else if (action === 'configure') {
			// settings
		}
	}

	function handleMouseLeave() {
		menuOpen = false;
	}
</script>

<svelte:window
	onclick={() => {
		menuOpen = false;
	}}
/>

{#if type === 'board'}
	<a {href} class="dashboard-box" onmouseleave={handleMouseLeave}>
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
					<LucideSymbol symbol="ArrowRight" size={20} strokeWidth={1.5} />
				</p>
			</div>
		</div>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="actions-menu"
			class:is-open={menuOpen}
			onclick={e => {
				e.preventDefault();
				e.stopPropagation();
			}}
		>
			<div class="icon-btn" onclick={toggleMenu} aria-label="Options" aria-expanded={menuOpen}>
				{#if menuOpen}
					<LucideSymbol symbol="X" size={18} strokeWidth={2} />
				{:else}
					<LucideSymbol symbol="MoreVertical" size={20} strokeWidth={2} />
				{/if}
			</div>

			<div class="expanded-menu">
				<div class="dropdown-item" onclick={e => handleAction('configure', e)}>
					<LucideSymbol symbol="SlidersHorizontal" size={18} strokeWidth={2} />
				</div>
				<div class="dropdown-item share" onclick={e => handleAction('share', e)}>
					<LucideSymbol symbol="Share" size={18} strokeWidth={2} />
				</div>
			</div>
		</div>
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
		font-size: 1.05rem;
		font-weight: 500;
		color: var(--default-text-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 85%;
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
	}

	.actions-menu {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 20;
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
		background: var(--default-bg-color-transparent);
		border: 1px solid var(--default-stroke-color, rgba(255, 255, 255, 0.1));
		border-radius: 8px;
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		opacity: 0;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.dashboard-box:hover .actions-menu {
		opacity: 1;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.actions-menu.is-open {
		background: var(--default-bg-color);
		border: 1px solid transparent;
	}

	.icon-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--default-text-color, white);
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.icon-btn:hover {
		background: var(--default-blur-hover-color, rgba(255, 255, 255, 0.1));
	}

	.expanded-menu {
		display: flex;
		flex-direction: row;
		align-items: center;
		max-width: 0;
		opacity: 0;
		overflow: hidden;
		transition:
			max-width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
			opacity 0.2s ease;
		white-space: nowrap;
	}

	.actions-menu.is-open .expanded-menu {
		max-width: 110px;
		opacity: 1;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 8px;
		height: 32px;
		background: transparent;
		border: none;
		color: var(--default-text-color);
		font-size: 0.85rem;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s ease;
		box-sizing: border-box;
	}

	.dropdown-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	@media (max-width: 600px) {
		.dashboard-box {
			height: 275px;
		}
	}
</style>
