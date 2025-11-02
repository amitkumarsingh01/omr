export interface Template {
  id: number;
  name: string;
  description?: string;
  total_questions: number;
  answer_key: Record<string, string>;
  created_at: string;
}

export interface OMRSheet {
  id: number;
  template_id: number;
  student_name?: string;
  roll_number?: string;
  exam_date?: string;
  other_details?: Record<string, any>;
  responses: Record<string, string>;
  image_path?: string;
  correct_count: number;
  wrong_count: number;
  total_questions: number;
  percentage: string;
  created_at: string;
}

export interface AnswerKey {
  id: number;
  name: string;
  description?: string;
  answer_key: Record<string, string>;
  created_at: string;
}

