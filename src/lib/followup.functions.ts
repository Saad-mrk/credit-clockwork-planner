import { createServerFn } from "@tanstack/react-start";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

type Input = { student: string; className: string; absences: string; observations: string };

export const generateFollowUp = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    if (!d.student || d.observations.trim().length < 5) throw new Error("Observations trop courtes");
    return { ...d, observations: d.observations.slice(0, 4000), absences: d.absences.slice(0, 4000) };
  })
  .handler(async ({ data }) => {
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          "Tu es conseiller pédagogique. Rédige en français un plan de suivi personnalisé, bienveillant et concret pour un élève, en Markdown simple avec ces sections : ## Synthèse, ## Points de vigilance, ## Objectifs (3, mesurables), ## Actions proposées (élève, enseignant, famille), ## Calendrier de suivi (4 semaines), ## Indicateurs de réussite. Sois concis.",
        input: `Élève : ${data.student} (classe ${data.className})\n\nAbsences :\n${data.absences || "Aucune"}\n\nObservations de l'enseignant :\n${data.observations}`,
      });
      const text = (res.output ?? [])
        .flatMap((o: any) => (o.type === "message" ? o.content ?? [] : []))
        .filter((c: any) => c.type === "output_text")
        .map((c: any) => c.text)
        .join("\n");
      return { plan: text, error: null as string | null };
    } catch (e) {
      console.error(e);
      const msg = e instanceof GatewayError && e.httpStatus === 429 ? "Trop de demandes, réessaie dans un instant." :
        e instanceof GatewayError && e.httpStatus === 402 ? "Crédits IA épuisés." : "Le plan n'a pas pu être généré.";
      return { plan: "", error: msg };
    }
  });
