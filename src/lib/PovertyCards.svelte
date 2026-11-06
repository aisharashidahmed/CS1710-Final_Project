<script>
	import { money, moneyShort, ratioLabel } from '#lib/data.js';

	let { data } = $props();
	let selectedSector = $state('All sectors');

	let poorCompanies = $derived(
		data.filter((company) => company.belowPoverty || company.workerPay < 26500)
			.sort((a, b) => a.workerPay - b.workerPay)
	);
	let sectors = $derived(
		[...new Set(poorCompanies.map((company) => company.sector))].sort((a, b) =>
			a.localeCompare(b)
		)
	);
	let displayed = $derived(
		selectedSector === 'All sectors'
			? poorCompanies
			: poorCompanies.filter((company) => company.sector === selectedSector)
	);
	let consumerCount = $derived(
		poorCompanies.filter((company) => company.sector === 'Consumer Discretionary').length
	);

	function reset() {
		selectedSector = 'All sectors';
	}
</script>

<div class="poverty-grid">
	<div class="poverty-head">
		<div class="summary">
			<strong>{consumerCount} of {poorCompanies.length}</strong>
			<span>are in Consumer Discretionary</span>
		</div>
		<p class="threshold">
			2021 federal poverty guideline for a family of four: <strong>$26,500.</strong>
		</p>
	</div>

	<div class="controls">
		<label for="poverty-sector">Sector</label>
		<select id="poverty-sector" bind:value={selectedSector}>
			<option>All sectors</option>
			{#each sectors as sector}
				<option value={sector}>{sector}</option>
			{/each}
		</select>
		<button type="button" onclick={reset} disabled={selectedSector === 'All sectors'}>
			Show all sectors
		</button>
		<span class="count" aria-live="polite">
			{displayed.length} {displayed.length === 1 ? 'company' : 'companies'} displayed
		</span>
	</div>

	<div class="cards" aria-label="Companies below the 2021 poverty line">
		{#each displayed as company (company.ticker)}
			<article class="company-card">
				<div class="card-top">
					<h3>{company.company}</h3>
					<span class="sector">{company.sector}</span>
				</div>
				<div class="pay-row">
					<span class="label">Median worker</span>
					<strong class="worker">{money(company.workerPay)}</strong>
				</div>
				<div class="pay-row">
					<span class="label">CEO total pay</span>
					<strong class="ceo">{moneyShort(company.ceoPay)}</strong>
				</div>
				<div class="ratio">CEO-to-worker pay ratio: <strong>{ratioLabel(company.ratio)}</strong></div>
			</article>
		{/each}
	</div>
</div>

<style>
	.poverty-grid {
		margin-top: 1rem;
	}
	.poverty-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}
	.summary {
		display: flex;
		flex-direction: column;
		padding: 0.75rem 1rem;
		background: var(--company);
		border-left: 4px solid var(--company-dark);
		border-radius: 4px;
		min-width: 220px;
	}
	.summary strong {
		font-size: 1.15rem;
	}
	.summary span {
		font-size: 0.88rem;
	}
	.threshold {
		margin: 0;
		text-align: right;
		font-size: 0.95rem;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin: 0.75rem 0;
		flex-wrap: wrap;
	}
	.controls label {
		font-weight: 700;
	}
	select {
		min-height: 36px;
		padding: 0.35rem 2rem 0.35rem 0.6rem;
		border: 1px solid #bbb;
		border-radius: 4px;
		background: var(--card);
		font: inherit;
		font-size: 0.85rem;
	}
	button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.count {
		margin-left: auto;
		font-size: 0.85rem;
		color: #666;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}
	.company-card {
		border: 1px solid #d8cdb9;
		border-top: 4px solid var(--company);
		background: var(--card);
		border-radius: 5px;
		padding: 0.8rem;
	}
	.card-top {
		min-height: 3.25rem;
		padding-bottom: 0.45rem;
		border-bottom: 1px solid #d8cdb9;
	}
	h3 {
		margin: 0 0 0.2rem;
		font-size: 0.95rem;
		line-height: 1.25;
	}
	.sector {
		color: var(--sector-dark);
		font-size: 0.75rem;
	}
	.pay-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.55rem;
	}
	.label {
		color: #666;
		font-size: 0.78rem;
	}
	.pay-row strong {
		font-size: 1rem;
		white-space: nowrap;
	}
	.ratio {
		margin-top: 0.7rem;
		padding-top: 0.55rem;
		border-top: 1px solid #d8cdb9;
		font-size: 0.78rem;
		color: #555;
	}
	@media (max-width: 900px) {
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 640px) {
		.poverty-head {
			align-items: stretch;
			flex-direction: column;
		}
		.threshold {
			text-align: left;
		}
		.cards {
			grid-template-columns: 1fr;
		}
		.count {
			width: 100%;
			margin-left: 0;
		}
	}
</style>
