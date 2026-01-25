<script lang="ts">
</script>

<nav>
    <div>
        <button>Explore</button>
        <button>Dashboard</button>
        <button>Settings</button>
    </div>
	
</nav>

<style>
	nav {
		display: flex;
        box-sizing: border-box;
		align-items: center;
		justify-content: center;
		height: 50px;
		background-color: transparent;
		width: 100%;
		position: absolute;
        margin-top: 20px;
        top: 0;
        left: 0;
	}
    div {
        display: flex;
        gap: 0;
    }
	button {
		padding: 7.5px 15px;
        border: var(--default-border);
        background-color: var(--default-blur-color);
        color: var(--default-text-color);
        backdrop-filter: blur(10px);
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        font-size: 0.875rem;
    }
    button:hover {
        background-color: var(--default-blur-hover-color);
    }
    button:first-child {
        border-right: none;
        border-top-left-radius: var(--border-radius);
        border-bottom-left-radius: var(--border-radius);
    }
    button:last-child {
        border-left: none;
        border-top-right-radius: var(--border-radius);
        border-bottom-right-radius: var(--border-radius);
    }
</style>
