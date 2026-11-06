<script>
	import CompanySearch from '#lib/CompanySearch.svelte';
	import { money, ratioLabel } from '#lib/data.js';
	import {
		REFERENCE_YEAR,
		receiptNumbers,
		yearLabel,
		durationLabel,
		momentLabel
	} from '#lib/PayReceiptMath.js';

	// Novel view: search a company, print a store-style receipt, download or share it as a PNG.
	let { data } = $props();

	let picked = $state.raw(data.find((d) => d.ticker === 'AMZN') ?? data[0]);
	let n = $derived(receiptNumbers(picked));
	let status = $state('');

	const SOURCE = 'AFL-CIO Executive Paywatch (Kaggle copy), 2021 SEC proxy filings';
	const NOTES = [
		`Ratio = CEO total pay ÷ median worker pay.`,
		`Time: pay spread evenly over a 365-day ${REFERENCE_YEAR}, from Jan 1 00:00 UTC.`,
		'CEO pay is annual total compensation, often stock, not cash in hand.',
		`Start year counts back whole worker-years from ${REFERENCE_YEAR}; no year 0.`,
		'Ignores taxes, living costs, inflation, returns and pay changes.',
		'Median worker = the company’s middle employee, not you.'
	];

	// Receipt lines, shared by the page and the PNG so both show the same thing.
	let lines = $derived(
		n
			? [
					['CEO total pay', money(picked.ceoPay), 'ceo'],
					['Median worker pay', money(picked.workerPay), 'worker'],
					['Pay ratio', ratioLabel(n.ratio), 'company'],
					['CEO earned a worker’s year in', durationLabel(n.elapsedMs), 'ceo'],
					['That is, by', momentLabel(n.moment), ''],
					[`Worker-years for CEO’s 1 year`, n.workerYears.toLocaleString('en-US'), 'worker'],
					['Worker would have started in', yearLabel(n.startYear), 'worker']
				]
			: []
	);
	let reportedDiffers = $derived(
		n && n.reportedRatio && Math.round(n.ratio) !== Math.round(n.reportedRatio)
	);

	// Draws the receipt on a canvas (2× pixels for a crisp image) and returns a PNG blob.
	async function makePng() {
		await document.fonts?.ready;
		const W = 440;
		const pad = 26;
		const mono = '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
		const css = getComputedStyle(document.documentElement);
		const col = (v, f) => css.getPropertyValue(v).trim() || f;
		const colors = {
			ceo: col('--ceo', '#b2182b'),
			worker: col('--worker', '#2166ac'),
			company: col('--company-dark', '#5e3c99'),
			'': '#222'
		};
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		// Wrap text to the receipt width.
		const wrap = (text, font, max) => {
			ctx.font = font;
			const out = [];
			let line = '';
			for (const w of text.split(' ')) {
				const t = line ? `${line} ${w}` : w;
				if (ctx.measureText(t).width > max && line) {
					out.push(line);
					line = w;
				} else line = t;
			}
			if (line) out.push(line);
			return out;
		};

		// First pass measures height, second pass draws.
		const draw = (paint) => {
			let y = pad;
			const text = (t, font, color, align = 'left', x = align === 'center' ? W / 2 : align === 'right' ? W - pad : pad) => {
				if (paint) {
					ctx.font = font;
					ctx.fillStyle = color;
					ctx.textAlign = align;
					ctx.fillText(t, x, y);
				}
			};
			const dash = () => {
				if (paint) {
					ctx.font = `13px ${mono}`;
					ctx.fillStyle = '#999';
					ctx.textAlign = 'left';
					ctx.fillText('- '.repeat(40), pad, y);
				}
				y += 20;
			};
			y += 22;
			text('PAY RECEIPT', `bold 22px ${mono}`, '#222', 'center');
			y += 22;
			for (const l of wrap(picked.company.toUpperCase(), `bold 15px ${mono}`, W - pad * 2)) {
				text(l, `bold 15px ${mono}`, '#222', 'center');
				y += 19;
			}
			text(`${picked.sector} · FY ${REFERENCE_YEAR}`, `13px ${mono}`, '#555', 'center');
			y += 16;
			text(`CEO: ${picked.ceo}`, `13px ${mono}`, '#555', 'center');
			y += 22;
			dash();
			for (const [label, value, c] of lines) {
				text(label, `13px ${mono}`, '#444');
				y += 18;
				text(value, `bold 16px ${mono}`, colors[c], 'right');
				y += 22;
			}
			dash();
			for (const note of NOTES) {
				for (const l of wrap(note, `11px ${mono}`, W - pad * 2)) {
					text(l, `11px ${mono}`, '#555');
					y += 14;
				}
			}
			y += 6;
			for (const l of wrap(`Source: ${SOURCE}.`, `11px ${mono}`, W - pad * 2)) {
				text(l, `11px ${mono}`, '#555');
				y += 14;
			}
			y += 8;
			dash();
			text('THE CEO PAY GAP · CS 1710', `12px ${mono}`, '#777', 'center');
			return y + pad;
		};

		const H = draw(false);
		const scale = 2;
		canvas.width = W * scale;
		canvas.height = H * scale;
		ctx.scale(scale, scale);
		ctx.fillStyle = col('--bg', '#faf6ef');
		ctx.fillRect(0, 0, W, H);
		ctx.textBaseline = 'alphabetic';
		draw(true);
		return new Promise((res) => canvas.toBlob(res, 'image/png'));
	}

	const fileName = () => `pay-receipt-${picked.ticker.toLowerCase()}-${REFERENCE_YEAR}.png`;

	function download(blob) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName();
		document.body.append(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	async function onDownload() {
		const blob = await makePng();
		download(blob);
		status = `Downloaded ${fileName()}.`;
	}

	async function onShare() {
		const blob = await makePng();
		const file = new File([blob], fileName(), { type: 'image/png' });
		if (navigator.canShare?.({ files: [file] })) {
			try {
				await navigator.share({ files: [file], title: `${picked.company} pay receipt` });
				status = 'Shared.';
			} catch (e) {
				if (e.name !== 'AbortError') {
					download(blob);
					status = 'Sharing failed, so the image was downloaded instead.';
				}
			}
		} else {
			download(blob);
			status = 'This browser cannot share images, so the image was downloaded instead.';
		}
	}
</script>

<div class="wrap">
	<CompanySearch {data} label="Pick a company" selected={picked} onpick={(c) => ((picked = c), (status = ''))} />

	<div class="layout">
		<article class="receipt" aria-label="Pay receipt for {picked?.company}">
			<header>
				<p class="title">Pay receipt</p>
				<h3>{picked.company}</h3>
				<p class="meta">{picked.sector} · fiscal year {REFERENCE_YEAR}</p>
				<p class="meta">CEO: {picked.ceo}</p>
			</header>
			<hr />
			{#if n}
				<dl>
					{#each lines as [label, value, c]}
						<dt>{label}</dt>
						<dd class={c}>{value}</dd>
					{/each}
				</dl>
			{:else}
				<p class="meta">This company's pay figures are missing or invalid, so no receipt can be printed.</p>
			{/if}
			<hr />
			<ul class="notes">
				{#each NOTES as note}<li>{note}</li>{/each}
				{#if reportedDiffers}
					<li>The company reported {ratioLabel(n.reportedRatio)}; it may count pay differently.</li>
				{/if}
			</ul>
			<p class="notes">Source: {SOURCE}.</p>
		</article>

		<div class="side">
			{#if n}
				<p>
					At <strong>{picked.company}</strong>, the <span class="ceo">CEO</span> was paid
					<span class="ceo">{money(picked.ceoPay)}</span> in {REFERENCE_YEAR}. Spread evenly over the
					year, that passed the <span class="worker">median worker's</span> full-year pay of
					<span class="worker">{money(picked.workerPay)}</span> after just
					<strong>{durationLabel(n.elapsedMs)}</strong>.
				</p>
			{/if}
			<div class="buttons">
				<button type="button" onclick={onDownload} disabled={!n}>Download receipt</button>
				<button type="button" onclick={onShare} disabled={!n}>Share image</button>
			</div>
			<p class="status" role="status">{status}</p>
		</div>
	</div>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
		gap: 2rem;
		align-items: start;
		margin-top: 1rem;
	}
	@media (max-width: 760px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.receipt {
		position: relative;
		padding: 1.5rem 1.4rem 1.8rem;
		background: var(--card);
		font-family: 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
		font-size: 0.85rem;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
		/* Torn paper edge at the bottom. */
		--tear: radial-gradient(circle at 8px 0, transparent 7px, #000 7.5px);
		-webkit-mask: linear-gradient(#000, #000) top / 100% calc(100% - 8px) no-repeat,
			var(--tear) bottom / 16px 8px repeat-x;
		mask: linear-gradient(#000, #000) top / 100% calc(100% - 8px) no-repeat,
			var(--tear) bottom / 16px 8px repeat-x;
	}
	header {
		text-align: center;
	}
	.title {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	h3 {
		margin: 0.4rem 0 0.2rem;
		font-size: 1rem;
		text-transform: uppercase;
		overflow-wrap: anywhere;
	}
	.meta {
		margin: 0.1rem 0;
		color: #555;
	}
	hr {
		border: none;
		border-top: 2px dashed #aaa;
		margin: 0.9rem 0;
	}
	dl {
		margin: 0;
	}
	dt {
		color: #444;
	}
	dd {
		margin: 0 0 0.55rem;
		text-align: right;
		font-size: 1.05rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	dd.ceo {
		color: var(--ceo);
	}
	dd.worker {
		color: var(--worker);
	}
	dd.company {
		color: var(--company-dark);
	}
	.notes {
		margin: 0.3rem 0 0;
		padding-left: 1rem;
		font-size: 0.72rem;
		color: #555;
	}
	p.notes {
		padding: 0;
	}
	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.buttons button {
		padding: 0.5rem 1rem;
		font-size: 0.95rem;
		background: var(--sector-dark);
		border-color: var(--sector-dark);
		color: #fff;
	}
	.buttons button:hover {
		background: #000;
	}
	.buttons button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	button:focus-visible {
		outline: 3px solid var(--company-dark);
		outline-offset: 2px;
	}
	.status {
		min-height: 1.4em;
		font-size: 0.9rem;
		color: #555;
	}
</style>
