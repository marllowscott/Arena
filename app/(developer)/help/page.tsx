import { redirect } from "next/navigation";

/** Kept so old links keep working. Help requests are now Probe. */
export default function HelpPage() {
  redirect("/probe");
}
