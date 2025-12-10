import { DataSource } from 'typeorm';
import { ToolsEntity } from '../src/database/entities/tools/tools.entity';

async function queryTools() {
  // 创建数据源（使用项目的配置）
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'monkeys',
    entities: [ToolsEntity],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功\n');

    const toolsRepository = dataSource.getRepository(ToolsEntity);

    // 查询第三方API工具
    const tools = await toolsRepository.find({
      where: {
        namespace: 'third_party_api',
      },
      select: ['namespace', 'name', 'displayName', 'description', 'categories', 'input', 'output'],
    });

    console.log(`\n📊 找到 ${tools.length} 个第三方API工具\n`);
    console.log('='.repeat(80));

    // 按类别分组
    const genImageTools = tools.filter(t => t.categories?.includes('gen-image'));
    const genVideoTools = tools.filter(t => t.categories?.includes('gen-video'));
    const aiAnalysisTools = tools.filter(t => t.categories?.includes('ai-analysis'));

    // 输出图像生成工具
    console.log('\n📷 图像生成工具 (gen-image):');
    console.log('-'.repeat(80));
    genImageTools.forEach(tool => {
      console.log(`\n✅ ${tool.namespace}:${tool.name}`);
      console.log(`   名称: ${JSON.stringify(tool.displayName)}`);
      console.log(`   描述: ${JSON.stringify(tool.description)}`);
      console.log(`   分类: ${tool.categories?.join(', ')}`);

      // 输入参数
      console.log('   输入参数:');
      tool.input?.forEach(param => {
        console.log(`     - ${param.name} (${param.type}) ${param.required ? '[必填]' : '[可选]'}`);
        if (param.type === 'json' && param.default) {
          console.log(`       默认值结构: ${JSON.stringify(param.default, null, 10).substring(0, 200)}...`);
        }
      });

      // 输出参数
      console.log('   输出参数:');
      tool.output?.forEach(param => {
        console.log(`     - ${param.name} (${param.type})`);
      });
    });

    // 输出视频生成工具
    if (genVideoTools.length > 0) {
      console.log('\n\n🎬 视频生成工具 (gen-video):');
      console.log('-'.repeat(80));
      genVideoTools.forEach(tool => {
        console.log(`\n✅ ${tool.namespace}:${tool.name}`);
        console.log(`   名称: ${JSON.stringify(tool.displayName)}`);
      });
    }

    // 保存到JSON文件
    const fs = require('fs');
    const outputPath = '/Users/honker233/ZaoWuYun/monkeys/scripts/tools-snapshot.json';

    const toolsData = {
      timestamp: new Date().toISOString(),
      totalCount: tools.length,
      categories: {
        'gen-image': genImageTools.length,
        'gen-video': genVideoTools.length,
        'ai-analysis': aiAnalysisTools.length,
      },
      tools: tools.map(t => ({
        fullName: `${t.namespace}:${t.name}`,
        displayName: t.displayName,
        description: t.description,
        categories: t.categories,
        input: t.input,
        output: t.output,
      })),
    };

    fs.writeFileSync(outputPath, JSON.stringify(toolsData, null, 2));
    console.log(`\n\n💾 工具数据已保存到: ${outputPath}`);

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await dataSource.destroy();
  }
}

queryTools();
