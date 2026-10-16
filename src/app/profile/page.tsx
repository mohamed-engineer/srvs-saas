import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileSettings from "./profile-settings";

export default async function ProfilePage() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=%2Fprofile");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/login?setup=1");
  }
  return <ProfileSettings />;
}
