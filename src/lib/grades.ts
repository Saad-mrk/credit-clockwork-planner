export type EvalType = "DS" | "TP" | "Examen";
export const EVAL_WEIGHTS: Record<EvalType, number> = { DS: 0.3, TP: 0.2, Examen: 0.5 };

/** Moyenne matière = pondération des évaluations disponibles */
export function subjectAverage(grades: { type: EvalType; value: number }[]): number | null {
  if (!grades.length) return null;
  let sum = 0;
  let w = 0;
  for (const g of grades) {
    sum += g.value * EVAL_WEIGHTS[g.type];
    w += EVAL_WEIGHTS[g.type];
  }
  return round2(sum / w);
}

/** Moyenne semestre = Σ(moyenne × coef) / Σ coef */
export function weightedAverage(items: { avg: number | null; coef: number }[]): number | null {
  const valid = items.filter((i) => i.avg !== null) as { avg: number; coef: number }[];
  const c = valid.reduce((a, i) => a + i.coef, 0);
  if (!c) return null;
  return round2(valid.reduce((a, i) => a + i.avg * i.coef, 0) / c);
}

export function mention(avg: number | null): string {
  if (avg === null) return "—";
  if (avg >= 16) return "Très Bien";
  if (avg >= 14) return "Bien";
  if (avg >= 12) return "Assez Bien";
  if (avg >= 10) return "Passable";
  return "Ajourné";
}

export function absenceAlert(unjustified: number, threshold = 5): boolean {
  return unjustified >= threshold;
}

/** Rang (1 = meilleur), ex-aequo partagent le même rang */
export function computeRanking(list: { id: string; avg: number | null }[]): Record<string, number> {
  const sorted = [...list].filter((x) => x.avg !== null).sort((a, b) => b.avg! - a.avg!);
  const out: Record<string, number> = {};
  sorted.forEach((s, i) => {
    out[s.id] = i > 0 && sorted[i - 1].avg === s.avg ? out[sorted[i - 1].id] : i + 1;
  });
  return out;
}

export const isValidGrade = (v: number) => !Number.isNaN(v) && v >= 0 && v <= 20;
const round2 = (n: number) => Math.round(n * 100) / 100;
