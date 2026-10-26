<script>
	import * as d3 from 'd3';

	// Amazon, fiscal year 2021 (from static/data/companies.csv).
	const CEO_PAY = 212701169;
	const WORKER_PAY = 32855;
	const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

	const money = d3.format('$,.2f');

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
		</div>
		<div class="box worker-box">
			<span class="who">Amazon's median worker earned</span>
			<span class="amount">{money((WORKER_PAY / SECONDS_PER_YEAR) * seconds)}</span>
		</div>
	</div>
	<p class="note">
		Based on 2021 pay: <span class="ceo">{money(CEO_PAY)}</span> for the CEO and
		<span class="worker">{money(WORKER_PAY)}</span> for the median worker.
	</p>
</div>

<style>
	.counter {
		margin: 1.5rem 0;
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
		padding: 1rem 1.25rem;
		border-radius: 8px;
		background: #f3f3f3;
	}

	.amount {
		font-size: 2rem;
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
