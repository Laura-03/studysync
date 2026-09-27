"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Subject, StudyStyle } from "@/lib/types";
import { DURATIONS, STUDY_STYLES } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

const CUSTOM_VALUE = "custom";

export default function PreferencesForm({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();

  const [subjectChoice, setSubjectChoice] = useState<string>(
    subjects.length > 0 ? String(subjects[0].id) : CUSTOM_VALUE
  );
  const [customSubject, setCustomSubject] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [studyStyle, setStudyStyle] = useState<StudyStyle>("Silent");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const isCustom = subjectChoice === CUSTOM_VALUE;
    const trimmedCustom = customSubject.trim();

    if (isCustom && trimmedCustom.length === 0) {
      setError("Please enter the subject you want to study.");
      return;
    }

    const params = new URLSearchParams();
    if (isCustom) {
      params.set("customSubject", trimmedCustom);
    } else {
      params.set("subjectId", subjectChoice);
    }
    params.set("duration", String(duration));
    params.set("style", studyStyle);

    router.push(`/matching?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Subject</h2>
        <Select
          label="Choose a subject"
          name="subject"
          value={subjectChoice}
          onChange={(e) => setSubjectChoice(e.target.value)}
        >
          {subjects.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
          <option value={CUSTOM_VALUE}>Other (type my own)</option>
        </Select>

        {subjectChoice === CUSTOM_VALUE ? (
          <Input
            label="Your subject"
            name="customSubject"
            placeholder="e.g. Organic Chemistry"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Study duration
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                duration === d
                  ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              )}
            >
              {d} min
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Study style</h2>
        <div className="space-y-2">
          {STUDY_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setStudyStyle(style)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                studyStyle === style
                  ? "border-brand-600 bg-brand-50 ring-2 ring-brand-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <span className="text-sm font-semibold text-slate-900">
                {style}
              </span>
              <span
                className={cn(
                  "h-4 w-4 rounded-full border-2",
                  studyStyle === style
                    ? "border-brand-600 bg-brand-600"
                    : "border-slate-300"
                )}
              />
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full">
        Find a study partner
      </Button>
    </form>
  );
}