<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';

	interface FormProps {
		message?: string;
	}

	onMount(() => {
		document.title = 'Evinote • Sessions';
	});

	let { data, form }: { data: PageProps['data']; form: FormProps } = $props();

	function getDeviceIcon(userAgent: string) {
		const ua = (userAgent || '').toLowerCase();
		if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Smartphone';
		if (ua.includes('ipad') || ua.includes('tablet')) return 'Tablet';
		if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) return 'Monitor';
		return 'HelpCircle';
	}
</script>

<h2>Active Sessions</h2>
<p class="subtitle">Manage and sign out of your active sessions on other devices.</p>

<div class="sessions-list">
	{#each data.sessions as session (session.id)}
		{@const Icon = getDeviceIcon(session.description || '')}
		<div class="session-card">
			<div class="session-icon">
				<LucideSymbol symbol={Icon} size={48} strokeWidth={2} />
			</div>
			
			<div class="session-details">
				<p class="session-ua">{session.description || 'Unknown Device'}</p>
				<p class="session-info">Session ID: {session.id}</p>
				<p class="session-info">Created: {new Date(session.iat).toLocaleString()}</p>
			</div>

			<div class="session-actions">
				<form method="post" action="?/invalidate" use:enhance>
					<input type="hidden" name="session_id" value={session.id} />
					{#if data.user.sessionToken === session.token}
						<span class="current-session-badge">Current Session</span>
					{:else}
						<button
							class="close-session-btn"
							formaction="?/invalidate"
						>
							Close this session
						</button>
					{/if}
				</form>
			</div>
		</div>
	{/each}
</div>

<style>
	h2 {
		color: var(--default-text-color);
		font-size: 2rem;
		font-weight: 600;
	}

	.subtitle {
		color: gray;
		margin-bottom: 2rem;
	}

	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.session-card {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		padding: 1.25rem 1.5rem;
		border: var(--default-border);
		border-radius: var(--border-radius);
		background-color: var(--default-bg-color-transparent);
		transition: background-color 0.2s;
		position: relative;
		overflow: hidden;
		z-index: 0;
	}

	.session-card:hover {
		background-color: var(--default-blur-hover-color);
	}

	.session-icon {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		opacity: 0.1;
		color: var(--default-text-color);
		pointer-events: none;
		z-index: -1;
		-webkit-mask-image: linear-gradient(to right, transparent 0%, black 60%);
		mask-image: linear-gradient(to right, transparent 0%, black 60%);
	}

	.session-icon :global(svg) {
		width: 130px !important;
		height: 130px !important;
	}

	.session-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		position: relative;
		z-index: 1;
	}

	.session-ua {
		font-weight: 600;
		font-size: 1.1rem;
		margin: 0;
	}

	.session-info {
		margin: 0;
		font-size: 0.9rem;
		color: gray;
	}

	.session-actions {
		display: flex;
		align-items: center;
		min-width: 120px;
		justify-content: flex-end;
		position: relative;
		z-index: 1;
	}

	.current-session-badge {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--fancycolor-1);
		padding: 0.5rem 1rem;
		background-color: var(--default-blur-color);
		border-radius: 5px;
	}

	.close-session-btn {
		background-color: var(--default-blur-color);
		color: var(--fancycolor-2);
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 5px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: all 0.2s ease-in-out;
	}

	.close-session-btn:hover {
		background-color: var(--fancycolor-2);
		color: white;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
	}

	.close-session-btn:active {
		transform: scale(0.95);
	}

	@media (max-width: 600px) {
		.session-card {
			flex-direction: row;
			gap: 1rem;
			padding: 1.25rem;
		}

		.session-details {
			width: auto;
		}

		.session-ua {
			font-size: 0.95rem;
			word-break: break-word;
		}

		.session-info {
			font-size: 0.75rem;
		}

		.session-actions {
			min-width: 0;
			justify-content: flex-end;
		}

		.session-actions form {
			width: auto;
		}

		.close-session-btn {
			padding: 0.4rem 0.6rem;
			font-size: 0.8rem;
			width: auto;
			text-align: center;
		}

		.current-session-badge {
			display: inline-block;
			padding: 0.4rem 0.6rem;
			font-size: 0.8rem;
			width: auto;
			text-align: center;
		}
	}
</style>
