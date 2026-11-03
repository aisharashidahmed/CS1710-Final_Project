<script>
	import * as d3 from 'd3';

	// Amazon, fiscal year 2021 (from static/data/companies.csv).
	const CEO_PAY = 212701169;
	const WORKER_PAY = 32855;
	const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

	const money = d3.format('$,.2f');
	const rate = d3.format('$,.3f');

	// Seconds since the reader opened the page.
	let seconds = $state(0);

	$effect(() => {
		const start = Date.now();
		const timer = setInterval(() => (seconds = (Date.now() - start) / 1000), 100);
		return () => clearInterval(timer);
	});
</script>

<div class="counter">
	<p class="intro">Since you opened this page ({Math.floor(seconds)} seconds ago):</p>
	<div class="row">
		<div class="box ceo-box">
			<span class="who">Amazon's CEO earned</span>
			<span class="amount">{money((CEO_PAY / SECONDS_PER_YEAR) * seconds)}</span>
			<span class="rate">{rate(CEO_PAY / SECONDS_PER_YEAR)} every second</span>
		</div>
		<div class="box worker-box">
			<span class="who">Amazon's median worker earned</span>
			<span class="amount">{money((WORKER_PAY / SECONDS_PER_YEAR) * seconds)}</span>
			<span class="rate">{rate(WORKER_PAY / SECONDS_PER_YEAR)} every second</span>
		</div>
	</div>
	<p class="note">
		Based on 2021 pay: <span class="ceo">{money(CEO_PAY)}</span> for the CEO and
		<span class="worker">{money(WORKER_PAY)}</span> for the median worker.
	</p>
</div>

<style>
	.counter {
		margin: 2rem 0 1.5rem;
	}

	.intro {
		font-size: 0.95rem;
		color: #555;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.box {
		flex: 1 1 240px;
		display: flex;
		flex-direction: column;
		padding: 1.25rem 1.5rem;
		border-radius: 8px;
		background: #f6f6f6;
	}

	.who {
		font-size: 0.95rem;
	}

	.rate {
		font-size: 0.85rem;
		color: #666;
	}

	.amount {
		margin: 0.25rem 0;
		font-size: clamp(2.2rem, 6vw, 3.4rem);
		line-height: 1.1;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.ceo-box .amount {
		color: var(--ceo);
	}

	.worker-box .amount {
		color: var(--worker);
	}

	.ceo-box {
		border-top: 4px solid var(--ceo);
	}

	.worker-box {
		border-top: 4px solid var(--worker);
	}

	.note {
		font-size: 0.85rem;
		color: #666;
	}
</style>
