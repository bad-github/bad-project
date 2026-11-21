// IPv4
const IPv4 = /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;

// IPv4 CIDR
const IPv4CIDR = /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\/(3[0-2]|[1-2]?\d))$/;

// 子网掩码 (简单版)
const SubnetMask =
  /^(?:(254|252|248|240|224|192|128|0)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(255|254|252|248|240|224|192|128|0))$/;

// MAC 地址支持冒号或连字符分隔，但不能混用。
const MACAddress = /^[0-9A-Fa-f]{2}([:-])(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}$/;
//  纯数字校验
const Numeric = /^\d+$/;

// 正整数校验
const PositiveInteger = /^[1-9]\d*$/;

// 手机号校验 (中国大陆)
const PhoneNumber = /^1[3-9]\d{9}$/;
const ruleA = /^\d*$/;
// 数字、字母、特殊字符
const ruleB = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
// /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#&])[A-Za-z\d!@#&]+$/ // 数字、字母、特殊字符!@#&

// 判断是否匹配的方法
function test(regex: RegExp, value: string): boolean {
  // 校验不依赖 /g、/y 的上次匹配位置，也不改变调用方的 lastIndex。
  const lastIndex = regex.lastIndex;
  try {
    regex.lastIndex = 0;
    return regex.test(value);
  } finally {
    regex.lastIndex = lastIndex;
  }
}

/** 常用校验表达式与无状态校验。 */
export const regex = {
  IPv4,
  IPv4CIDR,
  SubnetMask,
  MACAddress,
  Numeric,
  PositiveInteger,
  PhoneNumber,
  ruleA,
  ruleB,
  test,
} as const;
