<script lang="ts">
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import FancyButton1 from '$lib/components/buttons/FancyButton1.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(() => {
		document.title = 'Evinote • Features';
	});

	function parallax(node: HTMLElement) {
		const update = () => {
			const rect = node.getBoundingClientRect();
			const winHeight = window.innerHeight;
			// progress = 0 (bottom entered) to 1 (top exited)
			const progress = Math.min(Math.max((winHeight - rect.top) / (winHeight + rect.height), 0), 1);
			node.style.setProperty('--scroll-progress', progress.toString());
		};

		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		update();

		return {
			destroy() {
				window.removeEventListener('scroll', update);
				window.removeEventListener('resize', update);
			}
		};
	}

	const features = [
		{
			title: 'Canvas With No Limits',
			description:
				'Organize your thoughts spatially on an infinite canvas that grows with your ideas.',
			icon: 'Layout',
			delay: '0.1s'
		},
		{
			title: 'Share Anything',
			description:
				'Embed images, audio, and video directly into your notes. Create interactive boards that bring your projects to life.',
			icon: 'Image',
			delay: '0.2s'
		},
		{
			title: 'Create Together',
			description: 'Share your boards with friends, work together!',
			icon: 'Users',
			delay: '0.3s'
		},
		{
			title: 'Easy Controls',
			description: 'User interface designed for ease of use. ',
			icon: 'MousePointer2',
			delay: '0.4s'
		},
		{
			title: 'Fully Responsive',
			description:
				'Access and edit your boards from any device. Evinote provides a way to share your ideas on both desktop and mobile.',
			icon: 'Smartphone',
			delay: '0.6s'
		}
	];
</script>

<div class="background" style="background-image: url(/evi_bg.png);"></div>

<div class="features-wrapper">
	<section class="hero">
		<h1 class="gradient-text">Features of Evinote</h1>
		<p class="hero-subtitle">
			Evinote is a free and open-source note-taking application that allows you to organize your
			thoughts on boards.
		</p>
	</section>

	<div class="features-container">
		{#each features as feature, i}
			<section class="feature-section" use:parallax style="animation-delay: {feature.delay}">
				<div class="content-side">
					<h3>{feature.title}</h3>
					<p>{feature.description}</p>
				</div>
				<div class="icon-side">
					<div class="background-icon">
						<LucideSymbol symbol={feature.icon} size={450} strokeWidth={1.5} />
					</div>
				</div>
			</section>
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
		margin-bottom: 3rem;
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

	.features-container {
		display: flex;
		flex-direction: column;
		gap: 5rem;
		max-width: 1400px;
		width: 100%;
	}

	.feature-section {
		display: flex;
		align-items: center;
		min-height: 450px;
		width: 100%;
		gap: 4rem;
		opacity: 0;
		animation: fadeInUp 0.8s forwards;
		position: relative;
		background: var(--editor-interface-background);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 48px;
		padding: 4rem;
		overflow: hidden;
	}

	.feature-section:nth-child(even) {
		flex-direction: row-reverse;
	}

	.content-side {
		flex: 1;
		padding: 2rem;
		z-index: 2;
		text-align: right;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.feature-section:nth-child(even) .content-side {
		text-align: left;
		align-items: flex-start;
	}

	.content-side h3 {
		font-size: 2rem;
		margin-bottom: 1rem;
		font-weight: 800;
		background: var(--fancygradient);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.content-side p {
		font-size: 1.2rem;
		color: var(--default-text-color-o7);
		line-height: 1.8;
		max-width: 500px;
	}

	.icon-side {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		height: 100%;
		min-height: 400px;
	}

	.background-icon {
		position: absolute;
		color: var(--fancycolor-2);
		opacity: 0.45;
		z-index: 1;
		pointer-events: none;
		transition:
			transform 0.1s linear,
			opacity 0.4s ease,
			filter 0.4s ease;
		filter: blur(calc(1px - var(--scroll-progress) * 2px));
		transform: rotate(calc(var(--scroll-progress) * 20deg - 10deg))
			scale(calc(0.85 + var(--scroll-progress) * 0.3))
			translateY(calc(var(--scroll-progress) * -20px + 10px));
	}

	.feature-section:nth-child(odd) .background-icon {
		mask-image: radial-gradient(circle at center, black 20%, transparent 100%);
		-webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 100%);
	}

	.feature-section:nth-child(even) .background-icon {
		mask-image: radial-gradient(circle at center, black 20%, transparent 100%);
		-webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 100%);
	}

	.feature-section:hover .background-icon {
		opacity: 0.8;
		filter: blur(0px);
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
		.features-container {
			gap: 4rem;
		}

		.content-side h3 {
			font-size: 2rem;
		}
	}

	@media (max-width: 768px) {
		.features-wrapper {
			padding: 7rem 1.5rem 4rem 1.5rem;
		}

		h1 {
			font-size: 2.5rem;
		}

		.features-container {
			gap: 2rem;
		}

		.feature-section,
		.feature-section:nth-child(even) {
			flex-direction: column;
			text-align: center;
			min-height: auto;
			gap: 1.5rem;
			padding: 2rem;
			border-radius: 32px;
		}

		.content-side {
			padding: 0;
		}

		.content-side p {
			max-width: 100%;
		}

		.icon-side {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: 100%;
			opacity: 0.25;
			pointer-events: none;
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 1;
		}

		.background-icon {
			transform: scale(0.65);
			filter: blur(2px);
		}

		.feature-section:hover .background-icon {
			transform: scale(0.7);
		}

		.hero {
			margin-bottom: 3rem;
		}

		.cta {
			padding: 2rem;
		}
	}
</style>
