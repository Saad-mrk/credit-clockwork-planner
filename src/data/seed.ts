import type { EvalType } from "@/lib/grades";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
export interface User { id: string; name: string; email: string; role: Role; active: boolean; classId?: string; childId?: string }
export interface Klass { id: string; name: string; filiere: string }
export interface Subject { id: string; name: string; coef: number; semester: 1 | 2; teacherId: string }
export interface Grade { id: string; studentId: string; subjectId: string; type: EvalType; value: number }
export type AbsStatus = "justifiée" | "non justifiée" | "en attente";
export interface Absence { id: string; studentId: string; subjectId: string; date: string; kind: "Absent" | "Retard"; status: AbsStatus; reason?: string }
export interface Notif { id: string; title: string; date: string; read: boolean }
export interface DB { users: User[]; classes: Klass[]; subjects: Subject[]; grades: Grade[]; absences: Absence[]; notifications: Notif[]; threshold: number; sessions?: import("@/data/timetable").Session[] }

let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

const first = ["Youssef","Salma","Amine","Imane","Omar","Khadija","Mehdi","Fatima Zahra","Hamza","Aya","Ayoub","Nour","Anas","Meryem","Reda","Hiba","Ilyas","Sara","Zakaria","Lina"];
const last = ["El Amrani","Bennani","Alaoui","Tazi","Berrada","Chraibi","El Idrissi","Fassi","Benjelloun","Lahlou","Ouazzani","Kettani"];

export function buildSeed(): DB {
  seed = 42;
  const filieres = ["Informatique", "Génie Civil", "Gestion"];
  const classes: Klass[] = filieres.flatMap((f, i) => [1, 2].map((y) => ({ id: `c${i * 2 + y}`, name: `${f.slice(0, 4).toUpperCase()}-${y}A`, filiere: f })));
  const users: User[] = [
    { id: "a1", name: "Rachid Admin", email: "admin@edutrack.com", role: "ADMIN", active: true },
    { id: "t1", name: "Nadia Bennis", email: "teacher@edutrack.com", role: "TEACHER", active: true },
  ];
  ["a2","a3","a4"].forEach((id, i) => users.push({ id, name: `${pick(first)} ${pick(last)}`, email: `admin${i + 2}@edutrack.com`, role: "ADMIN", active: true }));
  ["t2","t3","t4"].forEach((id, i) => users.push({ id, name: `${pick(first)} ${pick(last)}`, email: `prof${i + 2}@edutrack.com`, role: "TEACHER", active: true }));
  for (let i = 1; i <= 40; i++) {
    users.push({ id: `s${i}`, name: i === 1 ? "Yassine El Amrani" : `${pick(first)} ${pick(last)}`, email: i === 1 ? "student@edutrack.com" : `etudiant${i}@edutrack.com`, role: "STUDENT", active: true, classId: classes[(i - 1) % 6].id });
  }
  users.push({ id: "p1", name: "Karim El Amrani", email: "parent@edutrack.com", role: "PARENT", active: true, childId: "s1" });
  ["p2","p3","p4"].forEach((id, i) => users.push({ id, name: `${pick(first)} ${pick(last)}`, email: `parent${i + 2}@edutrack.com`, role: "PARENT", active: true, childId: `s${i + 2}` }));
  const subjNames = ["Mathématiques","Algorithmique","Bases de données","Réseaux","Physique","Anglais","Français","Comptabilité","Économie","Statistiques","Résistance des matériaux","Programmation Web"];
  const teachers = ["t1","t2","t3","t4"];
  const subjects: Subject[] = subjNames.map((n, i) => ({ id: `m${i + 1}`, name: n, coef: (i % 3) + 1, semester: i < 6 ? 1 : 2, teacherId: teachers[i % 4] }));
  const grades: Grade[] = [];
  let g = 0;
  users.filter((u) => u.role === "STUDENT").forEach((s) => {
    subjects.slice(0, 4).forEach((m, j) => {
      const types: EvalType[] = j < 2 ? ["DS", "Examen"] : ["DS"];
      types.forEach((t) => grades.push({ id: `g${++g}`, studentId: s.id, subjectId: m.id, type: t, value: Math.round((6 + rnd() * 14) * 2) / 2 }));
    });
  });
  const absences: Absence[] = [];
  const statuses: AbsStatus[] = ["justifiée", "non justifiée", "non justifiée", "en attente"];
  for (let i = 1; i <= 150; i++) {
    const d = new Date(2026, 8 + Math.floor(rnd() * 2), 1 + Math.floor(rnd() * 28));
    absences.push({ id: `ab${i}`, studentId: i <= 6 ? "s1" : `s${1 + Math.floor(rnd() * 40)}`, subjectId: pick(subjects).id, date: d.toISOString().slice(0, 10), kind: rnd() > 0.8 ? "Retard" : "Absent", status: i <= 10 ? "en attente" : pick(statuses), reason: i <= 10 ? "Certificat médical" : undefined });
  }
  const notifications: Notif[] = Array.from({ length: 15 }, (_, i) => ({
    id: `n${i}`, read: i > 4, date: new Date(2026, 9, 25 - i).toISOString(),
    title: ["Nouvelle note publiée en Mathématiques", "Justificatif en attente de validation", "Rappel : conseil de classe vendredi", "Absence enregistrée en Réseaux", "Emploi du temps mis à jour"][i % 5],
  }));
  return { users, classes, subjects, grades, absences, notifications, threshold: 5 };
}

export const DEMO_PASSWORD = "Password123!";
