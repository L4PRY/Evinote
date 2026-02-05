<script>
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
	import backgroundImage from '$lib/assets/evi_bg.png';
	import FancyButton1 from '$lib/components/buttons/FancyButton1.svelte';
    import Divider from '$lib/components/frontend/Divider.svelte';
	import { onMount } from 'svelte';
    import { redirect } from '@sveltejs/kit';

    onMount(() => {
        document.title = "Evinote • Noteboard";
    });
</script>

<svelte:body />

<div class="background" style="background-image: url({backgroundImage});"></div>

<div class="content">
    <div class="side-by-side">
        <h1>Welcome to Evinote</h1>
	    <FancyButton1 style="margin-top: 8px; font-size: 1.2rem;" onclick={() => goto(resolve('/auth/register'))}>Get started</FancyButton1>
    </div>
    <p>Note-taking and sharing app !</p>
</div>

<style>
	.background {
		width: 100%;
		height: 100vh;
		position: absolute;
		background-size: cover;
		background-position: top;
		filter: brightness(0.7);
		top: 0;
		left: 0;
		margin: 0;
		z-index: -1;
		animation: float 6s ease-in-out infinite;
	}

    .side-by-side {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin-top: 15vh;
        gap: 20px;
    }

	h1 {
		color: white;
		font-size: 3rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
		text-align: center;
	}

    p {
        color: rgba(231, 235, 255, 0.63);
        font-size: 1.2rem;
        text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
        text-align: center;
        margin-top: 1rem;
        width: 80%;
    }
</style>
