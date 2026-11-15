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

	// Careers as a picture: one square per full 40-year working life, plus a partly filled last one.
	let fullCareers = $derived(Math.floor(careers));
	let partCareer = $derived(careers - fullCareers);

	// The CEO's share of the worker's year: 1 / ratio of the bar. At least 2px so it never vanishes.
	let ceoShare = $derived(1 / company.ratio);
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
			<div class="careers" role="img" aria-label="{careers.toFixed(1)} working lives">
				{#each { length: fullCareers }}
					<span class="life"></span>
				{/each}
				{#if partCareer > 0.01}
					<span class="life part" style:--fill="{partCareer * 100}%"></span>
				{/if}
			</div>
			<span class="key"><span class="life"></span> = one {CAREER_YEARS}-year working life</span>
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
			<!-- The whole bar is the worker's year of work; the red slice is the CEO's time. -->
			<div class="year" role="img" aria-label="The CEO's time is {d3.format('.2%')(ceoShare)} of the worker's year">
				<span class="ceo-slice" style:width="max(2px, {ceoShare * 100}%)"></span>
			</div>
			<span class="key">
				Whole bar = the <span class="worker">worker's year</span>. Red slice = the
				<span class="ceo">CEO's time</span>.
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
		background: var(--card);
	}
	h3 {
		margin: 0 0 0.5rem;
		font-size: 1.2rem;
		color: var(--company-dark);
	}
	ul {
		display: grid;
		grid-template-columns: 1fr;
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
	.careers {
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		margin-top: 0.35rem;
	}
	.life {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 1px;
		background: var(--worker);
	}
	.life.part {
		background: linear-gradient(to right, var(--worker) var(--fill), var(--worker-tint) var(--fill));
		outline: 1px solid var(--worker);
		outline-offset: -1px;
	}
	.year {
		height: 18px;
		margin-top: 0.35rem;
		border: 1px solid var(--worker);
		border-radius: 3px;
		background: var(--worker-tint);
		overflow: hidden;
	}
	.ceo-slice {
		display: block;
		height: 100%;
		background: var(--ceo);
	}
	.key {
		font-size: 0.8rem;
		color: #555;
	}
	.key .life {
		vertical-align: -1px;
	}
	.big {
		font-size: 1.8rem;
		font-weight: 700;
		line-height: 1.15;
	}
</style>
