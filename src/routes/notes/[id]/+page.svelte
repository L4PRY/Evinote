<script lang="ts">
    import Note from "$lib/components/Note.svelte";
</script>

<div>
    <Note data={{
      title: "uhm",
      position: {x: 0, y: 0},
      color: {type: "oklch", value: [28, 19, 287]},
      content: [
        "Hi",
        "<b>Is this thing working?</b>",
        {
          mime: "image/ico",
          location: "https://cdn.discordapp.com/attachments/750471165260071022/890684717416996954/ezgif-7-adbb629925f9.gif?ex=6984f2c8&is=6983a148&hm=1e1dfd6777c961e4f40ad1b7003d1d39971b9efbfb8ee88a26451540cce81e16&"
        },
        {
          mime: "audio/mpeg",
          location: "https://files.catbox.moe/ax3njl.mp3"
        },
        {
          mime: "video/mp4",
          location: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        }
      ]
    }} />
</div>

<style>
    div {
        position: absolute;
        margin: 0;
        left: 0;
        top: 0;
        box-sizing: border-box;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        border: 5px solid var(--default-text-color)
    }
</style>
