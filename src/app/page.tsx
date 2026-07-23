import { redirect } from "next/navigation";

/** The app opens into the dashboard shell. (Auth-based routing lands in Phase 5.) */
export default function Home() {
  redirect("/dashboard");
}
