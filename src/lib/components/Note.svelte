<script lang="ts">import { draggable,
  grid,
  controls,
  ControlFrom,
  events } from "@neodrag/svelte";
import type { NoteData, File } from "$lib/server/db/schema";
// import { marked } from "marked";
// import DOMPurify from "dompurify";

let { data }: { data: NoteData } = $props()
let notePosition = $state(data.position)
</script>

<div {@attach draggable([
  grid([10, 10]),
  // bounds(BoundsFrom.parent()),
  controls({allow: ControlFrom.selector('.handle')}),
  events({
    onDrag: (data) => {
      notePosition = data.offset
    },
  })
])}
class="note"
title="note">
    <div class="handle">Drag me</div>
    <h1>{data.title}</h1>
    {#each data.content as entry (entry)}
        <div class="entry">
        {#if typeof entry === 'string'}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            <!-- {@html DOMPurify.sanitize(marked.parse(entry))} -->
            <p>{entry}</p>

            <!-- todo: figre out tomorrow the deal with this -->
        {:else}
            {@const file = entry as File}
            {@const mimeType = file.mime.toString()}
            {@const url = file.location.toString()}

            {#if mimeType.startsWith('image/')}
                <img src={url} alt="" loading="lazy" />
            {:else if mimeType.startsWith('video/')}
                <video controls preload="metadata">
                    <source src={url} type={mimeType} />
                    <track kind="captions" />
                    Your browser does not support the video tag.
                </video>
            {:else if mimeType.startsWith('audio/')}
                <audio controls preload="metadata">
                    <source src={url} type={mimeType} />
                    Your browser does not support the audio tag.
                </audio>
            {:else if mimeType === 'application/pdf'}
                <object data={url} aria-labelledby="note" type="application/pdf" width="100%" height="500px">
                    <p>Unable to display PDF. <button onclick={() => window.open(url, '_blank')}>Download</button> instead.</p>
                </object>
            {:else if mimeType.startsWith('text/')}
                <iframe src={url} title="Text content" sandbox="allow-same-origin"></iframe>
            {:else}
                <button onclick={() => window.open(url, '_blank')}>Download file ({mimeType})</button>
            {/if}
        {/if}
        </div>
    {/each}
</div>

<style>
    .handle {
        background-color: oklch(28% 19% 287deg);
        &:hover {
            background-color: oklch(55% 45% 285deg);
        }
    }

    .note {
        background-color: oklch(35% 0% 0deg);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        width: 15rem;
        height: 200px;
        position: absolute;
    }
</style>
