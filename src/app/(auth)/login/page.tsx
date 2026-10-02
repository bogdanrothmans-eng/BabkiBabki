import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthForm } from "@/components/auth-form"
import { getUser } from "@/lib/auth"

export const metadata: Metadata = { title: "Вход" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { invite, next } = await searchParams
  if (await getUser()) redirect(typeof invite === "string" ? `/invite/${invite}` : "/")
  return (
    <AuthForm
      mode="login"
      invite={typeof invite === "string" ? invite : undefined}
      next={typeof next === "string" ? next : undefined}
    />
  )
}
