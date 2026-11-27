export type User = {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
};

export type UserUpdated = {
  full_name?: string;
  phone?: string;
  password?: string;
};
