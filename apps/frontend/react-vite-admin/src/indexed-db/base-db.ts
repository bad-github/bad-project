import {AppDatabase, type BaseEntity} from './app-database';

export abstract class BaseDB<T extends BaseEntity> {
  protected db: AppDatabase<T>;

  protected static getBasicSchema() {
    return {records: '++dbId'};
  }

  constructor(databaseName: string, extraIndices: string = '') {
    // 组合 Schema：'++dbId' + 子类传入的额外索引
    const schema = {
      records: `${BaseDB.getBasicSchema().records}${extraIndices}`,
    };
    this.db = new AppDatabase<T>(databaseName, schema);
  }

  async add(data: T) {
    return await this.db.records.add(data);
  }

  // 批量保存
  async batchAdd(data: T[]) {
    return await this.db.records.bulkAdd(data);
  }

  async getCount(): Promise<number> {
    return await this.db.records.count();
  }

  async getById(id: number) {
    return await this.db.records.get(id);
  }

  async getByIds(ids: number[]) {
    // 返回一个与输入 ID 顺序对应的数组，如果某个 ID 不存在，对应位置会是 undefined
    return await this.db.records.bulkGet(ids);
  }
  async deleteById(id: number) {
    return await this.db.records.delete(id);
  }
  async batchDelete(ids: number[]) {
    return await this.db.records.bulkDelete(ids);
  }

  // 局部更新：只修改传入的字段
  async updateById(id: number, data: Partial<T>) {
    return await this.db.records.update(id, data as any);
  }
  // 批量局部更新
  async batchUpdate(data: Partial<T>[]) {
    return await this.db.records.bulkUpdate(data as any);
  }
  // 新增或更新，替换整个对象
  async putRecord(data: T) {
    return await this.db.records.put(data);
  }
  // 批量新增或替换
  async batchPut(data: T[]) {
    return await this.db.records.bulkPut(data);
  }
  // 获取最新一行
  async getLatest(): Promise<T | undefined> {
    return await this.db.records.orderBy('dbId').reverse().first();
  }
  // 获取最旧一行
  async getOldest(): Promise<T | undefined> {
    return await this.db.records.orderBy('dbId').first();
  }
  // 获取指定行
  async getByIndex(index: number): Promise<T | undefined> {
    return await this.db.records.orderBy('dbId').offset(index).first();
  }

  async getPage(offset: number, limit: number): Promise<T[]> {
    return await this.db.records.offset(offset).limit(limit).toArray();
  }

  async clearAll() {
    return await this.db.records.clear();
  }

  async close() {
    return this.db.close();
  }

  async getAll() {
    return await this.db.records.toArray();
  }
}
