<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { loadCompanies, sectorOrder, ratioLabel } from '#lib/data.js';
	import CompanyStrip from '#lib/CompanyStrip.svelte';
	import PayScatter from '#lib/PayScatter.svelte';
	import WorkdaysCard from '#lib/WorkdaysCard.svelte';
	import Hook from '#lib/Hook.svelte';
	import Placeholder from '#lib/Placeholder.svelte';
	import SectorBars from '#lib/SectorBars.svelte';

	// Every company, loaded once and shared by all the charts below.
	let data = $state.raw(null);

	// Sector rows stay in this order (highest median ratio first) in every chart.
	let order = $derived(data ? sectorOrder(data) : []);

	// Linking (highlight only): hovering a sector bar dims other sectors' dots.
	let hoveredSector = $state(null);

	// Filtering: clicking a sector bar keeps only that sector's companies (click again to clear).
	let selectedSector = $state(null);

	// The dot plot and the summary line read this subset; the bars keep every sector.
	let filtered = $derived(
		data && selectedSector ? data.filter((d) => d.sector === selectedSector) : data
	);

	// Company clicked in the scatterplot, shown in the workdays card (click again to clear).
	let selectedTicker = $state(null);
	let selectedCompany = $derived(data?.find((d) => d.ticker === selectedTicker) ?? null);

	onMount(async () => {
		data = await loadCompanies();
	});
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
		{#if data}
			<p class="hint">Hover a sector to highlight its companies. Click a sector to show only it.</p>
			<SectorBars
				{data}
				{order}
				{hoveredSector}
				{selectedSector}
				onhover={(s) => (hoveredSector = s)}
				onselect={(s) => (selectedSector = selectedSector === s ? null : s)}
			/>
			<p class="showing">
				Showing <strong>{filtered.length}</strong> companies in
				<strong>{selectedSector ?? 'all sectors'}</strong> · median pay ratio
				<strong>{ratioLabel(d3.median(filtered, (d) => d.ratio))}</strong>
				{#if selectedSector}
					· <button onclick={() => (selectedSector = null)}>Show all sectors</button>
				{/if}
			</p>
			<p class="hint">Each dot is one company. Hover a dot for its pay details.</p>
			<CompanyStrip data={filtered} {order} {hoveredSector} />
		{:else}
			<Placeholder label="Loading sectors…" height={300} />
		{/if}
	</section>

	<!-- Rising insight 3 -->
	<section id="drivers">
		<h2>Is it high pay at the top, or low pay at the bottom?</h2>
		<p>
			The companies with the most extreme ratios are not always the ones with the highest-paid
			CEOs.
		</p>
		{#if data}
			<p class="hint">
				Each dot is one company. Dots above a dashed line have a higher pay ratio than that line.
				Hover a dot for its pay details. Click a dot to see how long its CEO takes to earn a worker's
				year.
			</p>
			<WorkdaysCard company={selectedCompany} />
			<PayScatter
				{data}
				{selectedTicker}
				onselect={(t) => (selectedTicker = selectedTicker === t ? null : t)}
			/>
		{:else}
			<Placeholder label="Loading companies…" height={420} />
		{/if}
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

	<footer>
		Data: AFL-CIO Executive Paywatch (Kaggle copy), S&amp;P 500 companies, fiscal year 2021.
		{#if data}{data.length} companies loaded.{:else}Loading data…{/if}
	</footer>
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

	footer {
		padding-top: 2rem;
		font-size: 0.85rem;
		color: #666;
	}

	.hint {
		font-size: 0.85rem;
		color: #666;
	}

	.showing {
		margin-top: 1.5rem;
	}

	.lede {
		font-size: 1.25rem;
	}
</style>
