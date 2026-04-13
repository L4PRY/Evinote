<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { mode = 'scroll' }: { mode?: 'fixed' | 'scroll' | 'hidden' } = $props();

	let currentYear = new Date().getFullYear();
</script>

{#if mode !== 'hidden'}
	<footer class="footer">
		<div class="footer-container">
			<div class="footer-grid">
				<!-- Brand Section -->
				<div class="footer-section brand">
					<h2 class="footer-logo">Evinote</h2>
					<p class="footer-description">
						Modern, lightweight note taking app designed for collaboration and ease-of-use in the second dimension. 
					</p>
					<div class="social-links">
						<a href="https://github.com/L4PRY/Evinote" target="_blank" aria-label="GitHub">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
						</a>
						<a href="ttps://github.com/davidlados511/EvinoteAlk" target="_blank" aria-label="GitHub">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
						</a>
					</div>
				</div>


				<!-- Resources Section -->
				<div class="footer-section">
					<h3>Resources</h3>
					<ul>
						<li><button onclick={() => {}}>About Us</button></li>
						<li><button onclick={() => goto(resolve('/features'))}>Features</button></li>
						<li><button onclick={() => {}}>Contact</button></li>
					</ul>
				</div>

				<!-- Legal Section -->
				<div class="footer-section">
					<h3>Legal</h3>
					<ul>
						<li><button onclick={() => {}}>Privacy Policy</button></li>
						<li><button onclick={() => {}}>Terms of Service</button></li>
						<li><button onclick={() => {}}>Cookie Policy</button></li>
					</ul>
				</div>
			</div>

			<div class="footer-bottom">
				<p>&copy; {currentYear} Evinote. All rights reserved.</p>
				<div class="footer-bottom-links">
					<span>Built with ❤️ by the Evinote Team</span>
				</div>
			</div>
		</div>
	</footer>
{/if}

<style>
	.footer {
		width: 100%;
		background: var(--default-bg-color-transparent);
		backdrop-filter: blur(12px);
		border-top: var(--default-border-visible);
		padding: 4rem 0 2rem 0;
		margin-top: auto;
		color: var(--default-text-color);
		position: relative;
		z-index: 10;
	}

	.footer-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.footer-grid {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 3rem;
		margin-bottom: 3rem;
	}

	.footer-section h3 {
		font-size: 1.1rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: var(--default-text-color);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.footer-logo {
		font-size: 1.5rem;
		font-weight: 800;
		margin-bottom: 1rem;
		background: var(--fancygradient);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		display: inline-block;
	}

	.footer-description {
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--default-text-color-o7);
		margin-bottom: 1.5rem;
		max-width: 320px;
	}

	.social-links {
		display: flex;
		gap: 1rem;
	}

	.social-links a {
		color: var(--default-text-color-o7);
		transition: color 0.2s ease, transform 0.2s ease;
	}

	.social-links a:hover {
		color: var(--fancycolor-2);
		transform: translateY(-2px);
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		margin-bottom: 0.75rem;
	}

	button {
		background: none;
		border: none;
		padding: 0;
		color: var(--default-text-color-o7);
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		text-align: left;
	}

	button:hover {
		color: var(--default-text-color);
		transform: translateX(4px);
		text-shadow: 0 0 10px var(--fancycolor-2);
	}

	.footer-bottom {
		border-top: var(--default-border-visible);
		padding-top: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		color: var(--default-text-color-o5);
	}

	@media (max-width: 900px) {
		.footer-grid {
			grid-template-columns: 1fr 1fr;
			gap: 2rem;
		}
	}

	@media (max-width: 600px) {
		.footer-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.footer-bottom {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}
		
		.footer-section {
			text-align: center;
		}
		
		.footer-section ul {
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		.footer-description {
			max-width: 100%;
		}

		.social-links {
			justify-content: center;
		}
	}
</style>
