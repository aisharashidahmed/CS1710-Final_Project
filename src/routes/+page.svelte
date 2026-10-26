<script>
	import Hook from '#lib/Hook.svelte';
	import Placeholder from '#lib/Placeholder.svelte';
</script>

<svelte:head>
	<title>The CEO Pay Gap</title>
</svelte:head>

<main>
	<!-- Hook -->
	<section id="hook">
		<h1>The CEO Pay Gap</h1>
		<p class="lede">
			In 2021, Amazon's CEO earned 6,474 times what the company's median worker earned. Watch that
			gap grow while you read.
		</p>
		<Hook />
		<p>Every company tells a version of this story. Scroll to see where yours fits.</p>
	</section>

	<!-- Rising insight 1 -->
	<section id="timeline">
		<h2>When would you have had to start working?</h2>
		<p>
			A company's pay ratio is also the number of years its median worker would need to work to
			earn what the CEO made in one year.
		</p>
		<Placeholder label="Pyramid timeline: the year each company's median worker would have had to start" />
	</section>

	<!-- Rising insight 2 -->
	<section id="sectors">
		<h2>Which sectors have the biggest gaps?</h2>
		<p>Every sector has a large gap, but the companies inside each sector differ even more.</p>
		<Placeholder label="Sector bar chart (median pay ratio)" height={300} />
		<Placeholder label="Company dot plot, linked to the sector bars" height={360} />
	</section>

	<!-- Rising insight 3 -->
	<section id="drivers">
		<h2>Is it high pay at the top, or low pay at the bottom?</h2>
		<p>
			The companies with the most extreme ratios are not always the ones with the highest-paid
			CEOs.
		</p>
		<Placeholder label="Scatterplot: median worker pay vs. CEO pay, with a workdays card" height={420} />
		<Placeholder label="Slope chart: CEO pay rank vs. pay ratio rank" />
	</section>

	<!-- Rising insight 4 -->
	<section id="poverty">
		<h2>Below the poverty line</h2>
		<p>
			At 34 S&amp;P 500 companies, the median worker earns less than the poverty line for a family
			of four.
		</p>
		<Placeholder label="Callout: companies whose median worker is below the poverty line" height={200} />
	</section>

	<!-- Main message -->
	<section id="message">
		<h2>Same industry, different choices</h2>
		<p>
			Competitors in the same sector have very different gaps, so the size of the gap is a company
			decision, not an industry rule.
		</p>
		<Placeholder label="Most vs. least equal company in each sector" />
	</section>

	<!-- Solution -->
	<section id="receipt">
		<h2>Get your company's pay receipt</h2>
		<p>Pick a company and see when its CEO "earned" a year of your pay.</p>
		<Placeholder label="Pay receipt (novel view): pick a company, get a shareable receipt" height={400} />
	</section>

	<section id="action">
		<h2>Take action</h2>
		<ol>
			<li>Find your company's pay ratio in its proxy statement (required since 2018).</li>
			<li>Compare it to competitors in the same sector.</li>
			<li>Use those comparisons when bargaining.</li>
		</ol>
	</section>
</main>

<style>
	main {
		max-width: 860px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
		font-family: system-ui, sans-serif;
		line-height: 1.5;
	}

	section {
		padding: 2.5rem 0;
		border-bottom: 1px solid #eee;
	}

	.lede {
		font-size: 1.25rem;
	}
</style>
