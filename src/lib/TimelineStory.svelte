<script>
	import * as d3 from 'd3';
	import PyramidTimeline from '#lib/PyramidTimeline.svelte';
	import CompanySearch from '#lib/CompanySearch.svelte';
	import TimeCompare from '#lib/TimeCompare.svelte';
	import { money } from '#lib/data.js';

	// Scroll story: the timeline stays on screen while text steps scroll past it.
	// Each step zooms the timeline out further, ending with free exploring.
	let { data } = $props();

	const byTicker = (t) => data.find((d) => d.ticker === t);
	const berkshire = byTicker('BRK.B');
	const amazon = byTicker('AMZN');
	const typicalYear = d3.median(data, (d) => d.startYear);
	const typicalRatio = d3.median(data, (d) => d.ratio);
	const yearLabel = (y) => (y < 0 ? `${-y} BCE` : `${y}`);

	const steps = [
		{ view: { start: 1950, end: 2025 }, pinned: berkshire },
		{
			view: { start: 1500, end: 2025 },
			marker: { year: typicalYear, label: `Typical company: ${typicalYear}` }
		},
		{ view: { start: -5000, end: 2025 }, pinned: amazon },
		{ view: { start: -5000, end: 2025 }, explore: true }
	];

	let current = $state(0);
	let step = $derived(steps[current]);

	// Last step: the reader picks the company, by searching or clicking a dot.
	// $state.raw keeps the plain company object so the timeline can match it to its dot.
	let picked = $state.raw(amazon);

	// Readers who prefer less motion jump instead of scrolling smoothly.
	const smooth = () =>
		window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

	// A step becomes current when it crosses the middle of the screen.
	let stepEls = $state([]);
	$effect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) current = +entry.target.dataset.index;
				}
			},
			{ rootMargin: '-50% 0px -50% 0px' }
		);
		for (const el of stepEls) if (el) observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<!-- Arrow button at the bottom of a card that scrolls the next card to the middle of the screen. -->
{#snippet next(i)}
	<button
		type="button"
		class="next"
		onclick={() => stepEls[i].scrollIntoView({ behavior: smooth(), block: 'center' })}
	>
		Next <span class="arrow" aria-hidden="true">↓</span>
	</button>
{/snippet}

<div class="scrolly">
	<div class="graphic">
		<PyramidTimeline
			{data}
			view={step.view}
			pinned={step.explore ? picked : (step.pinned ?? null)}
			marker={step.marker ?? null}
			onpick={step.explore ? (d) => (picked = d) : null}
		/>
	</div>

	<div class="steps">
		<div class="step" class:active={current === 0} data-index="0" bind:this={stepEls[0]}>
			<p class="label">A small gap</p>
			<p>
				At <strong>Berkshire Hathaway</strong>, CEO Warren Buffett was paid
				<span class="ceo">{money(berkshire.ceoPay)}</span>, while the median worker earned
				<span class="worker">{money(berkshire.workerPay)}</span>. That is a ratio of only
				<strong>{berkshire.ratio} to 1</strong>.
			</p>
			<p>
				So the worker would need just <strong>{berkshire.ratio} years</strong> to earn the CEO's
				yearly pay, starting in <strong>{berkshire.startYear}</strong>. A low ratio means the CEO's pay
				is close to the worker's.
			</p>
			<p class="note">
				Buffett's wealth comes from owning Berkshire shares, not from his paycheck.
			</p>
			{@render next(1)}
		</div>

		<div class="step" class:active={current === 1} data-index="1" bind:this={stepEls[1]}>
			<p class="label">A typical gap</p>
			<p>
				A gap that small is rare. At the typical S&amp;P 500 company, the pay ratio is
				<strong>{typicalRatio} to 1</strong>, so the worker would have had to start in
				<strong>{typicalYear}</strong>, <strong>before the U.S. Civil War</strong>.
			</p>
			<p>Half of all companies land even further back.</p>
			{@render next(2)}
		</div>

		<div class="step" class:active={current === 2} data-index="2" bind:this={stepEls[2]}>
			<p class="label">The largest gap</p>
			<p>
				At <strong>Amazon</strong>, the CEO was paid <span class="ceo">{money(amazon.ceoPay)}</span>
				and the median worker <span class="worker">{money(amazon.workerPay)}</span>: a ratio of
				<strong>6,474 to 1</strong>.
			</p>
			<p>
				To earn the CEO's one year of pay, the worker would have had to start in
				<strong>{yearLabel(amazon.startYear)}</strong>, before the Great Pyramid of Giza was built.
				Every other company now fits on the right side of the timeline.
			</p>
			{@render next(3)}
		</div>

		<div class="step explore" class:active={current === 3} data-index="3" bind:this={stepEls[3]}>
			<p class="label">Your turn</p>
			<p>Search for a company, or click any dot on the timeline.</p>
			<CompanySearch {data} selected={picked} onpick={(d) => (picked = d)} />
			<TimeCompare company={picked} />
			<a class="next" href="#sectors">
				Next: which sectors have the biggest gaps? <span class="arrow" aria-hidden="true">↓</span>
			</a>
		</div>
	</div>
</div>

<style>
	/* Wide screens: text steps on the left, the timeline stays put on the right.
	   The story is wider than the page column (up to 1500px) so the timeline can be bigger. */
	.scrolly {
		display: grid;
		grid-template-columns: minmax(260px, 1fr) 2.6fr;
		gap: 2.5rem;
		width: min(1500px, calc(100vw - 4rem));
		margin: 1.5rem 0 0 calc(50% - min(750px, calc(50vw - 2rem)));
	}

	/* The timeline sits in the middle of the screen (below the menu) until the section ends. */
	.graphic {
		grid-column: 2;
		grid-row: 1;
		position: sticky;
		top: 3rem;
		display: flex;
		align-items: center;
		height: calc(100vh - 3rem);
		align-self: start;
	}

	.graphic > :global(*) {
		flex: 1;
	}

	.steps {
		grid-column: 1;
		grid-row: 1;
		/* Room after the last step so it can reach the middle of the screen. */
		padding-bottom: 30vh;
	}

	.step {
		margin: 0 0 60vh;
		padding: 1.25rem 1.5rem;
		border-radius: 8px;
		background: #f6f6f6;
		opacity: 0.4;
		transition: opacity 300ms;
	}

	.step:first-child {
		margin-top: 20vh;
	}

	.step.active {
		opacity: 1;
	}

	.step.explore {
		margin-bottom: 0;
	}

	.step p {
		margin: 0 0 0.75rem;
	}

	.label {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--company-dark);
	}

	.note {
		font-size: 0.9rem;
		color: #666;
	}

	/* Same bobbing arrow as the opening's scroll cue. */
	.next {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.25rem;
		padding: 0.3rem 0.8rem;
		border: 1px solid #ccc;
		border-radius: 999px;
		background: #fff;
		color: #444;
		font: inherit;
		font-size: 0.9rem;
		text-decoration: none;
		cursor: pointer;
	}

	.next:hover {
		background: #f3f3f3;
	}

	.step.explore .next {
		margin-top: 1rem;
	}

	.arrow {
		display: inline-block;
		animation: bob 1.6s ease-in-out infinite;
	}

	@keyframes bob {
		50% {
			transform: translateY(4px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.arrow {
			animation: none;
		}
	}

	/* Narrow screens: the timeline sticks to the top and the steps scroll over it. */
	@media (max-width: 900px) {
		.scrolly {
			display: block;
			width: auto;
			margin-left: 0;
		}

		.graphic {
			top: 3rem;
			height: auto;
			z-index: 1;
			background: #fff;
		}

		.steps {
			position: relative;
			z-index: 2;
		}

		.step {
			background: rgba(255, 255, 255, 0.96);
			box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
		}
	}
</style>
