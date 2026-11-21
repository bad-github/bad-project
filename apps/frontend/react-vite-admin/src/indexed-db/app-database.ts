import Dexie, {type Table} from 'dexie';

/**
 * 基础实体接口
 * 保证所有存储对象都有主键类型支持
 */
export interface BaseEntity {
  dbId?: number;
  createAt?: number;
  updateAt?: number;
}

export class AppDatabase<T extends BaseEntity> extends Dexie {
  // 统一为records
  public records!: Table<T>;

  constructor(databaseName: string, schema: {[key: string]: string}) {
    super(databaseName);

    // 不再这里写具体的业务索引，保证 AppDatabase 的通用性
    // 改了表结构需要改变version
    this.version(1)
      .stores(schema)
      .upgrade(() => {
        console.warn('indexed-db 版本更新', schema);
      });
    // add() / bulkAdd()前触发
    this.records.hook('creating', (_primaryKey, obj) => {
      obj.createAt = Date.now();
    });
    // update() / bulkPut() 前触发
    this.records.hook('updating', (changes, _primaryKey) => {
      console.log('changes', changes);
      // 这儿无法添加动态的属性，只能在更新的原数据上面添加
      // (changes as any).updateAt = Date.now();
    });
    this.records.hook('deleting', (_primaryKey) => {
      // do something
    });
  }
}
