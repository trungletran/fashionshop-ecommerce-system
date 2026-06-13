export type Category = {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
};

export type UpsertCategoryRequest = {
  name: string;
  description?: string;
  isActive?: boolean;
};
