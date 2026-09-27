export type StudyStyle = "Silent" | "Occasional Chat" | "Accountability";

export const STUDY_STYLES: StudyStyle[] = [
  "Silent",
  "Occasional Chat",
  "Accountability",
];

export const DURATIONS: number[] = [30, 45, 60];

export interface Profile {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface Subject {
  id: number;
  name: string;
}

export interface StudySession {
  id: string;
  subject_id: number | null;
  custom_subject: string | null;
  duration: number;
  study_style: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string | null;
  left_at: string | null;
}

export interface MatchingQueueRow {
  id: string;
  user_id: string;
  subject_id: number | null;
  custom_subject: string | null;
  duration: number;
  study_style: string;
  status: string;
  created_at: string;
}

export interface MatchRow {
  id: string;
  session_id: string;
  user_id: string;
  matched_user_id: string;
  created_at: string;
}

export interface FeedbackRow {
  id: string;
  session_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}