// 根目录保留配置入口，命令行和编辑器可从待格式化文件的位置向上自动找到它。
// 格式规则统一维护在 tooling；使用相对路径转发，无需安装新的工作区配置包。
// .prettierignore 保留在根目录：它描述当前仓库的忽略路径，不是可复用的格式规则。
// Prettier CLI 默认从执行目录读取忽略清单，不会随配置导入自动读取 tooling 下的清单。
// 移动它需要额外指定 --ignore-path，并同步编辑器的忽略文件路径设置；
// 其中 /dist 等规则还以忽略文件所在目录为基准，直接移动会改变匹配范围。
export {default} from './tooling/prettier-config/index.js';
