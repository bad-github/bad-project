import {UserDB} from './db/user-db';

class DBProvider {
  // 数据库都是UserDB，只是根据不同的业务（type）会创建不同的数据库名，达到互不影响的目的
  private instances: Map<string, UserDB> = new Map();
  // @ts-expect-error description
  private type: string = 'one';

  /**
   * 根据类型解析索引路径
   * 嵌套对象使用点号(.)，复合索引使用方括号([])
   */
  private resolveIndexSchema(type: string): string {
    switch (type) {
      /**
       * 最终schema:{ records: "++dbId, oneId" }。每条数据自增主键 dbId（自动生成），同时会给业务数据的字段 oneId 建一个普通索引
       */
      case 'one':
        return ', oneId';
      case 'two':
        return ', twoId';
      default:
        return '';
    }
  }

  updateType(type: string) {
    this.type = type;
  }

  buildName(type: string): string {
    return `g-${type}-user-db`;
  }

  createDB(type: string): UserDB {
    const dbName = this.buildName(type);
    // 检查缓存中是否已有实例
    if (this.instances.has(dbName)) {
      return this.instances.get(dbName)!;
    }

    // 复合索引：", [字段1+字段2]"，单独索引：", 字段1"
    const indexSchema = this.resolveIndexSchema(type);

    // 实例化并存入缓存
    const newInstance = new UserDB(dbName, indexSchema);
    this.instances.set(dbName, newInstance);
    return newInstance;
  }

  /**
   * 获取当前所有已打开的数据库名称
   */
  getActiveDatabases(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * 彻底关闭并移除某个数据库实例
   * 在切换大版本或彻底退出业务模块时使用
   */
  disposeDB(type: string) {
    const dbName = this.buildName(type);
    const instance = this.instances.get(dbName);
    if (instance) {
      instance.getDexieInstance().close();
      this.instances.delete(dbName);
    }
  }
}

export const dbProvider = new DBProvider();
