import { describe, it, expect } from "vitest";
import { subjectAverage, weightedAverage, mention, absenceAlert, computeRanking, isValidGrade } from "./grades";

describe("grades", () => {
  it("moyenne matière pondérée", () => {
    expect(subjectAverage([{ type: "DS", value: 10 }, { type: "TP", value: 20 }, { type: "Examen", value: 10 }])).toBe(12);
  });
  it("moyenne semestre par coefficient", () => {
    expect(weightedAverage([{ avg: 10, coef: 1 }, { avg: 16, coef: 2 }])).toBe(14);
  });
  it("mentions", () => {
    expect(mention(9.99)).toBe("Ajourné");
    expect(mention(10)).toBe("Passable");
    expect(mention(12)).toBe("Assez Bien");
    expect(mention(14)).toBe("Bien");
    expect(mention(16)).toBe("Très Bien");
  });
  it("alerte absences au seuil 5", () => {
    expect(absenceAlert(4)).toBe(false);
    expect(absenceAlert(5)).toBe(true);
  });
  it("classement avec ex-aequo", () => {
    expect(computeRanking([{ id: "a", avg: 12 }, { id: "b", avg: 15 }, { id: "c", avg: 12 }])).toEqual({ b: 1, a: 2, c: 2 });
  });
  it("note entre 0 et 20", () => {
    expect(isValidGrade(21)).toBe(false);
    expect(isValidGrade(0)).toBe(true);
  });
});
