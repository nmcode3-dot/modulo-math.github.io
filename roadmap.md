# Topic Drills workspace
- [x] Add saved, deterministic topic practice conversations with AMC/AIME answer controls.
- [x] Match the reference layout with topic navigation, progress, and difficulty-ordered named tiles.
- [x] Verify answering, history restoration, and topic separation.

# Navigation
- [x] Make Topic Drills the default home page (random topic on every visit).
- [x] Move Contest Practice to its own sidebar page at /contests.
- [x] Verify sidebar highlighting, home redirect, and contest-chip random draw.

# Missing answers
- [x] Repair answer keys erased during solution backfill and prevent blank overwrites.
- [x] Verify restored answers with on-page solutions and resume both download tracks.

# Safe scraping
- [x] Resume both tracks with validation that keeps unverified answers out of practice and preserves them for repair.
- [x] Verify answer protection and confirm both processes are running (16 tests passed; both fetch processes confirmed).

# Random Math solution source
- [x] Inspect Random Math pages and compare retrieval with the existing source: direct browser access, no archive.
- [x] Build a local solutions-only AMC 10 scraper with identity/TeX validation and 19 passing safeguard tests.
- [x] Run a bounded live trial: 38 of 52 solutions saved in 54 seconds; 14 diagram-containing solutions skipped safely. Verified all non-solution fields unchanged. Preview completion controls did not respond in automated browser checks, so on-page display remains unverified.

# All-contest Random Math backfill
- [x] Extend the safe downloader to all supported contest identities (14 safeguard tests passed).
- [x] Start the full missing-solution pass across AMC 8, AMC 10, AMC 12, and AIME; verify initial saves preserve questions, answers, and existing solutions. The temporary workspace download is not guaranteed to survive a workspace restart; completion is not yet confirmed.

# Solution diagrams
- [ ] Save Random Math solution diagrams as project assets and preserve their position in worked solutions.
- [ ] Verify diagrams render after completion and restart all-contest missing-solution downloads.
