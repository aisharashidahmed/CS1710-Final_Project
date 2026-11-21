<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { loadCompanies, loadHistory, loadProductivity, loadProfits, sectorOrder, ratioLabel, SECTOR_EXAMPLES } from '#lib/data.js';
	import PayHistory from '#lib/PayHistory.svelte';
	import ProductivityPay from '#lib/ProductivityPay.svelte';
	import ProfitRiver from '#lib/ProfitRiver.svelte';
	import CompanyStrip from '#lib/CompanyStrip.svelte';
	import TimelineStory from '#lib/TimelineStory.svelte';
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
		{ id: 'history', label: 'History' },
		{ id: 'sectors', label: 'Sectors' },
		{ id: 'drivers', label: 'CEO or worker pay?' },
		{ id: 'poverty', label: 'Poverty line' },
		{ id: 'message', label: 'Same industry' },
		{ id: 'profits', label: 'Profits' },
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

	// Company clicked in the scatterplot, shown in the workdays card. Amazon is shown first,
	// so the card has an answer before the reader clicks anything.
	let selectedTicker = $state('AMZN');
	let selectedCompany = $derived(data?.find((d) => d.ticker === selectedTicker) ?? null);

	let history = $state.raw(null);
	let productivity = $state.raw(null);
	let profits = $state.raw(null);

	onMount(async () => {
		[data, history, productivity, profits] = await Promise.all([
			loadCompanies(),
			loadHistory(),
			loadProductivity(),
			loadProfits()
		]);
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
		<!-- The one term the whole page depends on, defined first and big. -->
		<div class="definition">
			<p class="formula">
				<span class="term">Pay ratio</span> =
				<span class="ceo">CEO pay</span> ÷ <span class="worker">median worker pay</span>
			</p>
			<p class="example">
				At the typical S&amp;P 500 company it is <strong>190 to 1</strong>: the CEO makes in one
				year what the median worker makes in 190 years.
			</p>
		</div>
		<p class="about">
			Since 2018, public U.S. companies have had to report <strong>two numbers</strong> every year: what their CEO was
			paid, and what their <span class="worker">median worker</span> was paid. The median worker is
			the one in the middle: <strong>half the company earns more, half earns less</strong>. We use these numbers for
			<strong>492 S&amp;P 500 companies in 2021</strong>. <strong>The gap hasn't closed since</strong>: AFL-CIO's newest numbers put the
			typical S&amp;P 500 company at <strong>198 to 1 in 2025</strong>. At the end, you can look up your own company.
		</p>
		<p class="lede">
			In 2021, <span class="ceo">Amazon's CEO</span> earned <strong>6,474 times</strong> what the
			company's <span class="worker">median worker</span> earned. Both counters started when you opened
			this page.
		</p>
		<Hook />
		<a class="scroll-cue" href="#timeline">
			Amazon is <strong>the most extreme case.</strong> Scroll down to see where other companies land.
			<span class="arrow" aria-hidden="true">↓</span>
		</a>
	</section>

	<!-- Rising insight 1 -->
	<section id="timeline">
		<p class="kicker">Part 1 · Timeline</p>
		<h2>How long would a worker need to earn the CEO's yearly pay?</h2>
		<p>
			A ratio of <strong>190 to 1</strong> means the <span class="worker">median worker</span> needs <strong>190 years</strong> to
			earn what the <span class="ceo">CEO</span> got in one year. Counting back from 2021 gives the
			<strong>year they would have had to start working</strong>. Keep scrolling and the timeline zooms out, from the
			smallest gap to the biggest.
		</p>
		{#if data}
			<TimelineStory {data} />
		{:else}
			<Placeholder label="Loading timeline…" height={300} />
		{/if}
	</section>

	<!-- Rising insight 2: real history, right after the imagined time of the timeline. -->
	<section id="history">
		<p class="kicker">Part 2 · History since 1965</p>
		<h2>How did the gap get this big?</h2>
		<p>
			In 1965, CEOs at big U.S. companies made about <strong>21 times</strong> what a typical worker
			made. By 2021, it was <strong>408 times</strong>. Over the same years, the share of workers in a
			union fell from <span class="worker">28% to 10%</span>. Two lines moving in opposite directions
			<strong>don't prove one caused the other</strong>, but a union is one of the few ways workers can push back on
			pay. Hover a year to see both.
		</p>
		{#if history}
			<PayHistory {history} />
		{/if}
		<p class="source-note">
			These numbers come from the Economic Policy Institute, which studies the 350 largest U.S.
			companies and counts stock when the CEO cashes it in. That's why its 2021 ratio (408 to 1) is
			higher than the 190 to 1 at the typical S&amp;P 500 company in the rest of this page.
		</p>
	</section>

	<!-- Rising insight 3 -->
	<section id="sectors">
		<p class="kicker">Part 3 · Sectors</p>
		<h2>Which sectors have the biggest gaps?</h2>
		<p>
			A <strong>sector</strong> is a group of similar businesses, like banks or grocery chains. The <strong>bars</strong> show the
			typical pay ratio in each sector. The <strong>dots</strong> show every company, so you can see how much
			companies in the same sector differ.
		</p>
		{#if data}
			{@const focus = hoveredSector ?? selectedSector}
			<!-- Bars and dots side by side, so linking and filtering show up next to the bar you touch. -->
			<div class="side-by-side">
				<div class="bars">
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
					<p class="sector-examples">
						{#if focus}
							<strong>{focus}</strong> includes {SECTOR_EXAMPLES[focus]}.
						{:else}
							Hover a sector to see what kinds of companies it includes.
						{/if}
					</p>
				</div>
				<div class="dots">
					<p class="hint">Each dot is one company. Hover a dot for its pay details.</p>
					<CompanyStrip data={filtered} {order} {hoveredSector} />
				</div>
			</div>
		{:else}
			<Placeholder label="Loading sectors…" height={300} />
		{/if}
	</section>

	<!-- Rising insight 4 -->
	<section id="drivers">
		<p class="kicker">Part 4 · CEO pay or worker pay?</p>
		<h2>Is the gap caused by high CEO pay or low worker pay?</h2>
		<p>
			<strong>It can be either.</strong> Amazon's gap comes from its <span class="ceo">CEO's $212.7 million</span>.
			McDonald's has the <strong>5th-biggest gap</strong>, but its CEO is only the
			<strong>125th-highest paid</strong>. Its gap comes
			from its <span class="worker">median worker earning $8,897</span>.
		</p>
		{#if data}
			<!-- Card beside the scatterplot, so clicking a dot updates the card right next to it. -->
			<div class="side-by-side scatter-row">
				<div>
					<p class="hint">
						The card shows how long a CEO takes to earn their median worker's yearly pay. Click any
						dot to switch companies.
					</p>
					<WorkdaysCard company={selectedCompany} />
				</div>
				<div>
					<p class="hint">
						Each dot is one company. Dots above a dashed line have a higher pay ratio than that line.
						Hover a dot for its pay details.
					</p>
					<PayScatter {data} {selectedTicker} onselect={(t) => (selectedTicker = t)} />
				</div>
			</div>
		{:else}
			<Placeholder label="Loading companies…" height={420} />
		{/if}
		{#if data}
			<SlopeChart {data} />
		{/if}
	</section>

	<!-- Rising insight 5 -->
	<section id="poverty">
		<p class="kicker">Part 5 · Poverty line</p>
		<h2>At 34 companies, the median worker is paid below the poverty line</h2>
		<p>
			The poverty line for a family of four was <strong>$26,500</strong> in 2021. At <strong>34</strong> S&amp;P 500
			companies, the <span class="worker">median worker</span> earned less than that. Each card is
			one of those companies, with its <span class="worker">worker's pay</span> next to its
			<span class="ceo">CEO's pay</span>.
		</p>
		{#if data}
			<PovertyCards {data} />
		{/if}
	</section>

	<!-- Main message -->
	<section id="message">
		<p class="kicker">The main point</p>
		<h2>Same sector, different pay gaps</h2>
		<p>
			Each row connects the lowest and highest reported CEO-to-worker pay ratios among companies in one
			sector in our dataset. Select a sector to compare the companies' CEO and median worker compensation.
		</p>
		{#if data}
			<SectorRange {data} {order} />
		{/if}
	</section>

	<!-- What could be different: where the money went, then what sharing profits would mean. -->
	<section id="profits">
		<p class="kicker">Where did the money go?</p>
		<h2>Workers produce 4× more. Their pay grew 2.4×.</h2>
		<p>
			Until 1973, workers' pay grew as fast as what they produced. Since then, <strong>most of the extra value
			workers create has gone to company owners and profits</strong> (the shaded gap), not to their
			pay. Hover a year to compare.
		</p>
		{#if productivity}
			<ProductivityPay data={productivity} />
		{/if}
		<p class="source-note">
			Source: Economic Policy Institute, productivity and pay of U.S. workers, 1948–2024.
		</p>

		<h3 class="sub-heading">What if companies shared their profits with workers?</h3>
		<p>
			That extra value shows up as <strong>profit</strong>. Pick a company and move the slider: its
			2021 profit splits into what the company keeps and what goes to workers,
			<strong>divided equally among every employee</strong>. At most companies, sharing even 10% of
			profit is worth far more to each worker than the CEO's <strong>entire</strong> paycheck.
		</p>
		{#if profits}
			<ProfitRiver data={profits} />
		{/if}
		<p class="source-note">
			This is a what-if: profit also pays for investment and goes to shareholders. Profit and
			employees come from each company's 2021 annual report (10-K) to the SEC; for companies whose
			year ends mid-year, it is the year ending in 2022, to match the pay data. Employee counts
			include part-time workers. We show 43 companies whose workers are mostly in the U.S., and
			left out franchise restaurants and hotels, whose employee counts leave out most of the people
			who work under their name.
		</p>
	</section>

	<!-- Solution -->
	<section id="receipt">
		<p class="kicker">Your company</p>
		<h2>Print your company's pay receipt</h2>
		<p>
			Search for a company to see its CEO's pay and its median worker's pay on <strong>one receipt</strong>. You can
			<strong>download it as an image</strong> to share.
		</p>
		{#if data}
			<PayReceipt {data} />
		{/if}
	</section>

	<section id="action">
		<p class="kicker">What you can do</p>
		<h2>Take action</h2>
		<p>
			Since 2018, the Dodd-Frank Act has required public companies to report their CEO-to-worker
			pay ratio, so <strong>any worker can look it up</strong>.
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
			<li>
				<strong>Bargain together.</strong> In 2024, union workers earned about
				<span class="worker">13% more</span> than similar workers without a union. As union membership
				fell, the gap grew (see <a href="#history">Part 2</a>).
			</li>
			<li>
				<strong>Ask where the profit goes.</strong> A company's profit is in its annual report
				(10-K). Divide it by the number of employees to see what even a small share would mean for
				each worker (see <a href="#profits">the profit river</a>).
			</li>
		</ol>
	</section>

	<footer>
		<p>
			<strong>Data:</strong> AFL-CIO Executive Paywatch (Kaggle copy), S&amp;P 500 companies, fiscal
			year 2021.
			{#if data}{data.length} companies loaded.{:else}Loading data…{/if}
			Each company chooses its own "median employee" (sometimes part-time or outside the U.S.), which
			explains some extreme ratios. History (Part 2) and the union pay figure: Economic Policy
			Institute, State of Working America Data Library, 1965–2024.
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
		/* Wide layout: text and charts share one column that fills most of the screen. */
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 2rem 4rem;
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
		font-size: clamp(2.8rem, 8vw, 6rem);
		letter-spacing: -0.02em;
	}

	.definition {
		margin: 1rem 0 1.5rem;
		padding: 1.25rem 1.5rem;
		border-left: 6px solid var(--company-dark);
		border-radius: 8px;
		background: var(--card);
	}

	.formula {
		margin: 0 0 0.5rem;
		font-size: clamp(1.6rem, 3.6vw, 2.6rem);
		font-weight: 700;
		line-height: 1.2;
	}

	.term {
		color: var(--company-dark);
	}

	.example {
		margin: 0;
		font-size: clamp(1.1rem, 1.8vw, 1.35rem);
	}

	.about {
		margin: 0.5rem 0 1.25rem;
		color: #444;
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
		font-size: 1.15rem;
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
		background: var(--card);
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

	/* Wide screens: bars and dots side by side, wider than the page column like the timeline story. */
	.side-by-side {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.45fr);
		gap: 2.5rem;
		align-items: start;
		width: min(1500px, calc(100vw - 4rem));
		margin-left: calc(50% - min(750px, calc(50vw - 2rem)));
	}

	.scatter-row {
		grid-template-columns: minmax(0, 1fr) minmax(0, 2.2fr);
	}

	.sector-examples {
		min-height: 3em;
		color: #444;
	}

	@media (max-width: 1000px) {
		.side-by-side {
			display: block;
			width: auto;
			margin-left: 0;
		}

		.bars {
			max-width: 640px;
		}
	}

	.showing {
		margin-top: 2rem;
		padding: 0.5rem 0.75rem;
		border-left: 3px solid var(--sector-dark);
		background: var(--card);
	}

	.lede {
		font-size: 1.5rem;
	}

	.sub-heading {
		margin: 2.5rem 0 0.5rem;
		font-size: clamp(1.3rem, 2.2vw, 1.7rem);
	}

	.source-note {
		margin-top: 0.75rem;
		font-size: 0.9rem;
		color: #666;
	}


</style>
