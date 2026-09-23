"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget); const email = String(form.get("email")); const password = String(form.get("password"));
    const supabase = createClient();
    const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup") setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso.");
    else location.assign("/");
    setLoading(false);
  }
  return <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"><p className="text-sm font-medium text-emerald-400">Mis gastos</p><h1 className="mt-1 text-2xl font-bold text-slate-100">{mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}</h1><div className="mt-6 space-y-4"><label className="block text-sm text-slate-300">Correo<input required name="email" type="email" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500" /></label><label className="block text-sm text-slate-300">Contraseña<input required name="password" minLength={6} type="password" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500" /></label></div>{message && <p className="mt-4 text-sm text-amber-300">{message}</p>}<button disabled={loading} className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">{loading ? "Procesando…" : mode === "login" ? "Entrar" : "Registrarme"}</button><button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="mt-4 w-full text-sm text-slate-400 hover:text-slate-200">{mode === "login" ? "¿No tienes cuenta? Regístrate" : "Ya tengo una cuenta"}</button></form>;
}
