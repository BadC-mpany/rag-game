// Simple line-based diff using LCS (Longest Common Subsequence).
// Returns an array of ops: { op: 'equal'|'add'|'del', line: string }
export type DiffOp = { op: 'equal' | 'add' | 'del'; line: string };
export function lineDiff(a: string, b: string): DiffOp[] {
  const aLines = a.split(/\r?\n/);
  const bLines = b.split(/\r?\n/);
  const n = aLines.length;
  const m = bLines.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && aLines[i] === bLines[j]) {
      ops.push({ op: 'equal', line: aLines[i] });
      i++; j++;
    } else if (j < m && (i === n || dp[i][j + 1] >= (i < n ? dp[i + 1][j] : -1))) {
      ops.push({ op: 'add', line: bLines[j] });
      j++;
    } else if (i < n) {
      ops.push({ op: 'del', line: aLines[i] });
      i++;
    } else {
      // fallback
      if (j < m) { ops.push({ op: 'add', line: bLines[j] }); j++; }
      else break;
    }
  }

  return ops;
}

// Format ops into a simple unified-style diff string
export function formatUnifiedDiff(ops: DiffOp[], fileName = ''): string {
  const header = `--- a/${fileName}\n+++ b/${fileName}\n`;
  const body = ops.map(o => {
    if (o.op === 'equal') return ` ${o.line}`;
    if (o.op === 'add') return `+${o.line}`;
    return `-${o.line}`;
  }).join('\n');
  return header + body + '\n';
}
