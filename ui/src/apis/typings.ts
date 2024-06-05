export interface IOriginData<T> extends Omit<IPaginationListData<T>, 'data'> {
  code?: number;
  status?: number;
  message?: string;
  data: T;
}

export interface IBaseEntity {
  id: string;
  uuid: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
}

export interface IPaginationListData<T> {
  data: T[];
  page?: number;
  limit?: number;
  total?: number;
}
