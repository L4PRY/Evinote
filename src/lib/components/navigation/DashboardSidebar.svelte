<script lang="ts">
	import DashboardButton from './DashboardButton.svelte';
</script>

<aside>
	<h1>Evinote</h1>
	<nav>
		<ul>
			<li><DashboardButton symbol="" href="/dashboard">Overview</DashboardButton></li>
			<li><DashboardButton symbol="" href="/asfda">Projects</DashboardButton></li>
			<li><DashboardButton symbol="" href="asdfa2">Groups</DashboardButton></li>
		</ul>
		<ul class="lower">
			<li><DashboardButton symbol="" href="/dashboard/settings">Settings</DashboardButton></li>
		</ul>
	</nav>
</aside>

<div class="bottom-bar"></div>

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
		margin-top: 0.5rem;
		margin-left: 20px;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		border-top: var(--default-border);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.lower {
		position: absolute;
		bottom: 100px;
		width: 100%;
		border-top: none;
	}

	aside {
		position: absolute;
		width: 150px;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
		background-color: var(--default-bar-color);
		border-right: var(--default-border);
		height: 100%;
	}

	.bottom-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 100px;
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
		background-color: var(--default-bar-color);
		border-top: var(--default-border);
		z-index: 2;
	}
</style>
