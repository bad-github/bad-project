import {Image} from '@tiptap/extension-image';
import {Image as TipTapImage} from '@workspace/editor/components/tiptap-node/image-node/image-node-extension';

export function getImageAlignButtonExtension(type: 'official' | 'custom') {
  if (type === 'official')
    return [
      // 查看image-node-view运用了content内容的哪些标签
      TipTapImage,
    ];
  return [
    Image.extend({
      addOptions() {
        const parent: any = this.parent?.() || {};
        return {
          ...parent,
          HTMLAttributes: {
            class: 'g-align-image',
          },
        };
      },
      addAttributes() {
        const parent: any = this.parent?.() || {};
        return {
          ...parent,
          // extension中没有声明的attributes都需要手动处理
          style: {
            default: null,
            parseHTML: (element) => element.getAttribute('style'),
            renderHTML: (attributes) => {
              if (!attributes.style) return {};
              return {style: attributes.style};
            },
          },
          /**
           * 监听的属性有要求
           * 官方setImageAlign函数中：this.editor.chain().focus().updateAttributes(extensionName, { [attributeName]: align })
           * 其中extensionName=image, attributeName=data-align
           */
          'data-align': {
            default: null,
            parseHTML: (element) => element.getAttribute('data-align'),
            renderHTML: (attributes) => {
              if (!attributes['data-align']) return {};
              return {
                'data-align': attributes['data-align'],
              };
            },
          },
        };
      },
    }),
  ];
}
