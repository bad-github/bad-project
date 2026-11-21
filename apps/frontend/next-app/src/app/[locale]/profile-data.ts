import {BookOpenText, Briefcase, Cake, GraduationCap, Mail, MapPin, User, type LucideIcon} from 'lucide-react';

type ProfileItemBase = {
  icon: LucideIcon;
};

// 使用 kind 区分渲染方式：普通文本没有链接，外链必须提供地址，邮箱使用 mailto。
export type ProfileItem = ProfileItemBase & (
  | {kind: 'text'; labelKey: 'name' | 'birthday' | 'location' | 'major' | 'job'}
  | {kind: 'external'; labelKey: 'school'; href: `https://${string}`; target: '_self' | '_blank'}
  | {kind: 'email'; labelKey: 'email'}
);

export const PROFILE_ITEMS = [
  {kind: 'text', labelKey: 'name', icon: User},
  {kind: 'text', labelKey: 'birthday', icon: Cake},
  {kind: 'text', labelKey: 'location', icon: MapPin},
  {kind: 'external', labelKey: 'school', icon: GraduationCap, href: 'https://www.cuit.edu.cn/', target: '_self'},
  {kind: 'text', labelKey: 'major', icon: BookOpenText},
  {kind: 'email', labelKey: 'email', icon: Mail},
  {kind: 'text', labelKey: 'job', icon: Briefcase},
] as const satisfies readonly ProfileItem[];
