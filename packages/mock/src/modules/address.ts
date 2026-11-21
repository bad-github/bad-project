import type {Faker, AddressOptions, CountRange, AddressNode} from '../common/types';
import {createMultiple} from '../common/create-multiple';
import {validateCountRange} from '../common/validation';

/**
 * 生成省、市、区三级随机树，仅用于树控件演示，不保证真实行政区划关系。
 * @param options 各级数量可传固定整数或 {min, max}；省市区默认分别为 2～4、2～5、0～10。
 * @example mock.address.getTree({provinceCount: 2, cityCount: 3, districtCount: {min: 0, max: 2}});
 */
export function createAddressModule(faker: Faker) {
  const getTree = (options: AddressOptions = {}): AddressNode[] => {
    const province = options.provinceCount ?? {min: 2, max: 4};
    const city = options.cityCount ?? {min: 2, max: 5};
    const district = options.districtCount ?? {min: 0, max: 10};
    for (const [name, spec] of [
      ['provinceCount', province],
      ['cityCount', city],
      ['districtCount', district],
    ] as const)
      validateCountRange(spec, name);
    const count = (spec: CountRange) => (typeof spec === 'number' ? spec : faker.number.int(spec));
    return createMultiple(count(province), () => ({
      name: faker.location.state(),
      id: faker.string.uuid(),
      children: createMultiple(count(city), () => ({
        name: faker.location.city(),
        id: faker.string.uuid(),
        children: createMultiple(count(district), () => ({name: faker.location.county(), id: faker.string.uuid()})),
      })),
    }));
  };
  return {getTree};
}
