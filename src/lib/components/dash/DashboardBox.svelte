<script lang="ts">
	const {
		href,
		name = '',
		src = '',
		type = 'board'
	}: { href: any; name?: string; src?: string; type?: 'createNew' | 'board' } = $props();

	import LucideSymbol from '../frontend/LucideSymbol.svelte';
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
					<LucideSymbol symbol="ArrowRight" size={20} strokeWidth={1.5} />
				</p>
			</div>
		</div>
	</a>
{:else if type === 'createNew'}
	<a {href} class="dashboard-box create-new">
		<div class="preview-container">
			<div class="placeholder">
				<LucideSymbol symbol="Plus" size={42} strokeWidth={1.5} />
			</div>
		</div>
	</a>
{/if}

<style>
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
	}

	.dashboard-box:hover .preview-container {
		opacity: 1;
	}

	.placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		/* opacity: 0.5; */
		transition: transform 0.5s ease-out;
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
</style>
