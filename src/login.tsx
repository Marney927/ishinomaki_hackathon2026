import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input.tsx"
import { Button } from "@/components/ui/button.tsx"
import { List, Megaphone, Users } from "lucide-react"

export function Login() {
  return (
    <div className="grid h-screen w-full grid-cols-2 place-items-center">
      <div>
        <h1 className="font-serif text-4xl font-bold">Guild Task Board</h1>
        <div>
          <div className="flex flex-col gap-y-6 mt-10">
            <div className="flex text-2xl"><List className="mr-3 scale-150" /> Make tasks visible</div>
            <div className="flex text-2xl"><Users className="mr-3 scale-150" /> Cooperate with colleagues</div>
            <div className="flex text-2xl"><Megaphone className="mr-3 scale-150" /> Recruit co-workers</div>
          </div>
        </div>
      </div>
      <FieldSet className="border-white-300 w-full max-w-xl rounded-lg border border-4 p-6">
        <FieldGroup>
          <FieldTitle className="font-bold font-serif text-3xl">Login / Signup</FieldTitle>
          <Field>
            <FieldLabel htmlFor="email">E-mail address</FieldLabel>
            <Input id="email" type="email" placeholder="info@example.com" />
            <FieldDescription className="text-yellow-500">
              DO NOT enter real e-mail address.
              <br />
              Emails must follow this pattern: [a-zA-Z0-9]@example.com
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" placeholder="••••••••" />
          </Field>
          <Field className="grid w-full grid-cols-2 gap-2">
            <Button variant="default" className="w-full">
              Login
            </Button>
            <Button variant="default" className="w-full">
              Register
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  )
}
