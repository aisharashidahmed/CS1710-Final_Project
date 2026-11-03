<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { loadCompanies, sectorOrder, ratioLabel } from '#lib/data.js';
	import CompanyStrip from '#lib/CompanyStrip.svelte';
	import PyramidTimeline from '#lib/PyramidTimeline.svelte';
	import PayScatter from '#lib/PayScatter.svelte';
	import WorkdaysCard from '#lib/WorkdaysCard.svelte';
	// Teammates' charts (each person edits only their own file).
	import SlopeChart from '#lib/SlopeChart.svelte';
	import PovertyCards from '#lib/PovertyCards.svelte';
	import SectorRange from '#lib/SectorRange.svelte';
	import PayReceipt from '#lib/PayReceipt.svelte';
	import Hook from '#lib/Hook.svelte';
	import Placeholder from '#lib/Placeholder.svelte';
	import SectionNav from '#lib/SectionNav.svelte';
	import SectorBars from '#lib/SectorBars.svelte';

	// Menu labels for the story sections, in page order.
	const sections = [
		{ id: 'hook', label: 'Start' },
		{ id: 'timeline', label: 'Timeline' },
		{ id: 'sectors', label: 'Sectors' },
		{ id: 'drivers', label: 'Top or bottom?' },
		{ id: 'poverty', label: 'Poverty line' },
		{ id: 'message', label: 'Same industry' },
		{ id: 'receipt', label: 'Pay receipt' },
		{ id: 'action', label: 'Take action' }
	];

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

<SectionNav {sections} />

