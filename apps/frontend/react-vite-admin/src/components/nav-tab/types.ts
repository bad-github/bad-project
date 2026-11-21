// 不推荐使用枚举，用联合字面量类型+对象
export const Action = {
  Close: 'close',
  CloseLeft: 'closeLeft',
  CloseRight: 'closeRight',
  CloseOther: 'closeOther',
  CloseAll: 'closeAll',
  Pin: 'pin',
  PinOff: 'pinOff',
  Reload: 'reload',
} as const;

// (取出Action只读对象的类型)[取出Action的所有key组成联合类型] => 取出Action中所有key对应的值类型，即 'close' | 'closeLeft' | ...
export type TAction = (typeof Action)[keyof typeof Action];
