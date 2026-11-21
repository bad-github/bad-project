import type {TimeUnit, RelativeDate, NanosecondFormatOptions, NanosecondInput, DateInput} from './types';
import {differenceInMinutes, differenceInHours, differenceInDays} from 'date-fns';

/** 过去时间返回相对值；未来时间返回完整日期；无效输入返回 invalid。 */
function formatRelativeDate(date: DateInput): RelativeDate {
  const now = new Date();
  const d = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(d.getTime())) return {unit: 'invalid', value: ''};
  if (d.getTime() > now.getTime()) return {unit: 'date', value: d};
  const diffMinutes = differenceInMinutes(now, d);
  if (diffMinutes < 60) {
    return {unit: 'minutes', value: diffMinutes};
  }

  const diffHours = differenceInHours(now, d);
  if (diffHours < 24) {
    return {unit: 'hours', value: diffHours};
  }

  const diffDays = differenceInDays(now, d);
  if (diffDays <= 5) {
    return {unit: 'days', value: diffDays};
  }
  // 超过5天，显示完整日期
  return {unit: 'date', value: d};
}

// 使用构造函数而非 bigint 字面量，兼容以 ES2017 为编译目标的源码使用方。
const ZERO = BigInt(0);
const ONE = BigInt(1);
const NS_PER_SECOND = BigInt(1_000_000_000);
const SECONDS_PER_MINUTE = BigInt(60);
const SECONDS_PER_HOUR = BigInt(3600);
const SECONDS_PER_DAY = BigInt(86400);

function roundNanoseconds(ns: NanosecondInput, fractionDigits: number): bigint {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 100) {
    throw new RangeError('fractionDigits must be an integer between 0 and 100');
  }
  // 不安全的 number 已丢失精度，调用方应传 string 或 bigint。
  if (typeof ns === 'number' && !Number.isSafeInteger(ns)) {
    throw new RangeError('Nanoseconds must be a safe integer; use string or bigint for larger values');
  }
  const value = BigInt(ns);
  const sign = value < ZERO ? -ONE : ONE;
  const absolute = value * sign;
  const step = BigInt(10) ** BigInt(9 - Math.min(9, fractionDigits));
  // 先舍入完整时长或时间戳，再拆分单位，保证跨秒、分钟和日期时正确进位。
  return ((absolute + step / BigInt(2)) / step) * step * sign;
}

function formatSeconds(ns: bigint, fractionDigits: number, padded = false): string {
  const seconds = (ns / NS_PER_SECOND).toString();
  const integer = padded ? seconds.padStart(2, '0') : seconds;
  if (fractionDigits === 0) return integer;
  const fraction = (ns % NS_PER_SECOND).toString().padStart(9, '0');
  return `${integer}.${fraction.slice(0, fractionDigits).padEnd(fractionDigits, '0')}`;
}

/** 格式化纳秒时长；使用 BigInt 保持精度，支持负时长和跨单位进位。 */
function formatNsFromDuration(
  ns: NanosecondInput,
  {fractionDigits = 9, unit = 'h'}: NanosecondFormatOptions = {}
): string {
  const rounded = roundNanoseconds(ns, fractionDigits);
  const sign = rounded < ZERO ? '-' : '';
  const absolute = rounded < ZERO ? -rounded : rounded;
  if (unit === 's') return sign + formatSeconds(absolute, fractionDigits);

  const seconds = absolute / NS_PER_SECOND;
  const tail = formatSeconds(
    absolute % (SECONDS_PER_MINUTE * NS_PER_SECOND),
    fractionDigits,
    seconds >= SECONDS_PER_MINUTE
  );
  const minutes = seconds / SECONDS_PER_MINUTE;
  const hours = seconds / SECONDS_PER_HOUR;
  const pad = (value: bigint) => value.toString().padStart(2, '0');
  const minuteText = minutes === ZERO ? tail : `${minutes}:${tail}`;
  const hourText = hours === ZERO ? minuteText : `${hours}:${pad(minutes % SECONDS_PER_MINUTE)}:${tail}`;

  switch (unit) {
    case 'min':
      return sign + minuteText;
    case 'h':
      return sign + hourText;
    case 'd': {
      const days = seconds / SECONDS_PER_DAY;
      return (
        sign +
        (days === ZERO ? hourText : `${days}d ${pad(hours % BigInt(24))}:${pad(minutes % SECONDS_PER_MINUTE)}:${tail}`)
      );
    }
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

/**
 * 格式化纳秒时间戳：s 为 Unix 秒，min 为 mm:ss，h 为 HH:mm:ss，d 包含日期。
 * 日期和时钟使用运行环境本地时区；string/bigint 可保留完整纳秒精度。
 */
function formatNsFromTimestamp(
  ns: NanosecondInput,
  {fractionDigits = 9, unit = 'h'}: NanosecondFormatOptions = {}
): string {
  const rounded = roundNanoseconds(ns, fractionDigits);
  if (unit === 's') {
    return (rounded < ZERO ? '-' : '') + formatSeconds(rounded < ZERO ? -rounded : rounded, fractionDigits);
  }

  // 对负时间戳使用向下取整的秒数，以及非负的小数余数。
  const remainder = ((rounded % NS_PER_SECOND) + NS_PER_SECOND) % NS_PER_SECOND;
  const seconds = (rounded - remainder) / NS_PER_SECOND;
  const date = new Date(Number(seconds * BigInt(1000)));
  if (!Number.isFinite(date.getTime())) throw new RangeError('Timestamp is outside the supported Date range');

  const pad = (value: number) => value.toString().padStart(2, '0');
  const secondText = formatSeconds(BigInt(date.getSeconds()) * NS_PER_SECOND + remainder, fractionDigits, true);
  const minuteText = `${pad(date.getMinutes())}:${secondText}`;
  const time = `${pad(date.getHours())}:${minuteText}`;
  switch (unit) {
    case 'min':
      return minuteText;
    case 'h':
      return time;
    case 'd': {
      const year = date.getFullYear();
      const yearText = (year < 0 ? '-' : '') + Math.abs(year).toString().padStart(4, '0');
      return `${yearText}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${time}`;
    }
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

/** 延迟后按 rate 概率返回 data，否则以同一份 data 拒绝。 */
function sleep<T>(data: T, time = 1000, rate = 0.99): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < rate) {
        resolve(data);
      } else {
        reject(data);
      }
    }, time);
  });
}

// 将时间单位转换为毫秒
function toMilliseconds(value: number, unit: TimeUnit): number {
  const unitMap: Record<TimeUnit, number> = {
    ms: 1,
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
  };
  return value * unitMap[unit];
}

/** 时间转换、日期格式化与延迟任务。 */
export const time = {sleep, toMilliseconds, formatRelativeDate, formatNsFromDuration, formatNsFromTimestamp};
