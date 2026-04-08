<script lang="ts">
	import type { PageProps } from './$types';
	import type { CanvasData } from '$lib/types/canvas/CanvasData';
	import type { Grid } from '$lib/types/canvas/Grid';
	import type { Color } from '$lib/types/canvas/Color';

	const { params, data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let { board, contributors } = data;

	// svelte-ignore state_referenced_locally
	const { id, user, canModify } = data;

	// State for add contributor dialog
	let showAddContributorDialog = $state(false);

	// State for delete dialog
	let showDeleteDialog = $state(false);
	let deleteEmail = $state('');
	let deletePassword = $state('');

	// Check if user is the owner
	const isOwner = user?.id === board.owner;

	let settings = $state({
		boardName: board.name,
		boardType: board.type,
		canvasWidth: board.canvas?.size.width,
		canvasHeight: board.canvas?.size.height,
		backgroundType: board.canvas?.background.type,
		backgroundValue: board.canvas?.background.value,
		thumbnail: board.canvas?.thumbnail?.location,
		gridType:
			board.canvas?.background.type === 'Grid'
				? (board.canvas.background.value as Grid).type
				: 'Dot',
		gridColor:
			board.canvas?.background.type === 'Grid'
				? (board.canvas.background.value as Grid).color.value
				: '#cccccc',
		gridLineWidth:
			board.canvas?.background.type === 'Grid' && (board.canvas.background.value as Grid).type === 'Line'
				? (board.canvas.background.value as any).width
				: 1,
		gridDotSize:
			board.canvas?.background.type === 'Grid' && (board.canvas.background.value as Grid).type === 'Dot'
				? (board.canvas.background.value as any).size
				: 20,
		gridBg:
			board.canvas?.background.type === 'Grid'
				? (board.canvas.background.value as Grid).background.value
				: '#ffffff'
	});

	function buildBackgroundObject(): CanvasData['background'] {
		if (settings.backgroundType === 'Grid') {
			return {
				type: 'Grid',
				value: settings.gridType === 'Line' 
					? {
						type: 'Line',
						background: { type: 'hex', value: settings.gridBg } as Color,
						width: Number(settings.gridLineWidth),
						color: { type: 'hex', value: settings.gridColor } as Color
					}
					: {
						type: 'Dot',
						background: { type: 'hex', value: settings.gridBg } as Color,
						size: Number(settings.gridDotSize),
						color: { type: 'hex', value: settings.gridColor } as Color
					}
			};
		} else if (settings.backgroundType === 'Solid') {
			return {
				type: 'Solid',
				value: { type: 'hex', value: settings.backgroundValue } as Color
			};
		} else if (settings.backgroundType === 'Image') {
			return {
				type: 'Image',
				value: settings.backgroundValue as unknown as URL
			};
		} else {
			return {
				type: 'Custom',
				value: settings.backgroundValue as string
			};
		}
	}

	async function handleSaveSubmit(e: SubmitEvent) {
		e.preventDefault();
		const form = new FormData();
		form.append('name', settings.boardName);
		form.append('type', settings.boardType);
		form.append(
			'size',
			JSON.stringify({ width: settings.canvasWidth, height: settings.canvasHeight })
		);
		form.append('thumbnail', settings.thumbnail?.toString() ?? '');
		form.append('background', JSON.stringify(buildBackgroundObject()));
		console.log('thumbnail is:', settings.thumbnail);

		for (const [key, value] of form.entries()) {
			console.log(`${key}: ${value}`);
		}
		try {
			const response = await fetch(`?/save`, {
				method: 'POST',
				body: form
			});

			if (response.ok) {
				// Reload the page to reflect changes
				window.location.reload();
			} else {
				console.error('Failed to save settings');
			}
		} catch (error) {
			console.error('Error saving settings:', error);
		}
	}

	async function removeContributor(userId: number) {
		const formData = new FormData();
		formData.append('userId', userId.toString());

		try {
			const response = await fetch(`?/removeuser`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				// Reload the page to reflect changes
				window.location.reload();
			} else {
				console.error('Failed to remove contributor');
			}
		} catch (error) {
			console.error('Error removing contributor:', error);
		}
	}

	async function handleAddUserSubmit(e: SubmitEvent) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch(`?/adduser`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				showAddContributorDialog = false;
				// Reset form
				form.reset();
				// Reload the page to reflect changes
				window.location.reload();
			} else {
				console.error('Failed to add contributor');
			}
		} catch (error) {
			console.error('Error adding contributor:', error);
		}
	}

	async function handleBoardDelete(e: SubmitEvent) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch(`?/delete`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				// Redirect to home page after deletion
				window.location.href = '/';
			} else {
				console.error('Failed to delete board');
			}
		} catch (error) {
			console.error('Error deleting board:', error);
		}
	}
</script>

<h1>{board.name}</h1>
<p>{canModify ? 'You can modify the settings' : "You can't modify the settings"}</p>

