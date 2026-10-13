import { redirect } from "next/navigation";

/** Kept so old links keep working. Teaching now lives under Topics. */
export default function TeachPage() {
  redirect("/topics");
}
