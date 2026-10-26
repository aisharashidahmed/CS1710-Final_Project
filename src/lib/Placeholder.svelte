<script>
	// Box that marks where a chart will go. With `plan`, it describes the planned chart.
	// plan = { shows, interaction }; novel marks our innovative view.
	let { label, height = 320, plan = null, novel = false } = $props();
</script>

<div class="placeholder" class:novel style:min-height="{height}px">
	{#if plan}
		<span class="tag">{novel ? 'Coming soon · novel view' : 'Coming soon'}</span>
		<strong>{label}</strong>
		<p><b>Shows:</b> {plan.shows}</p>
		<p><b>Interaction:</b> {plan.interaction}</p>
	{:else}
		<span>{label}</span>
	{/if}
</div>

<style>
	.placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		margin: 1.5rem 0;
		padding: 1rem 1.5rem;
		border: 2px dashed #bbb;
		border-radius: 8px;
		background: #f3f3f3;
		color: #555;
		text-align: center;
	}

	.placeholder.novel {
		border-color: var(--ceo);
		background: #fbf1f1;
	}

	.tag {
		padding: 0.1rem 0.6rem;
		border-radius: 999px;
		background: #555;
		color: #fff;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.novel .tag {
		background: var(--ceo);
	}

	p {
		max-width: 560px;
		margin: 0.25rem 0 0;
		font-size: 0.9rem;
	}
</style>
