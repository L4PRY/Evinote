<script lang="ts">
	import backgroundImage from '$lib/assets/evi_bg.png';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import FancyButton1 from '$lib/components/buttons/FancyButton1.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(() => {
		document.title = 'Evinote • Features';
	});

	const features = [
		{
			title: 'Infinite Spatial Canvas',
			description: 'Break free from linear constraints. Organize your thoughts spatially on an infinite canvas that grows with your ideas.',
			icon: 'Layout',
			delay: '0.1s'
		},
		{
			title: 'Rich Multimedia Content',
			description: 'Embed images, audio, and video directly into your notes. Create interactive boards that bring your projects to life.',
			icon: 'Image',
			delay: '0.2s'
		},
		{
			title: 'Seamless Collaboration',
			description: 'Share your boards with others and manage access with granular permissions. Work together in real-time.',
			icon: 'Users',
			delay: '0.3s'
		},
		{
			title: 'Precision Navigation',
			description: 'Stay oriented on large boards with our integrated mini-map and smooth zoom controls. Find what you need, fast.',
			icon: 'Map',
			delay: '0.4s'
		},
		{
			title: 'Secure & Private',
			description: 'Your thoughts are yours alone. Benefit from industry-standard security and private board management.',
			icon: 'Lock',
			delay: '0.5s'
		},
		{
			title: 'Fully Responsive',
			description: 'Access and edit your boards from any device. Evinote is designed to provide a premium experience on desktop and mobile.',
			icon: 'Smartphone',
			delay: '0.6s'
		}
	];
</script>

<div class="background" style="background-image: url({backgroundImage});"></div>

<div class="features-wrapper">
	<section class="hero">
		<h1 class="gradient-text">Features that Empower Your Mind</h1>
		<p class="hero-subtitle">
			Experience a faster, more intuitive way to organize your thoughts, 
			collaborate with your team, and bring your visions to life.
		</p>
	</section>

	<div class="features-grid">
		{#each features as feature}
			<div class="feature-card" style="animation-delay: {feature.delay}">
				<div class="icon-wrapper">
					<LucideSymbol symbol={feature.icon} size={32} strokeWidth={1.5} />
				</div>
				<h3>{feature.title}</h3>
				<p>{feature.description}</p>
			</div>
		{/each}
	</div>

	<section class="cta">
		<h2>Ready to start?</h2>
		<FancyButton1 
			style="margin-top: 1.5rem; font-size: 1.1rem; padding: 0.8rem 2.5rem;" 
			onclick={() => goto(resolve('/auth/register'))}
		>
			Create your first board
		</FancyButton1>
	</section>
</div>

<style>
	.background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		background-size: cover;
		background-position: center;
		filter: brightness(0.6);
	}

	.features-wrapper {
		min-height: 100vh;
		padding: 8rem 2rem 4rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--default-text-color);
	}

	.hero {
		text-align: center;
		margin-bottom: 5rem;
		max-width: 800px;
	}

	h1 {
		font-size: 3.5rem;
		font-weight: 800;
		margin-bottom: 1.5rem;
		line-height: 1.1;
	}

	.gradient-text {
		background: var(--fancygradient);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		display: inline-block;
	}

	.hero-subtitle {
		font-size: 1.25rem;
		color: var(--default-text-color-o7);
		line-height: 1.6;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		max-width: 1200px;
		width: 100%;
	}

	.feature-card {
		background: var(--editor-interface-background);
		border: 1px solid var(--editor-interface-border);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		padding: 2.5rem;
		border-radius: 24px;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		opacity: 0;
		animation: fadeInUp 0.8s forwards;
	}

	.feature-card:hover {
		transform: translateY(-8px);
		border-color: var(--fancycolor-2);
		box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
	}

	.icon-wrapper {
		margin-bottom: 1.5rem;
		display: inline-flex;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		color: var(--fancycolor-2);
	}

	.feature-card h3 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		font-weight: 700;
	}

	.feature-card p {
		font-size: 1rem;
		color: var(--default-text-color-o7);
		line-height: 1.6;
	}

	.cta {
		margin-top: 6rem;
		text-align: center;
		padding: 4rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 32px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.05);
		width: 100%;
		max-width: 800px;
	}

	.cta h2 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 1024px) {
		.features-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.features-wrapper {
			padding-top: 6rem;
		}
		
		h1 {
			font-size: 2.5rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}

		.hero {
			margin-bottom: 3rem;
		}

		.cta {
			padding: 2rem;
		}
	}
</style>
