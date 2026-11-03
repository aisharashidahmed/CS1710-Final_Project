<script>
	// Sticky menu of story sections. The section currently on screen is highlighted.
	// sections = [{ id, label }], ids match the <section id> on the page.
	let { sections } = $props();

	let current = $state(sections[0].id);

	$effect(() => {
		// A section counts as "current" when it crosses a line 40% down the screen.
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) current = entry.target.id;
				}
			},
			{ rootMargin: '-40% 0px -60% 0px' }
		);
		for (const s of sections) {
			const el = document.getElementById(s.id);
			if (el) observer.observe(el);
		}
		// The last section is short and may never reach that line, so it wins at the very bottom.
		const atBottom = () => {
			if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
				current = sections.at(-1).id;
			}
		};
		window.addEventListener('scroll', atBottom, { passive: true });

		return () => {
			observer.disconnect();
			window.removeEventListener('scroll', atBottom);
		};
	});
</script>

<nav aria-label="Story sections">
	<ul>
		{#each sections as s (s.id)}
			<li>
				<a href="#{s.id}" class:current={s.id === current} aria-current={s.id === current ? 'true' : undefined}>
					{s.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	nav {
		position: sticky;
		top: 0;
		z-index: 10;
		border-bottom: 1px solid #e5e5e5;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(4px);
	}

	/* One row; on narrow screens it scrolls sideways instead of wrapping. */
	ul {
		display: flex;
		gap: 0.25rem;
		max-width: 860px;
		margin: 0 auto;
		padding: 0.5rem 1rem;
		overflow-x: auto;
		list-style: none;
		scrollbar-width: none;
	}

	a {
		display: block;
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		color: #555;
		font-size: 0.85rem;
		text-decoration: none;
		white-space: nowrap;
	}

	a:hover {
		background: #f3f3f3;
	}

	a.current {
		background: var(--sector-dark);
		color: #fff;
	}
</style>
