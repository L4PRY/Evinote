<script lang="ts">
    let scrollY = 0;

    function navbarExpand() {
        const nav = document.querySelector('nav');
        if (scrollY > 50) {
            nav?.style.setProperty('backdrop-filter', 'blur(10px)');
            nav?.style.setProperty('border', 'var(--default-border)');
            nav?.style.setProperty('width', 'calc(80vw + 20px)');
        } else {
            nav?.style.setProperty('backdrop-filter', 'none');
            nav?.style.setProperty('border', '1px solid transparent');
            nav?.style.setProperty('width', '80vw');
        }
    }
</script>

<svelte:window bind:scrollY={scrollY} on:scroll={navbarExpand} />

<div class="main">
	<nav>
        <div class="logo">
            Evinote
        </div>
		<div class="nav_island">
			<button>Explore</button>
			<div class="nav_island_divider"></div>
			<button>Dashboard</button>
			<div class="nav_island_divider"></div>
			<button>Settings</button>
		</div>
        <div class="login">
            <button class="shrink">Login</button>
        </div>
	</nav>
</div>

<style>
    .main {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 200vh;
    }
	nav {
		display: flex;
		box-sizing: border-box;
		align-items: center;
		justify-content: center;
		height: 50px;
		background-color: transparent;
		width: 80vw;
		position: fixed;
		margin-top: 20px;
		top: 0;
        z-index: 10;
        border-radius: var(--border-radius);
        transition: all 0.5s ease-in-out;
        backdrop-filter: none;
        border: 1px solid transparent;
	}
    .logo {
        font-size: 1.5rem;
        position: absolute;
        left: 20px;
    }
	.nav_island {
		display: flex;
		gap: 0;
		text-align: center;
	}
	.nav_island_divider {
		width: 1.5px;
		background: linear-gradient(
			0deg,
			var(--default-blur-color) 20%,
			var(--button-stroke-color) 40%,
			var(--button-stroke-color) 50%,
			var(--default-blur-color) 80%
		);
		backdrop-filter: blur(10px);
		border-top: var(--default-border);
		border-bottom: var(--default-border);
		cursor: pointer;
	}
	button {
		padding: 8px;
		box-sizing: border-box;
		width: 100px;
		border: var(--default-border);
        border-radius: var(--border-radius);
		background-color: var(--default-blur-color);
		color: var(--default-text-color);
		backdrop-filter: blur(5px);
		cursor: pointer;
		transition: all 0.15s ease-in-out;
		font-size: 0.875rem;
	}
	.shrink {
		width: calc(100% + 5px);
	}
	.nav_island button:hover {
		text-shadow: 0px 0px 20px var(--fancycolor-1);
		filter: brightness(1.1);
		width: 110px;
	}
	button:active {
		text-shadow: 0px 0px 20px skyblue;
	}
	.nav_island button:first-child {
		border-right: none;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	.nav_island button:last-child {
		border-left: none;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
	.nav_island button:not(:first-child):not(:last-child) {
		border-left: none;
        border-right: none;
        border-radius: 0;
	}
    .login {
        position: absolute;
        right: 12px;
    }
	.login button {
		background: var(--fancygradient);
        border: none;
	}
</style>
