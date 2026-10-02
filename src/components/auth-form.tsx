"use client"

import Link from "next/link"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, register, type FormState } from "@/lib/actions/auth"

export function AuthForm({ mode, invite, next }: { mode: "login" | "register"; invite?: string; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined)
  const query = invite ? `?invite=${invite}` : ""

  return (
    <Card>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          {invite && <input type="hidden" name="invite" value={invite} />}
          {next && <input type="hidden" name="next" value={next} />}
          {mode === "register" && (
            <div className="grid gap-2">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" name="name" autoComplete="given-name" placeholder="Как вас называть" required />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Почта</Label>
            <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>
          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending}>
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Нет аккаунта?{" "}
                <Link href={`/register${query}`} className="text-foreground underline underline-offset-4">
                  Зарегистрироваться
                </Link>
              </>
            ) : (
              <>
                Уже есть аккаунт?{" "}
                <Link href={`/login${query}`} className="text-foreground underline underline-offset-4">
                  Войти
                </Link>
              </>
            )}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
