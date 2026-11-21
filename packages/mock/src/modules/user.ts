import type {Faker, User, UserOverrides, UserNode, UserEntity} from '../common/types';
import {createCollection} from '../common/collection';
import {createMultiple} from '../common/create-multiple';
import {referenceDate, definedFields, assertCount} from '../common/validation';

function assertAge(age?: number): void {
  if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 120)) {
    throw new RangeError('age 必须为 0～120 范围内的整数');
  }
}

/** 按 UTC 日历计算周岁，避免生成环境的时区影响生日与年龄的一致性。 */
function ageAt(birthdate: Date, refDate: Date): number {
  const beforeBirthday =
    refDate.getUTCMonth() < birthdate.getUTCMonth() ||
    (refDate.getUTCMonth() === birthdate.getUTCMonth() && refDate.getUTCDate() < birthdate.getUTCDate());
  return refDate.getUTCFullYear() - birthdate.getUTCFullYear() - Number(beforeBirthday);
}

export function createUserModule(faker: Faker): UserEntity {
  const generate = (input: UserOverrides = {}): User => {
    // 用户记录包含 Date 和数组，复制覆盖值后，各记录不会共享调用方的可变字段。
    const overrides = structuredClone(definedFields(input));
    const refDate = referenceDate(faker.defaultRefDate());
    assertAge(overrides.age);
    const birthdate =
      overrides.birthdate === undefined
        ? faker.date.birthdate({min: overrides.age ?? 18, max: overrides.age ?? 60, mode: 'age', refDate})
        : referenceDate(overrides.birthdate);
    if (birthdate > refDate) throw new RangeError('birthdate 不能晚于 refDate');
    const age = ageAt(birthdate, refDate);
    if (overrides.age !== undefined && age !== overrides.age) throw new RangeError('age 与 birthdate 不一致');
    const firstName = overrides.firstName ?? faker.person.firstName();
    const lastName = overrides.lastName ?? faker.person.lastName();
    const adultDate = new Date(birthdate);
    adultDate.setUTCFullYear(adultDate.getUTCFullYear() + 18);
    const earliestJob = new Date(Math.max(adultDate.getTime(), refDate.getTime() - 10 * 365.25 * 86400000));
    const base: User = {
      id: faker.number.int({min: 1}),
      firstName,
      lastName,
      displayName: faker.person.fullName({firstName, lastName}),
      name: faker.person.fullName({firstName, lastName}),
      text: faker.lorem.sentences(faker.number.int({min: 1, max: 4})),
      progress: faker.number.int({min: 0, max: 100}),
      status: faker.helpers.arrayElement(['relationship', 'complicated', 'single']),
      username: faker.internet.username({firstName, lastName}),
      email: faker.internet.email({firstName, lastName}),
      avatar: faker.image.avatar(),
      password: faker.internet.password(),
      birthdate,
      age,
      gender: faker.helpers.arrayElement(['male', 'female', 'other']),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        postalCode: faker.location.zipCode(),
      },
      contact: {phone: faker.phone.number(), secondaryEmail: faker.internet.email()},
      preferences: {
        newsletterSubscribed: faker.datatype.boolean(),
        favoriteColors: faker.helpers.arrayElements(
          ['red', 'blue', 'green', 'yellow', 'purple'],
          faker.number.int({min: 1, max: 3})
        ),
        hobbies: faker.helpers.arrayElements(
          ['reading', 'gaming', 'hiking', 'cooking', 'traveling', 'coding'],
          faker.number.int({min: 1, max: 4})
        ),
        maritalStatus: faker.helpers.arrayElement(['single', 'married', 'divorced', 'widowed']),
      },
      registeredAt: faker.date.between({
        from: new Date(Math.max(birthdate.getTime(), refDate.getTime() - 365 * 86400000)),
        to: refDate,
      }),
      workExperience:
        earliestJob > refDate
          ? []
          : createMultiple(faker.number.int({min: 1, max: 5}), () => {
              const startDate = faker.date.between({from: earliestJob, to: refDate});
              return {
                company: faker.company.name(),
                title: faker.person.jobTitle(),
                startDate,
                endDate: faker.datatype.boolean() ? faker.date.between({from: startDate, to: refDate}) : null,
                description: faker.lorem.sentence(),
              };
            }),
      socialProfiles: {
        twitter: faker.internet.username(),
        linkedin: faker.internet.username(),
        github: faker.internet.username(),
      },
    };
    return {
      ...base,
      ...overrides,
      birthdate,
      age,
      address: {...base.address, ...definedFields(overrides.address)},
      contact: {...base.contact, ...definedFields(overrides.contact)},
      preferences: {...base.preferences, ...definedFields(overrides.preferences)},
      socialProfiles: {...base.socialProfiles, ...definedFields(overrides.socialProfiles)},
    };
  };
  /** 树使用用户，ID 在本次树生成中唯一，数量在生成前统一校验。 */
  const getTree = (...counts: number[]): UserNode[] => {
    counts.forEach((count, index) => assertCount(count, `counts[${index}]`));
    let id = 0;
    const level = (depth: number): UserNode[] =>
      createMultiple(counts[depth] ?? 0, () => generate({id: ++id, text: ''})).map((row) => ({
        ...row,
        subRows: counts[depth + 1] ? level(depth + 1) : undefined,
      }));
    return level(0);
  };

  return {generate, ...createCollection((index) => generate({id: index + 1})), getTree};
}
