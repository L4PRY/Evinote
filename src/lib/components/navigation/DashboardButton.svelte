<script lang="ts">
	let { children, href } : {children: any, href? : any} = $props();
	import { page } from '$app/state';

	function isActive(path : string) {
		return page.url.pathname === path;
	}
</script>

<a href={href}>
	<div class:active={isActive(href)}>
		<img src="https://placehold.co/25x25" alt="" />
		{@render children()}
	</div>
</a>

<style>
    div {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        padding-left: 1.5rem;
        width: 100%;
        transition: all 0.3s ease-in-out;
        cursor: pointer;
        border-radius: 5px;
        margin-left: 2px;
        margin-right: 2px;
    }

    div:not(.active):hover {
        background-color: rgba(200,200,255, 0.05);
    }

    .active {
        background-color: var(--default-bar-active);
        color: var(--default-bar-color);
    }

    img {
        transition: all 0.3s ease-in-out;
    }

    .active img {
        filter: invert(100%);
    }

</style>
