# OSS Insight 24小时榜单抓取工具

## 功能描述
- 抓取 OSS Insight 24小时热门项目榜单
- 与前一天榜单对比，只显示新增项目
- 生成 MD 格式的差异报告
- 每天凌晨自动运行（GitHub Actions）

## 技术栈
- Node.js
- axios（API 请求）
- fs/path（文件操作）
- GitHub Actions（定时任务）

## 运行方式
1. 安装依赖：`npm install`
2. 手动运行：`npm start`
3. 自动运行：GitHub Actions 每天凌晨自动执行

## 查看结果
- **GitHub Actions 日志**：直接在 Actions 页面查看抓取结果
- **GitHub Pages**：通过 `https://irpywp.github.io/ossinsight` 查看报告
- **Artifacts**：下载生成的数据文件

## 项目结构
- `index.js`：核心抓取和对比逻辑
- `package.json`：项目配置和依赖
- `.github/workflows/scrape.yml`：GitHub Actions 配置
- `data/`：存储抓取的数据和报告

## 注意事项
- 首次运行时，会将当天的所有项目标记为新增
- 后续运行会与前一天的榜单进行对比
- 生成的报告只包含新增项目，不包含删除项目
