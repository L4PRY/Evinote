<script lang="ts">
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { onMount } from 'svelte';

	let theme = $state<'light' | 'dark' | 'system'>('system');

	onMount(() => {
		const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
		if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
			theme = storedTheme;
		} else {
			theme = 'system';
		}
	});

	function setTheme(newTheme: 'light' | 'dark' | 'system') {
		theme = newTheme;
		localStorage.setItem('theme', theme);
		
		if (theme === 'system') {
			const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
		} else {
			document.documentElement.style.colorScheme = theme;
		}
	}
</script>

<div class="theme-switch" role="radiogroup" aria-label="Theme">
	<div 
		class="thumb" 
		style="transform: translateX({theme === 'light' ? '0' : theme === 'dark' ? '34px' : '68px'})"
	></div>
	<button 
		class="switch-btn" 
		class:active={theme === 'light'} 
		onclick={() => setTheme('light')}
		aria-label="Light Theme"
	>
		<LucideSymbol symbol="Sun" size={18} strokeWidth={2.5} />
	</button>
	<button 
		class="switch-btn" 
		class:active={theme === 'dark'} 
		onclick={() => setTheme('dark')}
		aria-label="Dark Theme"
	>
		<LucideSymbol symbol="Moon" size={18} strokeWidth={2.5} />
	</button>
	<button 
		class="switch-btn" 
		class:active={theme === 'system'} 
		onclick={() => setTheme('system')}
		aria-label="System Theme"
	>
		<LucideSymbol symbol="SunMoon" size={18} strokeWidth={2.5} />
	</button>
</div>

<style>
	.theme-switch {
		position: relative;
		display: flex;
		background-color: var(--default-stroke-color);
		border-radius: 999px;
		padding: 4px;
		gap: 2px;
	}

	.thumb {
		position: absolute;
		top: 4px;
		left: 4px;
		width: 32px;
		height: 32px;
		background-color: var(--default-bg-color);
		border-radius: 50%;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		border: 1px solid var(--border-colors);
	}

	.switch-btn {
		position: relative;
		z-index: 1;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--default-text-color);
		cursor: pointer;
		opacity: 0.5;
		transition: opacity 0.3s ease;
		border-radius: 50%;
	}

	.switch-btn.active {
		opacity: 1;
	}

	.switch-btn:hover:not(.active) {
		opacity: 0.8;
	}
</style>
