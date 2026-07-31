"use client"

import { useActionState } from "react"
import { authenticate } from "@/app/login/actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  )

  return (
    <form
      action={formAction}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-heading text-2xl font-bold">Hesabınıza giriş yapın</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Devam etmek için e-posta adresinizi ve şifrenizi girin
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ornek@sirket.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Şifre</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Field>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
