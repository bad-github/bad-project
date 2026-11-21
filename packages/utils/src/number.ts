function formatLargeNumber(value: any) {
  const bigValue = BigInt(value);
  const tenThousand = BigInt(10000);
  const oneHundredMillion = BigInt(100000000);
  const oneTrillion = BigInt(1000000000000);
  if (bigValue < tenThousand) {
    // 小于1万直接展示数字
    return bigValue.toString();
  } else if (bigValue < oneHundredMillion) {
    // 1万到1亿之间，显示万
    return (bigValue / tenThousand).toString() + '万';
  } else if (bigValue < oneTrillion) {
    // 1亿到1万亿之间，显示亿
    return (bigValue / oneHundredMillion).toString() + '亿';
  } else {
    // 1万亿及以上，显示兆
    return (bigValue / oneTrillion).toString() + '兆';
  }
}

function formatUnitNumber(value: any) {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  // 保持从大到小排序
  const units = [
    {label: '千兆', value: 1e15}, // 1千兆 = 1e15
    {label: '百兆', value: 1e14}, // 1百兆 = 1e14
    {label: '十兆', value: 1e13}, // 1十兆 = 1e13
    {label: '兆', value: 1e12}, // 1兆 = 1e12
    {label: '千亿', value: 1e11},
    {label: '百亿', value: 1e10},
    {label: '十亿', value: 1e9},
    {label: '亿', value: 1e8},
    {label: '千万', value: 1e7},
    {label: '百万', value: 1e6},
    {label: '万', value: 1e4},
  ];
  for (const unit of units) {
    if (value >= unit.value) {
      return Math.floor(value / unit.value) + unit.label;
    }
  }
  return value.toString();
}

/**
 * 生成 [1, max] 的随机整数
 */
function getRandomInt(max: number) {
  return Math.floor(Math.random() * max) + 1;
}

// 判断是数字或数字字符串
function isNumeric(value: unknown): value is number | string {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  return Number.isFinite(Number(value));
}

/** 数值判断、格式化与随机数。 */
export const number = {formatLargeNumber, formatUnitNumber, getRandomInt, isNumeric};
