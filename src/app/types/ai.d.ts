export type Conversation = {
  role: string;
  parts: { text: string; thought?: boolean }[];
};

export type ChatSession = {
  id: string;
  title: string;
  message: Conversation[];
  user_id: string;
  created_at: string;
  updated_at: string;
};
