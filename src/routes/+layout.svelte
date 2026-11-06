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

		/* Page colors: warm off-white page, cards are a deeper shade of the same color. */
		--bg: #faf6ef;
		--card: #efe6d6;
		--ceo-tint: #fbeeee;
		--worker-tint: #ecf2f9;
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

	/* Links to sections (#timeline, ...) scroll smoothly, unless the reader prefers less motion. */
	@media (prefers-reduced-motion: no-preference) {
		:global(html) {
			scroll-behavior: smooth;
		}
	}

	/* Wrap each chart in class="chart". On phones the chart keeps a readable minimum width
	   and scrolls sideways instead of shrinking its labels to an unreadable size. */
	@media (max-width: 640px) {
		:global(.chart) {
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}

		:global(.chart > svg) {
			min-width: 600px;
		}
	}

	/* Site-wide basics. */
	:global(body) {
		margin: 0;
		font-size: 18px;
		background: var(--bg);
		color: #222;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
	}

	:global(h1) {
		margin: 0 0 0.5rem;
		font-size: 3rem;
		line-height: 1.15;
	}

	:global(h2) {
		margin: 0 0 0.75rem;
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		line-height: 1.25;
	}

	:global(button) {
		padding: 0.2rem 0.7rem;
		border: 1px solid #bbb;
		border-radius: 999px;
		background: var(--card);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	:global(button:hover) {
		background: #e6dbc7;
	}

	:global(svg text) {
		font-family: inherit;
	}
</style>
