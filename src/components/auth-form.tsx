"use client"

import { EyeIcon, EyeOffIcon } from "lucide-react"
import Link from "next/link"
import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { type FormState, login, register } from "@/lib/actions/auth"

function FieldError({ id, state, field }: { id: string; state: FormState; field: "name" | "email" | "password" }) {
  if (state?.field !== field) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {state.error}
    </p>
  )
}

export function AuthForm({ mode, invite, next }: { mode: "login" | "register"; invite?: string; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const query = invite ? `?invite=${invite}` : ""
  const invalid = (field: "name" | "email" | "password") => state?.field === field

  return (
    <Card>
      <CardContent>
        <form action={action} noValidate className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">{mode === "login" ? "Вход" : "Регистрация"}</h1>
          {invite && <input type="hidden" name="invite" value={invite} />}
          {next && <input type="hidden" name="next" value={next} />}
          {mode === "register" && (
            <div className="grid gap-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                name="name"
                autoComplete="given-name"
                defaultValue={state?.values?.name}
                aria-invalid={invalid("name")}
                aria-describedby={invalid("name") ? "name-error" : "name-hint"}
                required
              />
              {invalid("name") ? (
                <FieldError id="name-error" state={state} field="name" />
              ) : (
                <p id="name-hint" className="text-sm text-muted-foreground">
                  Так вас увидит партнёр в записях и комментариях
                </p>
              )}
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Почта</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              defaultValue={state?.values?.email}
              aria-invalid={invalid("email")}
              aria-describedby={invalid("email") ? "email-error" : undefined}
              required
            />
            <FieldError id="email-error" state={state} field="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
                aria-invalid={invalid("password")}
                aria-describedby={invalid("password") ? "password-error" : mode === "register" ? "password-hint" : undefined}
                className="pr-12"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPassword}
                className="absolute top-0 right-0 text-muted-foreground"
              >
                {showPassword ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
              </Button>
            </div>
            {invalid("password") ? (
              <FieldError id="password-error" state={state} field="password" />
            ) : (
              mode === "register" && (
                <p id="password-hint" className="text-sm text-muted-foreground">
                  Минимум 6 символов
                </p>
              )
            )}
          </div>
          {state?.error && !state.field && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Spinner />}
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <Link
              href={`${mode === "login" ? "/register" : "/login"}${query}`}
              className="inline-flex min-h-11 items-center text-foreground underline underline-offset-4 md:min-h-0"
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
