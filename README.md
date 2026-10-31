# Modulo Math

Build a competition math practice website called “Modulo” using React, TypeScript, Tailwind, and shadcn/ui. It should have a clean, distraction-free design with a persistent left sidebar, light and dark mode, and a mobile-friendly layout. All math must render with KaTeX.

Sidebar sections

Contest Practice
Topic Drills
My Progress

Data architecture (important)

Do NOT use a database or backend. Store all problems as static JSON files in /src/data/ (one file per contest: amc8.json, amc10.json, amc12.json, aime.json, plus topics.json).
Store all user progress in localStorage.
Add an “Export Progress” button that downloads progress as a .json file, and an “Import Progress” button that loads one back, so users can save and restore progress without any server storage.

Problem schema

json
{
  "id": "amc10a-2019-12",
  "contest": "AMC 10",
  "year": 2019,
  "version": "A",
  "number": 12,
  "statementLatex": "...",
  "choices": ["...", "..."],
  "answer": "C",
  "solutionUrl": "https://artofproblemsolving.com/wiki/index.php/2019_AMC_10A_Problems/Problem_12",
  "topics": ["Modular Arithmetic", "Number Theory"]
}

AIME problems have no choices; their answers are integers from 000 to 999.

Data extraction
Source pages:

https://artofproblemsolving.com/wiki/index.php?title=AMC_8_Problems_and_Solutions
https://artofproblemsolving.com/wiki/index.php?title=AMC_10_Problems_and_Solutions
https://artofproblemsolving.com/wiki/index.php?title=AMC_12_Problems_and_Solutions
https://artofproblemsolving.com/wiki/index.php?title=AIME_Problems_and_Solutions

Write a Node script at /scripts/scrape.ts that does the following:

Crawls each index page and follows the link to every year/version (e.g. “2019 AMC 10A”) and every individual problem page.
Extracts the problem statement, converting AoPS’s LaTeX image alt text back into real LaTeX, plus the answer choices and the exact URL of the problem’s solutions page.
Pulls the official answer from each contest’s “Answer Key” page.
Throttles requests (about 1 per second), caches pages locally, and logs any problem it failed to parse to scrape-errors.log.
Writes the final JSON files into /src/data/.

Run the script, and show me a coverage report (problems found vs. expected per contest/year) so I can verify nothing was missed. If you can’t run it in this environment, finish the script, tell me exactly how to run it locally, and make the app load whatever JSON files are present. Include a few sample problems in each file so the UI works right away.

Section 1: Contest Practice

Navigation: Contest, then Year, then Version (A/B), then Problem. Include a “random problem” option and filters by contest and year.
Each problem has 3 attempts. Show “Attempt 1 of 3” and so on. A wrong answer shows feedback (“Incorrect, 2 attempts left”) without revealing the answer.
AMC problems use multiple choice buttons. AIME problems use a numeric input (0-999).
When the user gets it right or uses all 3 attempts, the problem is complete. Show the correct answer and display a prominent link under the problem: “View Solution on AoPS”, opening in a new tab. The link appears whether they got it right or wrong.
Mark each problem as unattempted, solved (with the attempt number), or failed, and show this on the problem list.

Section 2: Topic Drills

Group problems into very specific topics, not broad ones. Examples: Modular Arithmetic, Stars and Bars, Paths on a Grid, Casework Counting, Complementary Counting, Inclusion-Exclusion, Pigeonhole Principle, Expected Value, Conditional Probability, Pythagorean Triples, Similar Triangles, Power of a Point, Angle Chasing, Circle Tangents, Area by Coordinates, Vieta’s Formulas, Polynomial Remainder, Telescoping Sums, Arithmetic/Geometric Sequences, Logarithms, Complex Numbers, Divisor Counting, GCD/LCM, Digit Problems, Base Conversion, Recursion, and more at this level of detail.
A problem can belong to multiple topics and should appear in each.
Tag topics by keyword matching on the problem text and AoPS solution content. Keep the topic mapping in a separate file, topic-tags.json, so I can manually edit it.
Each topic page lists its problems, sorted by difficulty (contest, then problem number) and filterable by contest. Show progress for each topic (e.g. “12/40 solved”). The same 3-attempt rules and solution link apply.

My Progress

Show overall stats: problems solved, accuracy, and first-try rate.
Show a per-contest and per-topic breakdown, and a list of failed problems to retry.
Include the Export/Import buttons here.

Legal note
Add a footer crediting the Art of Problem Solving wiki and the MAA as the sources of the problems, with links back to the original pages.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://modulo-math.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cfb57eb2-1fe8-47fb-9fe5-ee20d1221c2b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

## Random Math solution downloads

An alternative local scraper fills only missing AMC 10 solutions from [Random Math Wiki](https://wiki.randommath.com/). It uses direct Chromium browsing, never Wayback, and preserves questions, answers, topic tags, existing solutions, and AoPS links. Original math is extracted from the page's TeX rather than duplicated rendered text.

In a terminal inside the project folder:

```sh
bun install
bunx playwright install chromium
bun run scripts/scrape-randommath.ts --limit 5 --dry-run
```

The last command checks five missing solutions without changing your problem file. To download all missing AMC 10 solutions:

```sh
bun run scripts/scrape-randommath.ts
```

Solutions save after each successful page to `src/data/amc10.json`. The terminal reports seconds and whether each page came directly from the browser or cache. Details and source URLs are recorded in `scripts/randommath-report.json`. Restart the same command after interruption; completed rows are skipped. Use `--refresh` to re-fetch cached pages.

Pages with mismatched identity, inaccessible content, unsupported equations, or diagrams requiring separate asset imports are skipped rather than saving incomplete work. Download speed and coverage vary; this source is not guaranteed to fill every gap. Keep the computer awake and terminal open. Upload the updated `src/data/amc10.json` to your linked GitHub repository to update your website.

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
