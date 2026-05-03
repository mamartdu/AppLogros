export interface Achievement {
  id: string;
  category_id: string;
  level_id: string;
  title: string;
  description: string;
  points: number;
  is_completed: boolean;
  completed_at: string | null;
  photo_url: string | null;
}
