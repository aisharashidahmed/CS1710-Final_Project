<script>
	import * as d3 from 'd3';

	// Several plain-language ways to read one company's pay ratio as time.
	let { company } = $props();

	// A working life of about 40 years (age 25 to 65).
	const CAREER_YEARS = 40;

	const count = d3.format(',');

	// The CEO's time, in the unit that reads best: minutes, work hours, or workdays.
	function ceoTime(c) {
		const minutes = c.workHours * 60;
		if (minutes < 60) return `${Math.max(1, Math.round(minutes))} minutes`;
		if (c.workHours < 8) return `${d3.format('.1f')(c.workHours)} hours`;
		return `${d3.format('.1f')(c.workdays)} workdays`;
	}

	let careers = $derived(company.ratio / CAREER_YEARS);
	let start = $derived(company.startYear);
</script>

<div class="card">
	<h3>{company.company}</h3>
	<ul>
		<li>
			<span class="big worker">{count(company.ratio)} years</span>
			<span>
				of work for the <span class="worker">median worker</span> to earn what the
				<span class="ceo">CEO</span> made in one year.
			</span>
		</li>
		<li>
			<span class="big worker">
				{careers >= 1 ? `${count(Math.round(careers))} careers` : 'Less than 1 career'}
			</span>
			<span>
				{careers >= 1
					? `back to back, if a working life is ${CAREER_YEARS} years.`
					: `A working life is about ${CAREER_YEARS} years.`}
			</span>
		</li>
		<li>
			<span class="big">{start < 0 ? `${-start} BCE` : start}</span>
			<span>
				is when they would have had to start to finish by 2021.
			</span>
		</li>
		<li>
			<span class="big ceo">{ceoTime(company)}</span>
			<span>
				is all the <span class="ceo">CEO</span> needed to earn the worker's whole year of pay.
			</span>
		</li>
	</ul>
</div>

<style>
	.card {
		margin: 1rem 0;
		padding: 1rem 1.5rem;
		border-left: 4px solid var(--company-dark);
		border-radius: 8px;
		background: #f7f4fb;
	}
	h3 {
		margin: 0 0 0.5rem;
		font-size: 1.2rem;
		color: var(--company-dark);
	}
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
		gap: 1rem 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.95rem;
	}
	.big {
		font-size: 1.8rem;
		font-weight: 700;
		line-height: 1.15;
	}
</style>
