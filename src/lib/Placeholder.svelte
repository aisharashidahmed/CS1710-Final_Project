<script>
	// Gray box that marks where a chart will go.
	let { label, height = 320 } = $props();
</script>

<div class="placeholder" style:height="{height}px">
	<span>{label}</span>
</div>

<style>
	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 1.5rem 0;
		padding: 1rem;
		border: 2px dashed #bbb;
		border-radius: 8px;
		background: #f3f3f3;
		color: #777;
		text-align: center;
	}
</style>
