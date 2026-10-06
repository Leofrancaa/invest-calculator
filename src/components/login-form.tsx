"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LineChart, LockKeyhole } from "lucide-react";
import { signIn, type LoginState } from "@/app/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {
    error: "",
  } as LoginState);
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState("");
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!state.error) return;
    if (state.field === "username") usernameRef.current?.focus();
    else passwordRef.current?.focus();
  }, [state]);
  return (
    <main className="login-shell">
      <div className="login-content">
        <div className="brand login-brand">
          <span className="brand-symbol">
            <LineChart size={21} />
          </span>
          <span>
            invest<span className="brand-light">calculator</span>
            <span className="brand-dot">.</span>
          </span>
        </div>
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-icon">
            <LockKeyhole size={23} />
          </div>
          <h1 id="login-title">Seu espaço de investimentos.</h1>
          <p className="login-description">
            Entre para acessar suas calculadoras de investimentos.
          </p>
          <form action={action} noValidate>
            <div className="field">
              <label htmlFor="username">Usuário</label>
              <div className="input-wrap">
                <input
                  ref={usernameRef}
                  id="username"
                  name="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  type="text"
                  autoComplete="username"
                  maxLength={80}
                  aria-required="true"
                  aria-invalid={state.field === "username"}
                  aria-describedby={state.error ? "login-error" : undefined}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <div className="input-wrap">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={256}
                  aria-required="true"
                  aria-invalid={state.field === "password"}
                  aria-describedby={state.error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  className="icon-button password-toggle"
                  onClick={() => setVisible((value) => !value)}
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={visible}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="login-error" id="login-error" role="alert">
              {state.error}
            </div>
            <button
              type="submit"
              className="button primary login-submit"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? "Entrando…" : "Entrar"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="login-footnote">
            Acesso de administrador · sessão válida por 8 horas.
          </p>
        </section>
        <p className="login-caption">
          Seus cálculos e cenários salvos ficam neste dispositivo.
        </p>
      </div>
    </main>
  );
}
