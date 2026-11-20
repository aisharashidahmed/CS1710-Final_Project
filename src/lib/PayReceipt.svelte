<script>
	import * as d3 from 'd3';
	import { untrack } from 'svelte';
	import CompanySearch from '#lib/CompanySearch.svelte';
	import { money, ratioLabel } from '#lib/data.js';
	import {
		REFERENCE_YEAR,
		receiptNumbers,
		squareLayout,
		yearLabel,
		durationLabel,
		momentLabel
	} from '#lib/PayReceiptMath.js';

	// Novel view: search a company, print a store-style receipt with a worker-year unit chart,
	// then download or share it as a PNG. The PNG is drawn from the same values as the page.
	let { data } = $props();

	// Starts on Amazon (the story's running example); later picks come from the search box.
	let picked = $state.raw(untrack(() => data?.find((d) => d.ticker === 'AMZN') ?? data?.[0] ?? null));
	let n = $derived(receiptNumbers(picked));
	let status = $state('');
	let busy = $state(false);

	// Unit chart: worker-years = CEO total pay ÷ median worker pay (not rounded).
	const COLS = 10;
	const SQ = 16;
	const GAP = 3;
	let grid = $derived(n ? squareLayout(n.ratio) : null);
	let gridRows = $derived(grid ? Math.ceil(grid.count / COLS) : 0);
	let gridW = COLS * (SQ + GAP) - GAP;
	let gridH = $derived(Math.max(0, gridRows * (SQ + GAP) - GAP));
	let squares = $derived(
		grid
			? d3.range(grid.count).map((i) => ({
					x: (i % COLS) * (SQ + GAP),
					y: Math.floor(i / COLS) * (SQ + GAP),
					fill: i < grid.full ? 1 : grid.partial
				}))
			: []
	);

	// Tell the reader when the unit changes between companies.
	let prevUnit = null;
	let unitChangedFrom = $state(null);
	$effect(() => {
		const u = grid?.unit ?? null;
		unitChangedFrom = u && prevUnit && u !== prevUnit ? prevUnit : null;
		prevUnit = u;
	});

	const yearsFmt = (v) => d3.format(v < 10 ? ',.2f' : ',.1f')(v);
	const partFmt = (p) => (p > 0 && p < 0.005 ? 'under 0.01' : d3.format('.2f')(p));
	const plural = (k, word) => `${d3.format(',')(k)} ${word}${k === 1 ? '' : 's'}`;

	// Every sentence shown on the receipt, shared by the page and the PNG.
	let text = $derived(
		n && grid
			? {
					ceo: money(picked.ceoPay),
					worker: money(picked.workerPay),
					ratio: ratioLabel(n.ratio),
					reported: n.reportedRatio
						? `Company-reported ratio: ${ratioLabel(n.reportedRatio)}` +
							(Math.round(n.reportedRatio) !== Math.round(n.ratio)
								? ' (differs from the dollar figures; companies may count pay differently)'
								: '')
						: 'Company-reported ratio: not available',
					headline: `CEO's 1 year = ${yearsFmt(n.ratio)} worker-years of pay`,
					unit: `1 square = ${plural(grid.unit, 'worker-year')} of pay`,
					shown:
						`${plural(grid.full, 'full square')}` +
						(grid.partial > 0 ? ` + ${partFmt(grid.partial)} of a square` : '') +
						` = ${yearsFmt(n.ratio)} worker-years.`,
					meaning:
						`The CEO's ${REFERENCE_YEAR} total compensation equals ${yearsFmt(n.ratio)} years of ` +
						`the median worker's ${REFERENCE_YEAR} pay, if that pay stayed the same every year.`,
					time:
						`Spread evenly over 365 days, the CEO's total compensation passed the median worker's ` +
						`full-year pay after ${durationLabel(n.elapsedMs)}.`
				}
			: null
	);

	const SOURCE = 'AFL-CIO Executive Paywatch (Kaggle copy), fiscal year 2021 SEC proxy filings';
	const NOTES = [
		'Ratio and worker-years = CEO total compensation ÷ median worker pay.',
		'Worker-years are an equivalence at constant yearly pay, not years anyone worked or a forecast.',
		'CEO total compensation includes stock and other awards, not just salary.',
		'Each company picks its own median employee (sometimes part-time or outside the U.S.).',
		'Squares use a different unit for some companies; compare the numbers, not square counts.'
	];
	const TIME_NOTE = 'An illustration only, not when the CEO was actually paid or hours worked.';

	// Draws the receipt on a canvas (2× pixels for a crisp image) and returns a PNG blob.
	async function makePng() {
		await document.fonts?.ready;
		const W = 440;
		const pad = 26;
		const inner = W - pad * 2;
		const mono = '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
		const css = getComputedStyle(document.documentElement);
		const col = (v, f) => css.getPropertyValue(v).trim() || f;
		const colors = {
			ceo: col('--ceo', '#b2182b'),
			worker: col('--worker', '#2166ac'),
			company: col('--company-dark', '#5e3c99'),
			ink: '#222',
			gray: '#555'
		};
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('this browser cannot draw images');

		const wrap = (t, font, max = inner) => {
			ctx.font = font;
			const out = [];
			let line = '';
			for (const w of t.split(' ')) {
				const next = line ? `${line} ${w}` : w;
				if (ctx.measureText(next).width > max && line) {
					out.push(line);
					line = w;
				} else line = next;
			}
			if (line) out.push(line);
			return out;
		};

		// First pass measures height, second pass draws.
		const draw = (paint) => {
			let y = pad;
			const put = (t, font, color, align = 'left') => {
				if (!paint) return;
				ctx.font = font;
				ctx.fillStyle = color;
				ctx.textAlign = align;
				ctx.fillText(t, align === 'center' ? W / 2 : align === 'right' ? W - pad : pad, y);
			};
			const para = (t, font, color, lh, align = 'left') => {
				for (const l of wrap(t, font)) {
					put(l, font, color, align);
					y += lh;
				}
			};
			const dash = () => {
				y += 2;
				if (paint) {
					ctx.strokeStyle = '#aaa';
					ctx.setLineDash([5, 4]);
					ctx.lineWidth = 1.5;
					ctx.beginPath();
					ctx.moveTo(pad, y);
					ctx.lineTo(W - pad, y);
					ctx.stroke();
					ctx.setLineDash([]);
				}
				y += 20;
			};
			const small = `11px ${mono}`;

			y += 20;
			put('PAY RECEIPT', `bold 22px ${mono}`, colors.ink, 'center');
			y += 24;
			para(picked.company.toUpperCase(), `bold 15px ${mono}`, colors.ink, 19, 'center');
			para(`${picked.sector} · fiscal year ${REFERENCE_YEAR}`, `13px ${mono}`, colors.gray, 16, 'center');
			para(`CEO: ${picked.ceo}`, `13px ${mono}`, colors.gray, 16, 'center');
			y += 4;
			dash();

			for (const [label, value, c] of [
				['CEO total compensation', text.ceo, 'ceo'],
				['Median worker pay', text.worker, 'worker']
			]) {
				put(label, `13px ${mono}`, '#444');
				put(value, `bold 16px ${mono}`, colors[c], 'right');
				y += 24;
			}
			dash();

			put('Pay ratio (CEO ÷ worker)', `13px ${mono}`, '#444');
			put(text.ratio, `bold 20px ${mono}`, colors.company, 'right');
			y += 20;
			para(text.reported, small, colors.gray, 14);
			y += 4;
			dash();

			para(text.headline, `bold 13px ${mono}`, colors.ink, 17);
			y += 4;
			const x0 = (W - gridW) / 2;
			if (paint) {
				for (const s of squares) {
					ctx.strokeStyle = colors.worker;
					ctx.lineWidth = 1;
					ctx.strokeRect(x0 + s.x + 0.5, y + s.y + 0.5, SQ - 1, SQ - 1);
					ctx.fillStyle = colors.worker;
					ctx.fillRect(x0 + s.x, y + s.y, SQ * s.fill, SQ);
				}
			}
			y += gridH + 22;
			// Legend: one sample square plus the unit.
			if (paint) {
				ctx.fillStyle = colors.worker;
				ctx.fillRect(pad, y - 11, 12, 12);
			}
			ctx.font = `bold 12px ${mono}`;
			if (paint) {
				ctx.fillStyle = colors.ink;
				ctx.textAlign = 'left';
				ctx.fillText(text.unit, pad + 18, y);
			}
			y += 17;
			para(text.shown, small, colors.gray, 14);
			para(text.meaning, small, colors.gray, 14);
			y += 4;
			dash();

			para(text.time, small, '#444', 14);
			para(TIME_NOTE, small, colors.gray, 14);
			y += 4;
			dash();

			for (const note of NOTES) para(`· ${note}`, small, colors.gray, 14);
			y += 6;
			para(`Source: ${SOURCE}.`, small, colors.gray, 14);
			y += 6;
			dash();
			put('THE CEO PAY GAP · CS 1710', `12px ${mono}`, '#777', 'center');
			return y + pad;
		};

		const H = draw(false);
		const scale = 2;
		canvas.width = W * scale;
		canvas.height = Math.ceil(H * scale);
		ctx.scale(scale, scale);
		ctx.fillStyle = col('--card', '#efe6d6');
		ctx.fillRect(0, 0, W, H);
		ctx.textBaseline = 'alphabetic';
		draw(true);
		const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
		if (!blob) throw new Error('the image could not be encoded');
		return blob;
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

	const failed = (e) =>
		`Sorry, the image could not be made (${e?.message ?? 'unknown error'}). Try another browser, or take a screenshot of the receipt.`;

	async function onDownload() {
		busy = true;
		status = 'Making the image…';
		try {
			download(await makePng());
			status = `Downloaded ${fileName()}.`;
		} catch (e) {
			status = failed(e);
		} finally {
			busy = false;
		}
	}

	async function onShare() {
		busy = true;
		status = 'Making the image…';
		let blob;
		try {
			blob = await makePng();
		} catch (e) {
			status = failed(e);
			busy = false;
			return;
		}
		try {
			const file = new File([blob], fileName(), { type: 'image/png' });
			if (navigator.canShare?.({ files: [file] })) {
				try {
					await navigator.share({ files: [file], title: `${picked.company} pay receipt` });
					status = 'Shared.';
				} catch (e) {
					if (e.name === 'AbortError') status = 'Sharing canceled.';
					else {
						download(blob);
						status = 'Sharing failed, so the image was downloaded instead.';
					}
				}
			} else {
				download(blob);
				status = 'This browser cannot share images, so the image was downloaded instead.';
			}
		} catch (e) {
			status = failed(e);
		} finally {
			busy = false;
		}
	}
</script>

<div class="wrap">
	<CompanySearch {data} label="Pick a company" selected={picked} onpick={(c) => ((picked = c), (status = ''))} />

	{#if picked}
		<div class="layout">
			<article class="receipt" aria-label="Pay receipt for {picked.company}">
				<header>
					<p class="title">Pay receipt</p>
					<h3>{picked.company}</h3>
					<p class="meta">{picked.sector} · fiscal year {REFERENCE_YEAR}</p>
					<p class="meta">CEO: {picked.ceo}</p>
				</header>
				<hr />
				{#if text}
					<dl class="pay">
						<dt>CEO total compensation</dt>
						<dd class="ceo">{text.ceo}</dd>
						<dt>Median worker pay</dt>
						<dd class="worker">{text.worker}</dd>
					</dl>
					<hr />
					<div class="ratio-line">
						<span>Pay ratio <span class="how">(CEO ÷ worker)</span></span>
						<strong class="company">{text.ratio}</strong>
					</div>
					<p class="fine">{text.reported}</p>
					<hr />

					<section class="units" aria-label="Unit chart">
						<p class="headline">{text.headline}</p>
						<svg
							class="grid"
							width={gridW}
							height={gridH}
							viewBox="0 0 {gridW} {gridH}"
							role="img"
							aria-label="{text.headline}. {text.unit}. {text.shown}"
						>
							{#each squares as s}
								<rect class="sq-outline" x={s.x + 0.5} y={s.y + 0.5} width={SQ - 1} height={SQ - 1} />
								<rect class="sq" x={s.x} y={s.y} width={SQ * s.fill} height={SQ} />
							{/each}
						</svg>
						<p class="legend" class:changed={unitChangedFrom} aria-live="polite">
							<span class="key" aria-hidden="true"></span>
							<strong>{text.unit}</strong>
							{#if unitChangedFrom}
								<span class="change">
									Unit changed (was {plural(unitChangedFrom, 'worker-year')} per square for the last company).
								</span>
							{/if}
						</p>
						<p class="fine">{text.shown}</p>
						<p class="fine">{text.meaning}</p>
					</section>
					<hr />

					<section class="time" aria-label="Another way to see it">
						<p class="fine strong">{text.time}</p>
						<p class="fine">{TIME_NOTE}</p>
						<details>
							<summary>Exact moment and start year</summary>
							<p class="fine">
								With pay counted from Jan 1, {REFERENCE_YEAR}, 00:00 UTC, that moment is
								{momentLabel(n.moment)}.
							</p>
							<p class="fine">
								Counting back {plural(n.workerYears, 'whole worker-year')} from {REFERENCE_YEAR} (no year 0), a
								worker would have had to start in {yearLabel(n.startYear)} to match the CEO's one year.
							</p>
						</details>
					</section>
				{:else}
					<p class="meta">This company's pay figures are missing or invalid, so no receipt can be printed.</p>
				{/if}
				<hr />
				<ul class="notes">
					{#each NOTES as note}<li>{note}</li>{/each}
				</ul>
				<p class="notes source">Source: {SOURCE}.</p>
			</article>

			<div class="side">
				<p>
					Each <span class="worker">blue square</span> stands for years of the median worker's pay. Together
					the squares add up to one year of the <span class="ceo">CEO's total compensation</span>.
				</p>
				<p class="hint">
					The downloaded image shows the same figures, squares, unit and notes as this receipt.
				</p>
				<div class="buttons">
					<button type="button" onclick={onDownload} disabled={!text || busy}>Download receipt</button>
					<button type="button" onclick={onShare} disabled={!text || busy}>Share image</button>
				</div>
				<p class="status" role="status">{status}</p>
			</div>
		</div>
	{:else}
		<p class="meta">No company data is available.</p>
	{/if}
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
		margin: 0.8rem 0;
	}
	.pay {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.35rem 0.75rem;
		align-items: baseline;
		margin: 0;
	}
	dt {
		color: #444;
	}
	dd {
		margin: 0;
		text-align: right;
		font-size: 1.05rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.ceo {
		color: var(--ceo);
	}
	.worker {
		color: var(--worker);
	}
	.company {
		color: var(--company-dark);
	}
	.ratio-line {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.ratio-line strong {
		font-size: 1.4rem;
		font-variant-numeric: tabular-nums;
	}
	.how {
		color: #666;
	}
	.fine {
		margin: 0.25rem 0 0;
		font-size: 0.72rem;
		color: #555;
	}
	.fine.strong {
		color: #333;
	}
	.headline {
		margin: 0 0 0.5rem;
		font-weight: 700;
	}
	.grid {
		display: block;
		margin: 0 auto;
		max-width: 100%;
		height: auto;
	}
	.sq {
		fill: var(--worker);
	}
	.sq-outline {
		fill: none;
		stroke: var(--worker);
		stroke-width: 1;
	}
	.legend {
		margin: 0.6rem 0 0;
		padding: 0.25rem 0.4rem;
		border-radius: 4px;
		font-size: 0.78rem;
	}
	.legend.changed {
		background: var(--worker-tint);
		outline: 1px solid var(--worker);
	}
	.key {
		display: inline-block;
		width: 11px;
		height: 11px;
		margin-right: 0.3rem;
		background: var(--worker);
		vertical-align: -1px;
	}
	.change {
		display: block;
		margin-top: 0.15rem;
		font-weight: normal;
	}
	details {
		margin-top: 0.4rem;
		font-size: 0.75rem;
	}
	summary {
		cursor: pointer;
		color: #444;
	}
	summary:focus-visible {
		outline: 2px solid var(--company-dark);
		outline-offset: 2px;
	}
	.notes {
		margin: 0.3rem 0 0;
		padding-left: 1rem;
		font-size: 0.7rem;
		color: #555;
	}
	.notes.source {
		padding: 0;
	}
	.hint {
		font-size: 0.9rem;
		color: #555;
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
