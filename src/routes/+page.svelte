<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import FancyButton1 from '$lib/components/buttons/FancyButton1.svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { onMount } from 'svelte';

	let showcaseEl: HTMLElement;
	let tiltX = 15;
	let isHovered = false;
	let isClicked = false;

	function onScroll() {
		if (!showcaseEl) return;
		const rect = showcaseEl.getBoundingClientRect();
		const vh = window.innerHeight;
		const elementCenter = rect.top + rect.height / 2;
		const viewportCenter = vh / 2;

		const distanceFromCenter = elementCenter - viewportCenter;
		const maxDistance = vh / 2 + rect.height / 2;
		const progress = Math.min(Math.max(distanceFromCenter / maxDistance, -1), 1);

		tiltX = 10 * progress;
	}

	onMount(() => {
		document.title = 'Evinote • Redefining Notes';
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		onScroll();
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

<div class="background" style="background-image: url(/evi_bg.png);"></div>

<div class="landing-wrapper">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<!-- <div class="badge">Open Source & Free</div> -->
			<h1 class="gradient-text">Welcome to Evinote</h1>
			<p class="hero-subtitle">
				Evinote is the spatial note-taking workspace where your thoughts can take shape. Organize,
				visualize, and collaborate on Boards.
			</p>
			<div class="hero-actions">
				<FancyButton1
					style="font-size: 1.1rem; padding: 0.8rem 2.5rem;"
					onclick={() => goto(resolve('/auth/register'))}
				>
					Get started for free
				</FancyButton1>
			</div>
		</div>

		<div
			class="hero-showcase-container"
			bind:this={showcaseEl}
			onmouseenter={() => (isHovered = true)}
			onmouseleave={() => {
				isHovered = false;
				isClicked = false;
			}}
			onclick={() => (isClicked = !isClicked)}
		>
			<div class="showcase-glow" class:is-clicked={isClicked}></div>
			<img
				src={'/screenshot.png'}
				alt="Evinote Editor Showcase"
				class="hero-showcase"
				class:is-active={isHovered || isClicked}
				class:is-clicked={isClicked}
				style="transform: perspective(800px) rotateX({isClicked ? 0 : tiltX}deg) scale({isClicked
					? 1.5
					: isHovered
						? 1.05
						: 1}); "
			/>
		</div>
	</section>

	<!-- Social/Trust Section -->
	<section class="trust-section">
		<div class="trust-grid">
			<div class="trust-item">
				<span class="stat">100%</span>
				<span class="label">Open Source</span>
			</div>
			<div class="divider"></div>
			<div class="trust-item">
				<span class="stat">
					<LucideSymbol symbol="WandSparkles" size={44} />
				</span>
				<span class="label">well designed and animated</span>
			</div>
			<div class="divider"></div>
			<div class="trust-item">
				<span class="stat">0€</span>
				<span class="label">Forever Free</span>
			</div>
		</div>
	</section>

	<!-- Call to Action -->
	<section class="final-cta">
		<div class="cta-card">
			<h2>Ready to create your first board?</h2>
			<p>Join Evinote today and check out all that it has to offer!</p>
		</div>
	</section>

	<!-- Back to Top -->
	<section class="back-to-top-section">
		<button class="back-to-top-btn" onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
			<LucideSymbol symbol="ArrowUp" size={20} />
			Back to top
		</button>
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
		filter: brightness(0.5) contrast(1.1);
	}

	.landing-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--default-text-color);
		padding: 0 2rem;
		overflow-x: hidden;
	}

	/* Hero Section */
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 10rem 0 0rem 0;
		max-width: 1000px;
		width: 100%;
	}

	h1 {
		font-size: 4.5rem;
		font-weight: 800;
		line-height: 1.1;
		margin-bottom: 1.5rem;
		letter-spacing: -0.02em;
		animation: fadeInUp 0.8s ease-out;
	}

	.gradient-text {
		background: var(--fancygradient);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		font-size: 1.25rem;
		color: var(--default-text-color-o7);
		max-width: 650px;
		line-height: 1.6;
		margin-bottom: 3rem;
		animation: fadeInUp 0.8s ease-out 0.1s backwards;
	}

	.hero-actions {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		align-items: center;
		animation: fadeInUp 0.8s ease-out 0.2s backwards;
	}

	.secondary-btn {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--default-text-color);
		padding: 0.8rem 2rem;
		border-radius: 12px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.secondary-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		transform: translateY(-2px);
		border-color: rgba(255, 255, 255, 0.2);
	}

	/* Hero showcase */
	.hero-showcase-container {
		margin-top: 6rem;
		position: relative;
		width: 100%;
		max-width: 1100px;
		animation: fadeInUp 1s ease-out 0.4s backwards;
	}

	.hero-showcase.is-active {
		box-shadow: 0 30px 100px rgba(0, 0, 0, 0.7);
	}

	.hero-showcase.is-clicked {
		box-shadow: 0 50px 150px rgba(0, 0, 0, 0.9);
		cursor: zoom-out;
	}

	.showcase-glow {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 80%;
		height: 60%;
		background: radial-gradient(circle, var(--fancycolor-1) 0%, transparent 70%);
		opacity: 0.2;
		filter: blur(80px);
		z-index: -1;
		transition: all 0.6s ease;
	}

	.showcase-glow.is-clicked {
		opacity: 0.5;
		width: 120%;
		height: 100%;
	}

	.hero-showcase {
		width: 100%;
		height: auto;
		border-radius: 24px;
		box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		will-change: transform;
		cursor: zoom-in;
		position: relative;
		z-index: 5;
	}

	.hero-showcase.is-hovered {
		z-index: 100;
		box-shadow: 0 30px 100px rgba(0, 0, 0, 0.7);
	}

	/* Features Grid */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		max-width: 1100px;
		width: 100%;
		margin-top: 8rem;
	}

	.feature-card {
		background: var(--editor-interface-background);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.05);
		padding: 2.5rem;
		border-radius: 32px;
		transition: all 0.3s ease;
		animation: fadeInUp 0.8s ease-out backwards;
	}

	.feature-card:hover {
		transform: translateY(-10px);
		border-color: rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.05);
	}

	.feature-icon {
		width: 60px;
		height: 60px;
		background: var(--fancygradient);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		color: white;
		box-shadow: 0 10px 20px rgba(251, 53, 112, 0.2);
	}

	.feature-card h3 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		font-weight: 700;
	}

	.feature-card p {
		color: var(--default-text-color-o7);
		line-height: 1.6;
	}

	/* Trust Section */
	.trust-section {
		margin-top: 8rem;
		width: 100%;
		max-width: 800px;
	}

	.trust-grid {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 3rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(6px);
	}

	.trust-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.stat {
		font-size: 2.5rem;
		font-weight: 800;
		background: var(--fancygradient);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 3.5rem;
	}

	.stat :global(svg) {
		stroke: var(--fancycolor-1);
		filter: drop-shadow(0 0 15px rgba(251, 53, 112, 0.4));
		animation: stat-pulse 2s infinite ease-in-out;
		/* Reset the text-clip for the icon so it shows up */
		-webkit-text-fill-color: initial;
	}

	@keyframes stat-pulse {
		0%,
		100% {
			transform: scale(1);
			filter: brightness(1) drop-shadow(0 0 10px rgba(251, 53, 112, 0.2));
		}
		50% {
			transform: scale(1.1);
			filter: brightness(1.2) drop-shadow(0 0 20px rgba(251, 53, 112, 0.5));
		}
	}

	.label {
		text-transform: uppercase;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--default-text-color-o5);
		letter-spacing: 0.1em;
	}

	.divider {
		width: 1px;
		height: 40px;
		background: rgba(255, 255, 255, 0.1);
	}

	/* Final CTA */
	.final-cta {
		padding: 8rem 0 1rem;
		width: 100%;
		max-width: 1100px;
	}

	.cta-card {
		background: var(--fancygradient);
		border-radius: 48px;
		padding: 5rem 2rem;
		text-align: center;
		color: white;
		position: relative;
		overflow: hidden;
		box-shadow: 0 30px 60px rgba(251, 53, 112, 0.3);
	}

	.cta-card::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
		animation: rotate 20s linear infinite;
	}

	.cta-card h2 {
		font-size: 3rem;
		margin-bottom: 1rem;
		font-weight: 800;
	}

	.cta-card p {
		font-size: 1.25rem;
		opacity: 0.9;
		max-width: 500px;
		margin: 0 auto;
	}

	/* Back to Top */
	.back-to-top-section {
		padding: 4rem 0 2rem 0;
		display: flex;
		justify-content: center;
		animation: fadeInUp 1s ease-out;
	}

	.back-to-top-btn {
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--default-text-color-o7);
		padding: 0.8rem 2rem;
		border-radius: 100px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.back-to-top-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--default-text-color);
		transform: translateY(-5px);
		border-color: var(--fancycolor-2);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
	}

	/* Animations */
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

	@keyframes fadeInDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 1024px) {
		h1 {
			font-size: 3.5rem;
		}
		.features-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding: 7rem 0 3rem 0;
		}
		h1 {
			font-size: 2.75rem;
		}
		.hero-actions {
			flex-direction: column;
			width: 100%;
		}
		.secondary-btn {
			width: 100%;
		}
		.features-grid {
			grid-template-columns: 1fr;
		}
		.trust-grid {
			flex-direction: column;
			gap: 3rem;
		}
		.divider {
			display: none;
		}
		.cta-card h2 {
			font-size: 2.25rem;
		}
	}
</style>
