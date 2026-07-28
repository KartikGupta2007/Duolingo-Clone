import { redirect } from "next/navigation";

/** The path is the app's home. */
export default function Home() {
  redirect("/learn");
}
