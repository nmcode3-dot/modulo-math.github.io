<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Problems are static JSON in src/data loaded via import.meta.glob, and progress lives in localStorage — the user asked for no database or server.
- Topic keywords live in src/data/topic-tags.json and are applied both by scripts/scrape.ts and at app load, so manual edits take effect without re-scraping.
- Topic practice uses a client-only deterministic transcript per topic, storing problem snapshots and replies separately from shared progress so history stays reviewable without AI or server dependencies.
- Scraper answer keys are validated through scripts/answer-keys.ts and merged without overwriting a valid saved answer with a missing key; solution backfills must preserve grading data.
