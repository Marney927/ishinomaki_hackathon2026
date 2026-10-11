import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input.tsx"
import { Button } from "@/components/ui/button.tsx"

export function Login() {
  return (
    <FieldSet className="w-full max-w-xl border border-white-300 border-4 p-6 rounded-lg">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">E-mail address</FieldLabel>
          <Input id="email" type="email" placeholder="info@example.com" />
          <FieldDescription className="text-yellow-500">
            DO NOT enter real e-mail address.<br />
            Emails must follow this pattern: [a-zA-Z0-9]@example.com
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" placeholder="••••••••" />
        </Field>
        <Field className="grid grid-cols-2 gap-2 w-full">
          <Button className="w-full">Register</Button>
          <Button className="w-full">Login</Button>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
