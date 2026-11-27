import { redirect } from "next/navigation"

export default function InboundShieldPublicPage() {
  redirect("/workflows?tab=professional")
}
