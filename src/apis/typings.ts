export interface IOriginData<T> {
  code?: number;
  status?: number;
  message?: string;
  data: T;
  page?: number;
  limit?: number;
  total?: number;
}

export interface IBaseEntity {
  _id: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
}
