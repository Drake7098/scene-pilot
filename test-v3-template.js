// 测试 V3 模板提示词生成
const { loadV3TemplatePayload } = require('./src/template-engine/data/v3/loader');
const { compileV3 } = require('./src/utils/compileV3');
const { parseCompiler, generatePrompts } = require('./src/utils/prompt');

async function testV3Template() {
  console.log('Testing V3 template prompt generation...');
  
  // 加载一个 V3 模板
  const payload = await loadV3TemplatePayload('v3_product_white_01');
  if (!payload) {
    console.error('Failed to load V3 template');
    return;
  }
  
  const scene = payload.project.scenes[0];
  console.log('Template scene:', scene);
  
  // 检查编译器版本
  const compiler = parseCompiler(scene);
  console.log('Compiler version:', compiler);
  
  // 测试 V3 编译
  const v3Result = compileV3({
    scene,
    lang: 'zh',
    mediaMode: scene.config.mediaMode,
    aspectRatio: scene.aspectRatio
  });
  console.log('V3 compiled prompt:', v3Result);
  
  // 测试完整提示词生成
  const fullPrompt = generatePrompts(payload.project, 'zh');
  console.log('Full generated prompt:', fullPrompt);
}

testV3Template().catch(console.error);
