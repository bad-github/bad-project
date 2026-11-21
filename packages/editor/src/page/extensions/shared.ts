import {Color, TextStyle} from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';

// 这里只统一多个案例共用的扩展配置，不负责注册。
// 每个案例仍需在自己的 Extension 数组中声明依赖；删除其他案例不会影响它。
export {Color, TextStyle};

// 颜色按钮、弹出框、选择器、拖拽菜单和表格都需要多色高亮。
// 共用同一份定义，避免某个案例意外使用默认的单色配置。
export const SharedHighlight = Highlight.configure({multicolor: true});
