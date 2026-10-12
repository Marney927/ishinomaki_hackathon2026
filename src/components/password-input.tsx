import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete = "current-password",
  disabled = false,
  placeholder = "パスワードを入力",
}: {
  id: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  disabled?: boolean
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="password-input">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        placeholder={placeholder}
      />
      <button
        type="button"
        aria-label={visible ? "パスワードを隠す" : "パスワードを表示"}
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  )
}
