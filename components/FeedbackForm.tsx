"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FeedbackFormProps {
  sessionId: string;
  userId: string;
  partnerName: string;
  subjectLabel: string;
}

export default function FeedbackForm({
  sessionId,
  userId,
  partnerName,
  subjectLabel,
}: FeedbackFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: insertError } = await supabase.from("feedback").insert({
      session_id: sessionId,
      user_id: userId,
      rating,
      comment: comment.trim().length > 0 ? comment.trim() : null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          You studied{" "}
          <span className="font-semibold text-slate-900">{subjectLabel}</span>
          {partnerName ? (
            <>
              {" "}
              with{" "}
              <span className="font-semibold text-slate-900">
                {partnerName}
              </span>
            </>
          ) : null}
          .
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900">
          How was your session?
        </p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onClick={() => setRating(value)}
              className={cn(
                "h-11 w-11 rounded-xl border text-lg font-bold transition",
                rating >= value
                  ? "border-amber-400 bg-amber-50 text-amber-500"
                  : "border-slate-200 bg-white text-slate-300 hover:border-slate-300"
              )}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="comment"
          className="mb-1.5 block text-sm font-semibold text-slate-900"
        >
          Anything else? (optional)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          placeholder="How did the session go?"
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" loading={submitting} className="w-full">
        Submit feedback
      </Button>
    </form>
  );
}