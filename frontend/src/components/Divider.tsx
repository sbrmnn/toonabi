import { JP } from "./JP"

type Props = {
  en: string
  jp: string
}

export function Divider({ en, jp }: Props) {
  return (
    <div className="my-12 flex items-center gap-4">
      <span className="h-[2px] flex-1 rounded-full bg-gradient-to-r from-transparent via-sage-300 to-sage-400" />
      <div className="flex flex-col items-center text-center leading-tight">
        <span
          className="text-3xl text-sage-600"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {en}
        </span>
        <JP className="text-xs font-medium text-rose-400">{jp}</JP>
      </div>
      <span className="h-[2px] flex-1 rounded-full bg-gradient-to-l from-transparent via-sage-300 to-sage-400" />
    </div>
  )
}
