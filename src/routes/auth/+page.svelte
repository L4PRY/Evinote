<script lang="ts">
	import backgroundImage from '$lib/assets/evi_bg.png';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
        document.title = "Evinote • Login";
    });

	let { form }: { form: ActionData } = $props();
</script>

<div class="background" style="background-image: url({backgroundImage});"></div>

<section class="login-wrapper">
    <h1>Login</h1>
    <form method="post" action="?/login" use:enhance>
		<div class="flex flex-col gap-4 w-full max-w-sm justify-center items-center">
			<input
				type="text"
				name="username"
				placeholder="Username"
				class="input-field"
			/>
			<input
				type="password"
				name="password"
				placeholder="Password"
				class="input-field"
			/>
			<button type="submit" class="submit-btn">
				Login
			</button>
			<a href="/auth/register" class="text-link">Create an account</a>
	    </div>
    </form>
    {#if form?.message}
		<p class="error-message">{form?.message}</p>
	{/if}
</section>

<style>
/* Háttér */
.background {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: -1;
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
}

/* Bejelentkezési form */
.login-wrapper {
	min-height: 60vh;
	display: flex;
	padding: 3rem;
	width: 100%;
	max-width: 400px;
	justify-content: center;
	flex-direction: column;
	align-items: center;
	margin: 0 auto;
	border-radius: 15px;
		/* üveghatás */
		/* background: rgba(33, 33, 33, 0.45);  */
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);

		/* keret */
		border: 2px solid rgba(207, 24, 24, 0.1);

		/* árnyék */
		box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);

	/* Középre igazítás */
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

/* Cím */
h1 {
	font-size: 2rem;
	color: white;
	font-weight: 600;
	margin-bottom: 1.5rem;
}

/* Input mezők */
.input-field {
	width: 100%;
	padding: 0.75rem;
	border-radius: 8px;
	border: 1px solid #1a1919;
	background-color: #2b2a2a;
	font-size: 1rem;
	transition: border-color 0.3s, box-shadow 0.3s;
}

.input-field:focus {
	border-color: #3182ce;
	box-shadow: 0 0 8px rgba(49, 130, 206, 0.6);
	outline: none;
}

/* Gomb */
.submit-btn {
	width: 100%;
	padding: 0.75rem;
	border-radius: 8px;
	background-color: #3182ce;
	color: white;
	font-size: 1.125rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	transition: background-color 0.3s ease;
}

.submit-btn:hover {
	background-color: #2b6cb0;
}

.submit-btn:focus {
	outline: none;
	box-shadow: 0 0 10px rgba(49, 130, 206, 0.8);
}

/* Link */
.text-link {
	color: #3182ce;
	font-size: 0.875rem;
	font-weight: 500;
	text-decoration: none;
	transition: color 0.3s;
}

.text-link:hover {
	color: #2b6cb0;
	text-decoration: underline;
}

/* Hiba üzenet */
.error-message {
	color: #e53e3e;
	font-size: 0.875rem;
	text-align: center;
	margin-top: 1rem;
}
</style>
