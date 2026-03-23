<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import { flip } from 'svelte/animate';
	import { fly, fade } from 'svelte/transition';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
</script>

<div class="toast-container">
	{#each $notifications as toast (toast.id)}
		<div
			class="toast {toast.type}"
			animate:flip={{ duration: 300 }}
			in:fly={{ y: 50, duration: 300 }}
			out:fade={{ duration: 200 }}
		>
			<div class="toast-content">
				<div class="toast-icon">
					{#if toast.type === 'success'}
						<LucideSymbol symbol="CheckCircle2" size={20} strokeWidth={2} />
					{:else if toast.type === 'error'}
						<LucideSymbol symbol="AlertCircle" size={20} strokeWidth={2} />
					{:else if toast.type === 'warning'}
						<LucideSymbol symbol="AlertTriangle" size={20} strokeWidth={2} />
					{:else}
						<LucideSymbol symbol="Info" size={20} strokeWidth={2} />
					{/if}
				</div>
				<div class="toast-text">
					<h4>{toast.title}</h4>
					{#if toast.message}
						<p>{toast.message}</p>
					{/if}
				</div>
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<button class="close-btn" onclick={() => notifications.remove(toast.id)}>
					<LucideSymbol symbol="X" size={16} strokeWidth={2} />
				</button>
			</div>
			<div class="progress-bar-container">
				<div class="progress-bar" style="animation-duration: {toast.duration}ms;"></div>
			</div>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		z-index: 9999;
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		background: var(--default-bg-color, #1a202c);
		border: 1px solid var(--default-stroke-color, rgba(255, 255, 255, 0.1));
		border-radius: 12px;
		width: fit-content;
		max-width: 90vw;
		box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.toast-content {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 1rem;
	}

	.toast-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 2px;
	}

	.success .toast-icon { color: #48bb78; }
	.error .toast-icon { color: #f56565; }
	.warning .toast-icon { color: #ecc94b; }
	.info .toast-icon { color: #4299e1; }

	.toast-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.toast-text h4 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--default-text-color, #fff);
	}

	.toast-text p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--default-text-color, #a0aec0);
		opacity: 0.8;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--default-text-color, #fff);
		opacity: 0.5;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.close-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.1);
	}

	.progress-bar-container {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.05);
	}

	.progress-bar {
		height: 100%;
		background: var(--fancycolor-1, #4299e1);
		width: 100%;
		transform-origin: left;
		animation-name: progress;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}
	
	.success .progress-bar { background: #48bb78; }
	.error .progress-bar { background: #f56565; }
	.warning .progress-bar { background: #ecc94b; }

	@keyframes progress {
		0% { transform: scaleX(1); }
		100% { transform: scaleX(0); }
	}
</style>