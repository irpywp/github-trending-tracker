const axios = require('axios');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const todayFile = path.join(dataDir, `trending_${new Date().toISOString().split('T')[0]}.json`);
const yesterdayFile = path.join(dataDir, `trending_${new Date(Date.now() - 86400000).toISOString().split('T')[0]}.json`);

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  // 创建 .gitkeep 文件（如果不存在）
  const gitkeepFile = path.join(dataDir, '.gitkeep');
  if (!fs.existsSync(gitkeepFile)) {
    fs.writeFileSync(gitkeepFile, '');
  }
}

async function scrapeTrending() {
  try {
    const url = 'https://api.ossinsight.io/v1/trends/repos';
    const response = await axios.get(url);
    
    const projects = response.data.data.rows.map(row => ({
      repo_id: row.repo_id,
      repo_name: row.repo_name,
      language: row.primary_language,
      description: row.description,
      stars: row.stars,
      forks: row.forks,
      pull_requests: row.pull_requests,
      pushes: row.pushes,
      total_score: row.total_score,
      contributor_logins: row.contributor_logins
    }));
    
    fs.writeFileSync(todayFile, JSON.stringify(projects, null, 2));
    console.log(`已保存今天的榜单到 ${todayFile}`);
    
    return projects;
  } catch (error) {
    console.error('抓取榜单失败:', error.message);
    return [];
  }
}

function compareWithYesterday(todayProjects) {
  if (!fs.existsSync(yesterdayFile)) {
    console.log('没有找到昨天的榜单数据，这是首次运行');
    return { new: todayProjects, removed: [] };
  }
  
  const yesterdayProjects = JSON.parse(fs.readFileSync(yesterdayFile, 'utf8'));
  const yesterdayRepoNames = new Set(yesterdayProjects.map(p => p.repo_name));
  const todayRepoNames = new Set(todayProjects.map(p => p.repo_name));
  
  const newProjects = todayProjects.filter(p => !yesterdayRepoNames.has(p.repo_name));
  const removedProjects = yesterdayProjects.filter(p => !todayRepoNames.has(p.repo_name));
  
  console.log('\n===== 对比结果 =====');
  
  if (newProjects.length > 0) {
    console.log(`\n🆕 新增项目 (${newProjects.length}个):`);
    newProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.repo_name}`);
      console.log(`   描述: ${project.description}`);
      console.log(`   语言: ${project.language}`);
      console.log(`   星标: ${project.stars} | Fork: ${project.forks}`);
      console.log('');
    });
  } else {
    console.log('\n没有新增项目');
  }
  
  return { new: newProjects, removed: removedProjects };
}

async function main() {
  console.log('开始抓取 OSS Insight 24小时榜单...\n');
  const todayProjects = await scrapeTrending();
  
  if (todayProjects.length > 0) {
    console.log(`成功抓取到 ${todayProjects.length} 个项目\n`);
    const result = compareWithYesterday(todayProjects);
    
    const diffFile = path.join(dataDir, `diff_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(diffFile, JSON.stringify(result, null, 2));
    
    // 生成 MD 格式的差异报告
    const mdFile = path.join(dataDir, `diff_${new Date().toISOString().split('T')[0]}.md`);
    let mdContent = `# OSS Insight 24小时榜单差异报告

**日期**: ${new Date().toISOString().split('T')[0]}
**抓取时间**: ${new Date().toLocaleString()}

## 对比结果

`;
    
    if (result.new.length > 0) {
      mdContent += `### 🆕 新增项目 (${result.new.length}个)

`;
      result.new.forEach((project, index) => {
        mdContent += `${index + 1}. **${project.repo_name}**
`;
        mdContent += `   - 描述: ${project.description}
`;
        mdContent += `   - 语言: ${project.language}
`;
        mdContent += `   - 星标: ${project.stars} | Fork: ${project.forks}
`;
        mdContent += `   - 总分: ${project.total_score}

`;
      });
    } else {
      mdContent += `### 🆕 新增项目

没有新增项目

`;
    }
    
    fs.writeFileSync(mdFile, mdContent);
    console.log(`\n差异结果已保存到 ${diffFile}`);
    console.log(`差异报告已保存到 ${mdFile}`);
    
    // 提交生成的文件到版本控制
    try {
      const { execSync } = require('child_process');
      execSync('git add data/diff_*.md data/trending_*.json', { stdio: 'inherit' });
      execSync('git commit -m "更新差异报告和榜单数据"', { stdio: 'inherit' });
      execSync('git push origin master', { stdio: 'inherit' });
      console.log('\n生成的文件已提交到版本控制');
    } catch (error) {
      console.error('提交文件失败:', error.message);
    }
  } else {
    console.log('没有抓取到项目数据');
  }
}

main();
