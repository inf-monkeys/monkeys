export interface IPaginationListData<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface IBaseEntity {
  _id: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
}
