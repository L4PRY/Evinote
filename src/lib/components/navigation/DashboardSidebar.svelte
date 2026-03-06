<script lang="ts">
	import DashboardButton from './DashboardButton.svelte';
</script>

<aside>
	<div class="logo-container">
		<img class="logo" alt="Evinote" src="https://placehold.co/600x400" />
	</div>
	<nav>
		<ul>
			<li><DashboardButton symbol="LayoutDashboard" href="/dashboard">Overview</DashboardButton></li>
			<li><DashboardButton symbol="NotebookPen" href="asfda">Projects</DashboardButton></li>
			<li><DashboardButton symbol="UsersRound" href="asdfa2">Groups</DashboardButton></li>
		</ul>
		<ul class="lower">
			<li><DashboardButton symbol="Settings" href="/dashboard/settings">Settings</DashboardButton></li>
		</ul>
	</nav>
</aside>

<!-- <div class="bottom-bar"></div> -->

<style>
	.logo {
	    font-size: 1.5em;
		margin: auto;
		width: 100%;
		height: 50px;
		object-fit: cover;
	}

	.logo:hover{filter: opacity(0);}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		border-top: var(--default-border);
		display: flex;
		flex-direction: column;
	}

	ul:first-child {
	    padding-top: 5px;
    }

    ul:last-child {
	    padding-bottom: 5px;
    }

    li {
       margin-bottom: -15px;
       margin-top: -15px;
    }

	.lower {
		position: absolute;
		bottom: 0px;
		width: 100%;
	}

	aside {
		position: fixed;
		width: 150px;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
		background-color: var(--default-bar-color);
		border-right: var(--default-border);
		height: 100%;
	}

	/*.bottom-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 100px;
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
		background-color: var(--default-bar-color);
		border-top: var(--default-border);
		z-index: -1;
	}*/
</style>
