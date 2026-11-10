// eval.js starter. Fill in the four TODOs, then run: node eval.js
// You should not need any libraries. Plain Node.js is enough.
const fs = require('fs');

// --- 1. Load the inputs (already done for you) -----------------------------
// test-set.csv has a header row, then: query,correct_post_ids
// correct_post_ids may be a semicolon list, e.g. "1024;1025".
function loadTestSet(path) {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1);
  return lines.map(line => {
    const trimmed = line.trim();
    const [query, ids] = trimmed.split(',');
    return { query, correctIds: ids.split(';').map(Number) };
  });
}
const testSet = loadTestSet('test-set.csv');

// search-results.json maps each query to the top-10 ranked post_id lists that
// each system returned: { "<query>": { keyword: [...], semantic: [...] } }
const results = JSON.parse(fs.readFileSync('search-results.json', 'utf8'));

// --- 2. TODO: Reciprocal Rank ----------------------------------------------
// Return 1 / (rank of the FIRST correct id in rankedIds). Return 0 if none of
// the correct ids appear in rankedIds. Rank is 1-based (first result = rank 1).
function reciprocalRank(rankedIds, correctIds) {
  for (let i = 0; i < rankedIds.length; i++) {
    if (correctIds.includes(rankedIds[i])) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

// Helper: the 1-based rank of the first correct id, or null if it is a miss.
function rankOf(rankedIds, correctIds) {
  for (let i = 0; i < rankedIds.length; i++) {
    if (correctIds.includes(rankedIds[i])) {
      return i + 1;
    }
  }
  return null;
}

// --- 3. TODO: run the evaluation loop --------------------------------------
// For every query: look up its keyword and semantic ranked lists, compute the
// reciprocal rank of each, accumulate the RRs, and count a "hit" whenever the
// correct answer was found in the top 10 (RR > 0).
// Then compute:
//   keywordMRR, semanticMRR         = average RR across all queries
//   keywordRecall, semanticRecall   = hits / number of queries
const kwRRs = [];
const semRRs = [];
let kwHits = 0;
let semHits = 0;

const rows = [];

for (const { query, correctIds } of testSet) {
  const queryResults = results[query];
  const kwList = queryResults.keyword;
  const semList = queryResults.semantic;

  const kwRR = reciprocalRank(kwList, correctIds);
  const semRR = reciprocalRank(semList, correctIds);

  kwRRs.push(kwRR);
  semRRs.push(semRR);

  if (kwRR > 0) kwHits++;
  if (semRR > 0) semHits++;

  const kwRankStr = rankOf(kwList, correctIds) !== null ? rankOf(kwList, correctIds) : "miss";
  const semRankStr = rankOf(semList, correctIds) !== null ? rankOf(semList, correctIds) : "miss";

  rows.push({ query, kwRankStr, semRankStr });
}

const mean = arr => arr.reduce((acc, val) => acc + val, 0) / arr.length;
const keywordMRR = mean(kwRRs).toFixed(2);
const semanticMRR = mean(semRRs).toFixed(2);

const keywordRecall = (kwHits / testSet.length).toFixed(2);
const semanticRecall = (semHits / testSet.length).toFixed(2);

// --- 4. TODO: print a markdown comparison table ----------------------------
// Print one row per query: | query | keyword rank | semantic rank |  (use "miss"
// when the answer was not in the top 10), then a final **Summary** row with
// MRR and Recall@10 for each system, each rounded to 2 decimals.
console.log("| Query | Keyword rank | Semantic rank |");
console.log("|---|---|---|");
for (const row of rows) {
  console.log(`| ${row.query} | ${row.kwRankStr} | ${row.semRankStr} |`);
}
console.log(`| **Summary** | **MRR ${keywordMRR} · Recall@10 ${keywordRecall}** | **MRR ${semanticMRR} · Recall@10 ${semanticRecall}** |`);