{#if canModify}
	<!-- Contributors Section -->
	<section>
		<h2>Contributors</h2>
		<table>
			<thead>
				<tr>
					<th>Username</th>
					<th>Permission</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{#each contributors as contributor (contributor.id)}
					<tr>
						<td>{contributor.username || 'Unknown'}</td>
						<td>{contributor.permission}</td>
						<td>
							<button onclick={() => removeContributor(contributor.id)}>Remove</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div style="margin-top: 1rem;">
			<button onclick={() => (showAddContributorDialog = true)}>Add Contributor</button>
		</div>

		{#if showAddContributorDialog}
			<dialog open>
				<h3>Add New Contributor</h3>
				<form method="POST" action="?/adduser" onsubmit={handleAddUserSubmit}>
					<div>
						<label>
							Username:
							<input type="text" name="username" required />
						</label>
					</div>
					<div>
						<label>
							Permission:
							<select name="permission" required>
								<option value="Read" selected>Read</option>
								<option value="Write">Write</option>
							</select>
						</label>
					</div>
					<button type="submit">Add</button>
					<button type="button" onclick={() => (showAddContributorDialog = false)}>Cancel</button>
				</form>
			</dialog>
		{/if}
	</section>

	<!-- Board Settings Section -->
	<section>
		<h2>Board Settings</h2>
		<form method="POST" action="?/save" onsubmit={handleSaveSubmit}>
			<div>
				<label>
					Board Name:
					<input type="text" name="boardName" bind:value={settings.boardName} />
				</label>
			</div>

			<div>
				<label>
					Board type:
					<select bind:value={settings.boardType}>
						<option value="Public">Public</option>
						<option value="Private">Private</option>
						<option value="Unlisted">Unlisted</option>
					</select>
				</label>
			</div>

			<div>
				<label>
					Thumbnail image:
					<input
						type="text"
						name="thumbnail"
						placeholder="link to an image file"
						bind:value={settings.thumbnail}
					/>
				</label>
			</div>

			<div>
				<label>
					Width:
					<input type="number" name="canvasWidth" bind:value={settings.canvasWidth} />
				</label>
			</div>

			<div>
				<label>
					Height:
					<input type="number" name="canvasHeight" bind:value={settings.canvasHeight} />
				</label>
			</div>

			<div>
				<label>
					Background Type:
					<select bind:value={settings.backgroundType}>
						<option value="Solid">Solid Color</option>
						<option value="Image">Image</option>
						<option value="Grid">Grid</option>
						<option value="Custom">Custom CSS</option>
					</select>
				</label>
			</div>

			{#if settings.backgroundType === 'Solid'}
				<div>
					<label>
						Color (Hex, todo make this a color picker):
						<input type="text" placeholder="#000000" bind:value={settings.backgroundValue} />
					</label>
				</div>
			{:else if settings.backgroundType === 'Image'}
				<div>
					<label>
						Image URL:
						<input type="url" bind:value={settings.backgroundValue} />
					</label>
				</div>
			{:else if settings.backgroundType === 'Grid'}
				<div>
					<label>
						Grid Configuration:
						<select bind:value={settings.gridType}>
							<option value="Dot">Dots</option>
							<option value="Line">Lines</option>
						</select>
					</label>
					<label>
						Grid Color (Hex):
						<input type="text" placeholder="#cccccc" bind:value={settings.gridColor} />
					</label>
					<label>
						Grid background color (Hex):
						<input type="text" placeholder="#cccccc" bind:value={settings.gridBg} />
					</label>
					{#if settings.gridType === 'Line'}
						<label>
							Line Width (px):
							<input type="number" min="1" max="20" bind:value={settings.gridLineWidth} />
						</label>
					{:else}
						<label>
							Dot Size (px):
							<input type="number" min="2" max="50" bind:value={settings.gridDotSize} />
						</label>
					{/if}
				</div>
			{:else if settings.backgroundType === 'Custom'}
				<div>
					<label>
						Custom CSS:
						<textarea bind:value={settings.backgroundValue}></textarea>
					</label>
				</div>
			{/if}

			<button type="submit">Save Settings</button>
		</form>
	</section>

	<!-- Delete Board Section -->
	{#if isOwner}
		<section>
			<h2>Danger Zone</h2>
			<button
				onclick={() => (showDeleteDialog = true)}
				style="background-color: red; color: white;"
			>
				Delete Board
			</button>

			{#if showDeleteDialog}
				<dialog open>
					<h3>Delete Board</h3>
					<p>This action cannot be undone. Please enter your credentials to confirm.</p>
					<form method="POST" action="?/delete" onsubmit={handleBoardDelete}>
						<div>
							<label>
								Email:
								<input type="email" name="email" bind:value={deleteEmail} required />
							</label>
						</div>
						<div>
							<label>
								Password:
								<input type="password" name="password" bind:value={deletePassword} required />
							</label>
						</div>
						<button type="submit">Delete Board</button>
						<button type="button" onclick={() => (showDeleteDialog = false)}>Cancel</button>
					</form>
				</dialog>
			{/if}
		</section>
	{/if}
{/if}
