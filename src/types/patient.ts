export type Patient = {
  PatNum: number
  LName: string | null
  FName: string | null
  Birthdate: Date
  HmPhone: string | null
  WkPhone: string | null
  WirelessPhone: string | null
  Email: string | null
  PatStatus: number
  colorIndex: number // patient-n in tailwind.config.ts
  // Future fields for tags:
  // isActive: boolean
  // hasBalance: boolean
} 