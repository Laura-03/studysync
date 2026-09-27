import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PreferencesForm from "@/components/PreferencesForm";
import { Card, CardHeader } from "@/components/ui/Card";
import type { Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name", { ascending: true });

  const subjectList: Subject[] = (subjects ?? []) as Subject[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Study preferences
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Tell us what you want to study so we can match you with the right
          partner.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Set your session"
          subtitle="You'll be matched with a student who chose the same subject and duration."
        />
        <PreferencesForm subjects={subjectList} />
      </Card>
    </div>
  );
}