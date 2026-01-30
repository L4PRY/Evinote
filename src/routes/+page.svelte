<script>
    // import backgroundImage from '$lib/assets/6229893.jpg';
    import backgroundImage from '$lib/assets/evi_bg.png';
</script>

<svelte:body></svelte:body>

<div class="background" style="background-image: url({backgroundImage});">
</div>

<div class="content">
    <slot />

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

</style>
