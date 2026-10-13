import { redirect } from "next/navigation";

/** Kept so old links keep working. The section is now called Opportunities. */
export default function ScoutPage() {
  redirect("/opportunities");
}
