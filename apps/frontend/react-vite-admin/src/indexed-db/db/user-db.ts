import type {BaseEntity} from '../app-database';
import {BaseDB} from '../base-db';

export interface UserRecord extends BaseEntity {
  [key: string]: any;
}

export class UserDB extends BaseDB<UserRecord> {
  // @ts-expect-error description
  private readonly indexSchema: string;

  constructor(databaseName: string, indexSchema: string = '') {
    super(databaseName, indexSchema);
    this.indexSchema = indexSchema;
  }

  getDexieInstance() {
    return this.db;
  }
}
