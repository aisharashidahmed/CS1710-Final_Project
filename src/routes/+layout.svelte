<script>
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	/* Color story, used on every chart: red = CEO pay, blue = worker pay,
	   light purple = a company (it has both), gray = a sector. */
	:global(:root) {
		--ceo: #b2182b;
		--worker: #2166ac;
		--company: #a68bd1;
		--company-dark: #5e3c99;
		--sector: #9a9a9a;
		--sector-dark: #333;
	}

	/* Highlight key numbers in the story text. */
	:global(.ceo) {
		color: var(--ceo);
		font-weight: 700;
	}

	:global(.worker) {
		color: var(--worker);
		font-weight: 700;
	}

	/* Site-wide basics. */
	:global(body) {
		margin: 0;
		background: #fff;
		color: #222;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
	}

	:global(h1) {
		margin: 0 0 0.5rem;
		font-size: 2.5rem;
		line-height: 1.15;
	}

	:global(h2) {
		margin: 0 0 0.5rem;
		font-size: 1.6rem;
		line-height: 1.25;
	}

	:global(button) {
		padding: 0.2rem 0.7rem;
		border: 1px solid #bbb;
		border-radius: 999px;
		background: #fff;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	:global(button:hover) {
		background: #f3f3f3;
	}

	:global(svg text) {
		font-family: inherit;
	}
</style>
