/** SDK 实例类型，保持为本地类型别名，不产生 Faker 运行时导出。 */
export type Faker = import('@faker-js/faker').Faker;
export type FakerConstructor = typeof import('@faker-js/faker').Faker;

/** 加载一个语言模板；模板只提供语言定义，不共享其随机状态。 */
export type FakerLoader = () => Promise<Faker>;
export type FakerLoaders = Record<string, FakerLoader>;
export interface FakerGenerationOptions {
  /** 相同 seed、refDate、语言、调用顺序及 Faker 版本可生成相同普通数据。 */
  seed?: number | number[];
  /** 固定所有相对日期的参考时间；未提供时取创建实例的时间。 */
  refDate?: string | number | Date;
}
export interface LoadFakerOptions extends FakerGenerationOptions {
  loaders: FakerLoaders;
  language?: string;
  /** 未注册语言的回退，默认 en；false 表示抛错。 */
  fallbackLanguage?: string | false;
}
export type CreateOptions = FakerGenerationOptions &
  ({faker: Faker; loaders?: never; language?: never; fallbackLanguage?: never} | (LoadFakerOptions & {faker?: never}));
export interface Notification {
  id: string;
  avatar: string;
  title: string;
  content: string;
  name: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
  read: boolean;
}
export type CountRange = number | {min: number; max: number};
export interface AddressOptions {
  provinceCount?: CountRange;
  cityCount?: CountRange;
  districtCount?: CountRange;
}
/** 随机地区树，仅用于演示层级关系，不保证是真实行政区划。 */
export interface AddressNode {
  id: string;
  name: string;
  children?: AddressNode[];
}
export interface UserAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}
export interface UserContact {
  phone: string;
  secondaryEmail: string;
}
export interface UserPreferences {
  newsletterSubscribed: boolean;
  favoriteColors: ('red' | 'blue' | 'green' | 'yellow' | 'purple')[];
  hobbies: ('reading' | 'gaming' | 'hiking' | 'cooking' | 'traveling' | 'coding')[];
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
}
export interface WorkExperience {
  company: string;
  title: string;
  startDate: Date;
  endDate: Date | null;
  description: string;
}
export interface SocialProfiles {
  twitter: string;
  linkedin: string;
  github: string;
}
export interface User {
  name: string;
  text: string;
  progress: number;
  status: 'relationship' | 'complicated' | 'single';
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  avatar: string;
  password: string;
  birthdate: Date;
  age: number;
  gender: 'male' | 'female' | 'other';
  address: UserAddress;
  contact: UserContact;
  preferences: UserPreferences;
  registeredAt: Date;
  workExperience: WorkExperience[];
  socialProfiles: SocialProfiles;
}
/** 嵌套资料按字段覆盖；数组整体替换。生日和年龄同时提供时必须相符。 */
export type UserOverrides = Omit<Partial<User>, 'address' | 'contact' | 'preferences' | 'socialProfiles'> & {
  address?: Partial<UserAddress>;
  contact?: Partial<UserContact>;
  preferences?: Partial<UserPreferences>;
  socialProfiles?: Partial<SocialProfiles>;
};
/** 单条生成规则；默认参数和字段合并规则由业务自己决定。 */
export type EntityFactory<T, Input extends object> = (faker: Faker, input?: Input) => T;
export interface EntityDefinition<T, Input extends object> {
  readonly generate: EntityFactory<T, Input>;
  readonly bind: (faker: Faker) => Entity<T, Input>;
}
export interface Entity<T, Input extends object> {
  readonly generate: (input?: Input) => T;
  readonly getAll: (count?: number, query?: DatasetQuery<T>) => T[];
  readonly getPage: (options?: EntityPageOptions<T>) => DatasetPage<T>;
  readonly getRange: (start: number, limit: number, query?: EntityQuery<T>) => DatasetRange<T>;
}
export interface SortItem {
  id: string;
  name: string;
  type: string;
}
export interface UserNode extends User {
  subRows?: UserNode[];
}
export interface UserEntity extends Entity<User, UserOverrides> {
  readonly getTree: (...counts: number[]) => UserNode[];
}
export interface SortItemEntity extends Entity<SortItem, Partial<SortItem>> {
  readonly getByType: (type: string, count?: number) => SortItem[];
}
export interface DatasetQuery<T> {
  /** 对快照副本筛选，不会改变内部数据。 */
  filter?: (row: Readonly<T>) => boolean;
  /** 比较函数，与 Array.sort 的约定相同。 */
  compare?: (a: Readonly<T>, b: Readonly<T>) => number;
}
export interface DatasetPageOptions<T> extends DatasetQuery<T> {
  page?: number;
  pageSize?: number;
}
export interface EntityQuery<T> extends DatasetQuery<T> {
  /** 数据集原始条数，默认 300；相同条数复用同一场景内的快照。 */
  count?: number;
}
export interface EntityPageOptions<T> extends DatasetPageOptions<T> {
  count?: number;
}
export interface DatasetRange<T> {
  data: T[];
  total: number;
  start: number;
  limit: number;
  hasMore: boolean;
}
export interface DatasetPage<T> extends DatasetRange<T> {
  page: number;
  pageSize: number;
  totalPages: number;
}
export interface Dataset<T> {
  readonly size: number;
  /** 返回筛选、排序后的全部记录副本，不分页；排序相等时保留原顺序。 */
  readonly getAll: (query?: DatasetQuery<T>) => T[];
  /** 按 0 开始的偏移读取，可筛选、排序；总数是筛选后的数量。 */
  readonly getRange: (start: number, limit: number, query?: DatasetQuery<T>) => DatasetRange<T>;
  /** 按 1 开始的页码读取，默认每页 20 条。 */
  readonly getPage: (options?: DatasetPageOptions<T>) => DatasetPage<T>;
}