<main>
	<!-- Hook -->
	<section id="hook">
		<p class="kicker">A data story for labor union representatives</p>
		<h1>The CEO Pay Gap</h1>
		<p class="lede">
			In 2021, <span class="ceo">Amazon's CEO</span> earned <strong>6,474 times</strong> what the
			company's <span class="worker">median worker</span> earned. Watch that gap grow while you read.
		</p>
		<Hook />
		<a class="scroll-cue" href="#timeline">
			Every company tells a version of this story. Scroll to see where yours fits.
			<span class="arrow" aria-hidden="true">↓</span>
		</a>
	</section>

	<!-- Rising insight 1 -->
	<section id="timeline">
		<p class="kicker">Part 1 · Timeline</p>
		<h2>When would you have had to start working?</h2>
		<p>
			A company's pay ratio is also the number of years its
			<span class="worker">median worker</span> would need to work to earn what the
			<span class="ceo">CEO</span> made in one year.
		</p>
		{#if data}
			<p class="hint">
				Each dot is one company, stacked by century. Hover a dot for details, or search for your
				company to pin it on the timeline.
			</p>
			<PyramidTimeline {data} />
			<p class="showing">
				Amazon's median worker would have had to start in <strong>4453 BCE</strong>, before the
				Great Pyramid was built. At <strong>180</strong> companies the start date is 1776 or
				earlier, and the typical company lands in <strong>1831</strong>.
			</p>
		{:else}
			<Placeholder label="Loading timeline…" height={300} />
		{/if}
	</section>

	<!-- Rising insight 2 -->
	<section id="sectors">
		<p class="kicker">Part 2 · Sectors</p>
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
		<p class="kicker">Part 3 · Top or bottom?</p>
		<h2>Is it high pay at the top, or low pay at the bottom?</h2>
		<p>
			The companies with the most extreme ratios are not always the ones with the
			<span class="ceo">highest-paid CEOs</span>. Sometimes the gap comes from
			<span class="worker">very low worker pay</span>.
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
		{#if data}
			<SlopeChart {data} />
		{/if}
	</section>

	<!-- Rising insight 4 -->
	<section id="poverty">
		<p class="kicker">Part 4 · Poverty line</p>
		<h2>Below the poverty line</h2>
		<p>
			At <strong>34</strong> S&amp;P 500 companies, the <span class="worker">median worker</span>
			earns less than the poverty line for a family of four.
		</p>
		{#if data}
			<PovertyCards {data} />
		{/if}
	</section>

	<!-- Main message -->
	<section id="message">
		<p class="kicker">Main message</p>
		<h2>Same industry, different choices</h2>
		<p>
			Competitors in the same sector have very different gaps, so the size of the gap is a company
			decision, not an industry rule.
		</p>
		{#if data}
			<SectorRange {data} {order} />
		{/if}
	</section>

	<!-- Solution -->
	<section id="receipt">
		<p class="kicker">Your company</p>
		<h2>Get your company's pay receipt</h2>
		<p>Pick a company and see when its CEO "earned" a year of your pay.</p>
		{#if data}
			<PayReceipt {data} />
		{/if}
	</section>

	<section id="action">
		<p class="kicker">What you can do</p>
		<h2>Take action</h2>
		<p>
			Since 2018, the Dodd-Frank Act has required public companies to report their CEO-to-worker
			pay ratio. That makes the gap something workers can look up and challenge.
		</p>
		<ol class="steps">
			<li>
				<strong>Find your company's ratio</strong> in its yearly proxy statement (search "pay ratio"
				in the company's DEF 14A filing on SEC EDGAR).
			</li>
			<li>
				<strong>Compare it to competitors</strong> in the same sector, using the charts above.
			</li>
			<li>
				<strong>Bring the comparison to the table.</strong> If a competitor pays fairly, a smaller gap
				is possible.
			</li>
		</ol>
	</section>

	<footer>
		<p>
			<strong>Data:</strong> AFL-CIO Executive Paywatch (Kaggle copy), S&amp;P 500 companies, fiscal
			year 2021.
			{#if data}{data.length} companies loaded.{:else}Loading data…{/if}
			Each company chooses its own "median employee" (sometimes part-time or outside the U.S.), which
			explains some extreme ratios.
		</p>
		<p>
			<strong>Made by</strong> Ashle Sanchez, Aisha Ahmed and Kayleen Mukire for CS 1710: Data
			Visualization, Harvard University. ·
			<a href="https://github.com/aisharashidahmed/CS1710-Final_Project">Code on GitHub</a>
		</p>
	</footer>
</main>

<style>
	main {
		max-width: 860px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
		line-height: 1.55;
	}

	section {
		padding: 3rem 0;
		border-bottom: 1px solid #eee;
		/* Leave room for the sticky menu when jumping to a section. */
		scroll-margin-top: 3rem;
	}

	/* The opening fills the first screen. */
	#hook {
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: calc(100vh - 4rem);
		/* On phones, ignore the browser's address bar when sizing the first screen. */
		min-height: calc(100svh - 4rem);
		padding-top: 1rem;
	}

	#hook h1 {
		font-size: clamp(2.6rem, 8vw, 4.5rem);
		letter-spacing: -0.02em;
	}

	.kicker {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #777;
	}

	.scroll-cue {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		margin-top: 1.5rem;
		color: #555;
		text-align: center;
		text-decoration: none;
	}

	.arrow {
		font-size: 1.5rem;
		animation: bob 1.6s ease-in-out infinite;
	}

	@keyframes bob {
		50% {
			transform: translateY(6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.arrow {
			animation: none;
		}
	}

	section > p {
		max-width: 680px;
		font-size: 1.05rem;
	}

	section > .kicker {
		margin-bottom: 0.25rem;
	}

	/* Take action: numbered cards. */
	.steps {
		display: grid;
		gap: 0.75rem;
		margin: 1.5rem 0 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.steps li {
		position: relative;
		margin: 0;
		padding: 1rem 1rem 1rem 3.25rem;
		border-radius: 8px;
		background: #f6f6f6;
		counter-increment: step;
	}

	.steps li::before {
		content: counter(step);
		position: absolute;
		top: 0.9rem;
		left: 1rem;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		background: var(--sector-dark);
		color: #fff;
		font-weight: 700;
		line-height: 1.6rem;
		text-align: center;
	}

	footer {
		padding-top: 2rem;
		font-size: 0.85rem;
		color: #666;
	}

	footer a {
		color: inherit;
	}

	@media (max-width: 640px) {
		main {
			padding-top: 1rem;
		}

		section {
			padding: 2rem 0;
		}

		.lede {
			font-size: 1.1rem;
		}
	}

	.hint {
		margin: 1rem 0 0.25rem;
		font-size: 0.85rem;
		color: #666;
	}

	.showing {
		margin-top: 2rem;
		padding: 0.5rem 0.75rem;
		border-left: 3px solid var(--sector-dark);
		background: #f5f5f5;
	}

	.lede {
		font-size: 1.3rem;
	}


</style>
