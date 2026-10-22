type SavedProblem = { id: string; answer: string; solutionLatex?: string; solutionUrl: string };

export function missingSolutions<T extends SavedProblem>(rows: T[]): T[] {
  return rows.filter(row => !row.solutionLatex?.trim());
}

export function addSolution<T extends SavedProblem>(row: T, solution: string): T {
  return solution.trim() ? { ...row, solutionLatex: solution } : row;
}