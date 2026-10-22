import { readFileSync, writeFileSync } from "node:fs";
import { tagProblem, type TagMap } from "/dev-server/src/lib/tagger";
const map: TagMap = JSON.parse(readFileSync("/dev-server/src/data/topic-tags.json", "utf8"));
for (const k of ["amc8", "amc10", "amc12", "aime"]) {
  const p = `/dev-server/src/data/${k}.json`;
  let arr: any[] = [];
  try { arr = JSON.parse(readFileSync(p, "utf8")); } catch { continue; }
  for (const prob of arr) prob.topics = tagProblem(map, prob.statementLatex, prob.solutionLatex ?? prob.solutionText ?? "");
  writeFileSync(p, JSON.stringify(arr, null, 2));
  console.log(k, arr.length, "retagged");
}
