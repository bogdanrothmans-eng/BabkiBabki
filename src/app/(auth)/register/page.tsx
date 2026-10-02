import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthForm } from "@/components/auth-form"
import { getUser } from "@/lib/auth"

export const metadata: Metadata = { title: "Регистрация" }

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { invite } = await searchParams
  if (await getUser()) redirect(typeof invite === "string" ? `/invite/${invite}` : "/")
  return <AuthForm mode="register" invite={typeof invite === "string" ? invite : undefined} />
}
