import {getMock} from '@/mock';
import {dbProvider} from '@/indexed-db/db-provider';
import {Button} from '@badnpm/ui';
import {useEffect} from 'react';

export default function IndexedDbPage() {
  const dbInstance = dbProvider.createDB('one');

  useEffect(() => {
    // provider 缓存共享连接，进入页面时确保连接可用；退出时不关闭或清空它。
    void dbInstance
      .getDexieInstance()
      .open()
      .catch((error) => {
        console.error('数据库初始化失败', error);
      });
  }, [dbInstance]);

  const create = async () => {
    try {
      await dbInstance.getDexieInstance().open();
    } catch (error) {
      console.error('数据库打开失败', error);
    }
  };

  const add = async () => {
    try {
      const {faker} = await getMock();
      await dbInstance.batchAdd([
        {name: faker.person.fullName(), age: faker.number.int({min: 1, max: 30})},
        {name: faker.person.fullName(), age: faker.number.int({min: 1, max: 30})},
      ]);
    } catch (error) {
      console.error('新增失败', error);
    }
  };

  const update = async () => {
    try {
      const row = await dbInstance.getByIndex(1);
      if (!row?.dbId) return;
      const {faker} = await getMock();
      await dbInstance.updateById(row.dbId, {name: faker.person.fullName(), updateAt: Date.now()});
    } catch (error) {
      console.error('更新失败', error);
    }
  };

  const clear = async () => {
    try {
      await dbInstance.clearAll();
    } catch (error) {
      console.error('清空失败', error);
    }
  };

  return (
    <div>
      <Button onClick={create}>create database</Button>
      <Button onClick={add}>add</Button>
      <Button onClick={update}>update</Button>
      <Button onClick={clear}>clear</Button>
    </div>
  );
}
