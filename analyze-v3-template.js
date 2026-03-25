// 分析 V3 模板结构与标准 TemplatePayload 的区别
import { loadV3TemplatePayload } from './src/template-engine/data/v3/loader';
import { loadTemplatePayloadById } from './src/template-engine/payload/templateLoader';

async function analyzeV3Template() {
  console.log('=== 分析 V3 模板结构 ===');
  
  // 加载 V3 模板
  const v3Payload = await loadV3TemplatePayload('v3_product_white_01');
  console.log('V3 模板结构:', JSON.stringify(v3Payload, null, 2));
  
  // 加载一个标准模板作为对比
  console.log('\n=== 分析标准模板结构 ===');
  const standardPayload = await loadTemplatePayloadById('curated_01');
  console.log('标准模板结构:', JSON.stringify(standardPayload, null, 2));
  
  // 对比结构差异
  console.log('\n=== 结构对比 ===');
  console.log('V3 模板键:', Object.keys(v3Payload));
  if (standardPayload) {
    console.log('标准模板键:', Object.keys(standardPayload));
  }
}

analyzeV3Template().catch(console.error);
