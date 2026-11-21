import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';

export const MAX_CONTACTS = 5;
export type Contact = {contactId: number; name: string; email: string};
export type ContactValues = {contacts: Contact[]};

// 当前页面数据仅在内存中使用：模块内递增计数保证创建的联系人 ID 唯一，删除后不回收。
// contactId 随数据提交并在移动、交换、update 时保留，与 RHF 可能重新生成的 field.id 分离。
let contactSequence = 0;
export const createContact = (values?: Pick<Contact, 'name' | 'email'>): Contact => ({
  contactId: ++contactSequence,
  name: values?.name ?? '',
  email: values?.email ?? '',
});
// 按已有业务 ID 生成预设值，不创建联系人、不消耗新 ID；不同联系人的预设邮箱互不重复。
export const getContactExample = (contactId: number): Pick<Contact, 'name' | 'email'> => ({
  name: `联系人${contactId}`,
  email: `contact${contactId}@example.com`,
});
export const createDefaultValues = (): ContactValues => ({contacts: [createContact()]});
export const createExampleContacts = (): Contact[] => [
  createContact({name: '张三', email: 'zhang@example.com'}),
  createContact({name: '李四', email: 'li@example.com'}),
];

export const contactSchema = z.object({
  contacts: z
    .array(
      z.object({
        contactId: z.number().int().positive(),
        name: z.string().trim().min(1, '请填写姓名').max(30, '姓名最多 30 个字符'),
        email: z.string().trim().min(1, '请填写邮箱').email('请填写有效的邮箱'),
      })
    )
    .min(1, '至少保留一位联系人')
    .max(MAX_CONTACTS, `最多添加 ${MAX_CONTACTS} 位联系人`)
    .superRefine((contacts, context) => {
      // 所有冲突行都提示错误；比较邮箱时忽略大小写和首尾空格。
      const counts = new Map<string, number>();
      for (const contact of contacts) {
        const email = contact.email.trim().toLowerCase();
        if (email) counts.set(email, (counts.get(email) ?? 0) + 1);
      }
      contacts.forEach((contact, index) => {
        if ((counts.get(contact.email.trim().toLowerCase()) ?? 0) > 1) {
          context.addIssue({code: 'custom', path: [index, 'email'], message: '联系人邮箱不能重复'});
        }
      });
    }),
});

// 统一处理字段、跨行和数量规则，register 上不重复定义校验。
export const contactResolver = zodResolver(contactSchema);

/** 错误可能包含 DOM ref，仅提取路径和消息用于展示，避免 JSON 循环引用。 */
export function errorMessages(value: unknown, path = ''): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  if ('message' in value && typeof value.message === 'string') return {[path || 'form']: value.message};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !['ref', 'type', 'types'].includes(key))
      .flatMap(([key, child]) => Object.entries(errorMessages(child, path ? `${path}.${key}` : key)))
  );
}
