<script>
	import backgroundImage from '$lib/assets/evi_bg.png';
	import { onMount } from 'svelte';

	onMount(() => {
		document.title = 'Evinote • About';
	});
    
	export const load = () => {
	return {
		mode: 'scroll'
	};
};



	const team = [
		{
			name: 'Mátyás',
			role: 'Backend / Projektgazda',
			avatar: 'https://github.com/slopslug.png',
			githubUsername: 'slopslug',
			glowColor: '#8e33ff'
		},
		{
			name: 'Dávid',
			role: 'Frontend fejlesztő',
			avatar: 'https://github.com/davidlados511.png',
			githubUsername: 'davidlados511',
			glowColor: '#ff7564'
		},
		{
			name: 'Patrik',
			role: 'Frontend/Backend fejlesztő',
			avatar: 'https://github.com/L4PRY.png',
			githubUsername: 'L4PRY',
			glowColor: '#f1f1fc'
		}
	];
</script>

<div class="background" style="background-image: url({backgroundImage});"></div>

<section class="about-wrapper">
	<div class="about-content">
		<h1>Meet Our Team</h1>

		<p class="about-text">
			<strong>Evinote</strong> is a web application for note-taking, aimed at simple, transparent,
			and fast note management. The project is being developed for learning purposes, utilizing
			modern web technologies.
			<br /><br />
			We are working on it as a small team, focusing on a clean user experience and well-structured frontend
			solutions.
		</p>

		<div class="team-card">
			{#each team as member (member.name)}
				<a
					href="https://github.com/{member.githubUsername}"
					target="_blank"
					class="member-link"
					style="--glow-color: {member.glowColor};"
				>
					<div class="member">
						<img
							src="https://github.com/{member.githubUsername}.png?s=150"
							alt={member.name}
							style="--glow-color: {member.glowColor};"
						/>
						<h3>{member.name}</h3>
						<span>{member.role}</span>
					</div>
				</a>
			{/each}
		</div>

		<div class="about-buttons">
			<a href="https://github.com/L4PRY/Evinote" target="_blank" class="button-link">
				<div>
					<img
						src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
						alt="GitHub Logo"
						class="button-img"
					/>
					<p>View on GitHub</p>
				</div>
			</a>
		</div>
	</div>
</section>

<style>
	.background {
		position: fixed; /* Fixen a háttérben marad */
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -1; /* Behelyezi a tartalom mögé */
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.about-wrapper {
		min-height: calc(100vh - 80px);
		display: flex;
		padding: 5rem;
		padding-top: 0px;
		min-width: 800px;
		width: 50vw;
		justify-content: center;
		align-items: center;
		margin: 0 auto;
		border-radius: 20px;
		background: #333333;
		background: transparent;

		/* üveghatás */
		/* background: rgba(33, 33, 33, 0.45);  */
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);

		/* keret */
		border: 2px solid rgba(207, 24, 24, 0.1);

		/* árnyék */
		box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
	}

	.about-content {
		max-width: 1000px;
		text-align: center;
	}

	h1 {
		font-size: 3rem;
		margin-bottom: 1.5rem;
		color: #f5f5f5;
	}

	.about-text {
		max-width: 700px;
		margin: 0 auto 3rem auto;
		font-size: 1.05rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.75);
	}

	.team-card {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1.5rem;
		padding: 2rem;
		border-radius: 20px;
		background: rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(10px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
	}

	.member {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.member img {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.2);
		background: #111;
		transition: all 0.2s ease-in-out;
	}

	.member h3 {
		margin: 0.5rem 0 0 0;
		font-size: 1rem;
		color: #fff;
	}

	.member span {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.member-link {
		text-decoration: none; /* Eltünteti az aláhúzást */
		color: inherit; /* Megtartja a szövegszíneket */
		display: flex;
		justify-content: center;
		transition: all 0.2s ease-in-out;
	}

	.member-link:hover {
		transform: translateY(-10px); /* Kicsit felemelkedik, ha rátolod az egeret */
	}

	.member-link:hover img {
		border-color: var(--glow-color); /* Dynamic border color */
		box-shadow: 0 0 15px var(--glow-color); /* Dynamic glow effect */
	}

	.about-buttons {
		display: flex;
		justify-content: space-around;
		margin-top: 2rem;
		gap: 20px;
	}

	.button-link {
		background: rgba(0, 0, 0, 0.35);
		color: white;
		padding: 10px 15px;
		border-radius: 20px;
		text-decoration: none;
		transition: background-color 0.3s;
		backdrop-filter: blur(5px);
		width: 100%;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
	}

	.button-link div {
		display: flex;
		flex-direction: row;
		align-items: center;
		column-gap: 20px;
		justify-content: start;
	}

	.button-link:hover {
		background-color: #4e335328;
	}

	.button-link p {
		font-size: 1.1rem;
		width: fit-content;
	}

	.button-img {
		width: 75px;
		height: 75px;
		border-radius: 50%;
		filter: opacity(0.8);
	}
</style>

