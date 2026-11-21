import {describe, expect, test} from 'vitest';
import {createFormControl} from 'react-hook-form';
import {
  contactResolver,
  contactSchema,
  createContact,
  createDefaultValues,
  createExampleContacts,
  getContactExample,
  errorMessages,
  type ContactValues,
} from './form-model';

describe('联系人动态表单', () => {
  test('空白新增与预设填充分开，填充保留业务 ID 且各行邮箱不重复', () => {
    const contacts = [createContact(), createContact()];
    expect(contacts.every((contact) => contact.name === '' && contact.email === '')).toBe(true);
    const filled = contacts.map((contact) => ({...contact, ...getContactExample(contact.contactId)}));
    expect(filled.map((contact) => contact.contactId)).toEqual(contacts.map((contact) => contact.contactId));
    expect(new Set(filled.map((contact) => contact.email)).size).toBe(2);
    expect(contactSchema.safeParse({contacts: filled}).success).toBe(true);
  });
  test('人数上下限和各字段规则阻止非法提交', () => {
    expect(contactSchema.safeParse({contacts: []}).success).toBe(false);
    expect(
      contactSchema.safeParse({
        contacts: Array.from({length: 6}, (_, index) => ({
          ...createExampleContacts()[0],
          email: `user${index}@example.com`,
        })),
      }).success
    ).toBe(false);
    const result = contactSchema.safeParse({contacts: [{...createContact(), name: ' ', email: 'invalid'}]});
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(['contacts.0.name', 'contacts.0.email']);
  });

  test('邮箱查重忽略大小写与空格，并标记每一位冲突联系人', async () => {
    const contacts = createExampleContacts();
    contacts[1].email = ` ${contacts[0].email.toUpperCase()} `;
    const form = createFormControl<ContactValues>({defaultValues: {contacts}, resolver: contactResolver});
    const unsubscribe = form.subscribe({formState: {errors: true}, callback: () => {}});
    for (const index of [0, 1]) for (const key of ['name', 'email'] as const) form.register(`contacts.${index}.${key}`);
    try {
      expect(await form.trigger('contacts')).toBe(false);
      expect(errorMessages(form.getErrors())).toEqual({
        'contacts.0.email': '联系人邮箱不能重复',
        'contacts.1.email': '联系人邮箱不能重复',
      });
      form.setValue('contacts.1.email', 'another@example.com');
      // 与页面失焦处理相同：校验数组，清掉两行关联错误，而不只清理当前邮箱。
      expect(await form.trigger('contacts')).toBe(true);
      expect(form.getErrors()).toEqual({});
    } finally {
      unsubscribe();
    }
  });

  test('真实 RHF 提交输出去除首尾空格，默认 reset 恢复初始基准', async () => {
    const defaultValues = createDefaultValues();
    const form = createFormControl<ContactValues>({defaultValues, resolver: contactResolver});
    const unsubscribe = form.subscribe({
      formState: {errors: true, dirtyFields: true, touchedFields: true},
      callback: () => {},
    });
    form.register('contacts.0.name');
    form.register('contacts.0.email');
    try {
      let saved: ContactValues | undefined;
      await form.handleSubmit((values) => {
        saved = values;
      })();
      expect(saved).toBeUndefined();
      const contact = createExampleContacts()[0];
      for (const key of ['name', 'email'] as const)
        form.setValue(`contacts.0.${key}`, ` ${contact[key]} `, {shouldDirty: true, shouldTouch: true});
      await form.handleSubmit((values) => {
        saved = values;
      })();
      expect(saved).toEqual({contacts: [{...contact, contactId: defaultValues.contacts[0].contactId}]});
      expect(form.getFieldState('contacts.0.name').isDirty).toBe(true);
      form.reset();
      expect(form.getValues()).toEqual(defaultValues);
      expect(form.getErrors()).toEqual({});
      expect(form.getFieldState('contacts.0.name').isDirty).toBe(false);
    } finally {
      unsubscribe();
    }
  });

  test('新增对象彼此独立，错误快照排除循环 DOM 引用', () => {
    const first = createContact();
    const second = createContact();
    expect(first.contactId).not.toBe(second.contactId);
    first.name = '修改';
    expect(second.name).toBe('');
    const ref: {self?: unknown} = {};
    ref.self = ref;
    expect(
      errorMessages({
        contacts: {root: {message: '至少保留一位联系人', ref}, 0: {email: {message: '联系人邮箱不能重复', ref}}},
      })
    ).toEqual({'contacts.0.email': '联系人邮箱不能重复', 'contacts.root': '至少保留一位联系人'});
  });

  test('默认联系人、批量联系人和重复载入的预设联系人均使用独立业务 ID', () => {
    const contacts = [
      ...createDefaultValues().contacts,
      createContact(),
      createContact(),
      ...createExampleContacts(),
      ...createExampleContacts(),
    ];
    expect(new Set(contacts.map((contact) => contact.contactId)).size).toBe(contacts.length);
    expect(contacts.every((contact) => Number.isSafeInteger(contact.contactId) && contact.contactId > 0)).toBe(true);
  });
});
