import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion – EduTrack" },
      { name: "description", content: "EduTrack : plateforme de gestion des notes et absences." },
      { property: "og:title", content: "EduTrack – Notes et Absences" },
      { property: "og:description", content: "Gérez notes, absences et justificatifs en un seul endroit." },
    ],
  }),
  component: Login,
});

const schema = z.object({ email: z.string().email("Adresse e-mail invalide"), password: z.string().min(6, "Au moins 6 caractères") });
type F = z.infer<typeof schema>;
const DEMOS = [["Admin", "admin@edutrack.com"], ["Enseignant", "teacher@edutrack.com"], ["Étudiant", "student@edutrack.com"], ["Parent", "parent@edutrack.com"]];

function Login() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });
  const submit = (d: F) => {
    const u = login(d.email, d.password);
    if (!u) return toast.error("Identifiants incorrects");
    toast.success(`Bienvenue, ${u.name}`);
    nav({ to: "/dashboard" });
  };
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground md:flex">
        <div className="flex items-center gap-2 text-xl font-bold"><GraduationCap /> EduTrack</div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Notes, absences et justificatifs.<br />Tout au même endroit.</h1>
          <p className="mt-4 opacity-80">Pour l'administration, les enseignants, les étudiants et les parents.</p>
        </div>
        <p className="text-sm opacity-70">© 2026 EduTrack</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit(submit)} className="w-full max-w-sm space-y-5" noValidate>
          <div><h2 className="text-2xl font-bold">Connexion</h2><p className="text-sm text-muted-foreground">Accédez à votre espace</p></div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Mot de passe</Label>
            <div className="relative">
              <Input id="pw" type={show ? "text" : "password"} {...register("password")} aria-invalid={!!errors.password} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-2 text-muted-foreground" aria-label="Afficher le mot de passe">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>Se connecter</Button>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Comptes de démo (mot de passe : Password123!)</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMOS.map(([l, e]) => (
                <Button key={e} type="button" variant="outline" size="sm" onClick={() => { setValue("email", e); setValue("password", "Password123!"); }}>{l}</Button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
