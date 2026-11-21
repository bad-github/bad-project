/** 数量允许为 0；拒绝隐式截断及 Array 无法表示的长度。 */
export function assertCount(value: number, name = 'count'): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError(`${name} 必须是 0～4294967295 范围内的整数`);
  }
}
export function assertPositive(value: number, name: string): void {
  assertCount(value, name);
  if (value === 0) throw new RangeError(`${name} 必须大于 0`);
}
/** 偏移不是数组长度，允许超过 Array 最大长度，但必须能精确计算。 */
export function assertOffset(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} 必须为非负安全整数`);
}
export function assertRange(start: number, limit: number): void {
  assertOffset(start, 'start');
  assertCount(limit, 'limit');
  if (!Number.isSafeInteger(start + limit)) throw new RangeError('读取范围超出安全整数');
}
export function assertPage({page = 1, pageSize = 20}: {page?: number; pageSize?: number} = {}): void {
  assertPositive(page, 'page');
  assertPositive(pageSize, 'pageSize');
  assertRange((page - 1) * pageSize, pageSize);
}
export function validateCountRange(value: number | {min: number; max: number}, name: string): void {
  if (typeof value === 'number') return assertCount(value, name);
  assertCount(value.min, `${name}.min`);
  assertCount(value.max, `${name}.max`);
  if (value.min > value.max) throw new RangeError(`${name}.min 不能大于 max`);
}
export function referenceDate(value: string | number | Date): Date {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new RangeError('refDate 必须是有效日期');
  return date;
}

/** 覆盖参数中的 undefined 表示未指定，避免覆盖掉已有字段的有效默认值。 */
export function definedFields<T extends object>(value?: T): Partial<T> {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, item]) => item !== undefined)) as Partial<T>;
}
