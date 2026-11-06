<script>
	// Type-to-search box for picking one company. Shows up to 6 matches while typing;
	// click a match or press Enter to pick the first one. Reports the pick through onpick.
	// selected = the company currently picked anywhere (e.g. by clicking a dot); the box shows its name.
	let { data, label = 'Find your company', selected = null, onpick } = $props();

	const id = $props.id();

	let query = $state('');
	let open = $state(false);

	$effect(() => {
		if (selected) query = selected.company;
	});

	let matches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return data
			.filter((d) => d.company.toLowerCase().includes(q) || d.ticker.toLowerCase() === q)
			.slice(0, 6);
	});

	function pick(company) {
		query = company.company;
		open = false;
		onpick(company);
	}

	function onkeydown(event) {
		if (event.key === 'Enter' && matches.length) pick(matches[0]);
		if (event.key === 'Escape') open = false;
	}
</script>

<div class="search">
	<label for={id}>{label}:</label>
	<div class="field">
		<input
			{id}
			type="text"
			autocomplete="off"
			spellcheck="false"
			placeholder="Type a company name, e.g. McDonald's"
			bind:value={query}
			oninput={() => (open = true)}
			onfocus={(e) => {
				// Select the current name so typing replaces it.
				e.currentTarget.select();
				open = false;
			}}
			onblur={() => (open = false)}
			{onkeydown}
		/>
		{#if open && matches.length}
			<ul class="matches">
				{#each matches as d (d.ticker)}
					<!-- mousedown fires before the input's blur, so the click still lands. -->
					<li>
						<button type="button" onmousedown={(e) => (e.preventDefault(), pick(d))}>
							{d.company} <span class="sector">{d.sector}</span>
						</button>
					</li>
				{/each}
			</ul>
		{:else if open && query.trim() && !matches.length}
			<p class="none">No S&amp;P 500 company matches "{query.trim()}".</p>
		{/if}
	</div>
</div>

<style>
	.search {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
		margin: 1rem 0 0.5rem;
	}
	label {
		font-weight: 600;
	}
	.field {
		position: relative;
		flex: 0 1 420px;
	}
	input {
		box-sizing: border-box;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #bbb;
		border-radius: 6px;
		font: inherit;
	}
	input:focus {
		outline: 2px solid var(--company-dark);
		outline-offset: 1px;
	}
	.matches,
	.none {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 5;
		margin: 4px 0 0;
		padding: 4px 0;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: var(--card);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
		list-style: none;
	}
	.none {
		padding: 0.5rem 0.75rem;
		color: #666;
		font-size: 0.9rem;
	}
	button {
		display: block;
		width: 100%;
		padding: 0.4rem 0.75rem;
		border: none;
		border-radius: 0;
		background: none;
		text-align: left;
		font-size: 0.95rem;
	}
	button:hover {
		background: #e6dbc7;
	}
	.sector {
		margin-left: 0.4rem;
		color: #888;
		font-size: 0.8rem;
	}
</style>
