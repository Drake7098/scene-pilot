import fs from 'node:fs';
import path from 'node:path';
import { defaultProject } from '../../src/model.ts';
import { buildPromptForScene } from '../../src/utils/promptEngine.ts';

const root = process.cwd();
const benchDir = path.join(root, 'templates-benchmark');
const outReport = path.join(root, 'artifacts', 'benchmark-test', 'visual-samples-report.json');

const samples = [
  {
    id: 'visual_people_action_01',
    type: '人物动作',
    realPrompt: `A lone sprinter explodes out of the starting blocks on a rain-dark track at night, shoulders low and jaw locked, with breath visible in the cold air. The camera tracks from a low three-quarter angle for two beats, then settles into a tight side profile as droplets peel off the athlete's skin under stadium backlight. Keep the body line sharp, the lane markings streaking backward, and the emotional tone focused and relentless, like a championship final frozen at peak intent.`,
    structure: {
      camera: 'low 3/4 tracking to tight side profile, 70mm, fast shutter feel',
      space: 'wet running track at night, long lane depth, background crowd blur',
      layer: 'foreground rain particles, middle athlete, background stadium lights',
      lighting: 'hard back rim + cool ambient + subtle warm side bounce',
      subject: 'elite sprinter launching from blocks',
      semantic: 'peak commitment at decisive race moment',
      material: 'wet skin sheen, breathable race fabric, textured track rubber',
      detail: 'calf tension, shoe spike bite, water spray from heel strike',
      mood: 'intense, disciplined, no hesitation',
      composition: 'diagonal motion line, subject on right-third during acceleration',
      style: 'sports cinematic realism'
    }
  },
  {
    id: 'visual_product_ad_01',
    type: '产品广告',
    realPrompt: `A premium serum bottle stands on polished black stone as a thin veil of condensation catches a controlled studio key. Start with a calm centered composition, then introduce a subtle downward glide that reveals the embossed logo and the meniscus line through frosted glass. The frame should feel expensive and clinical at once: clean negative space, disciplined highlights, no visual clutter, and a finish suitable for a global beauty campaign hero shot.`,
    structure: {
      camera: '85mm macro close-up, subtle top-down glide, stable center lock',
      space: 'minimal studio with controlled reflective base and soft gradient backdrop',
      layer: 'foreground micro droplets, middle bottle, background soft glow band',
      lighting: 'large soft overhead key, side strip accent, controlled rear kicker',
      subject: 'premium serum bottle hero product',
      semantic: 'clinical trust plus luxury desirability',
      material: 'frosted glass body, glossy cap, polished black stone base',
      detail: 'embossed logo edge, condensation distribution, liquid meniscus clarity',
      mood: 'clean, precise, premium confidence',
      composition: 'center symmetry with disciplined negative space',
      style: 'high-end beauty commercial'
    }
  },
  {
    id: 'visual_space_scene_01',
    type: '空间场景',
    realPrompt: `Inside a narrow old apartment corridor, two people face each other in silence before one finally speaks. Hold a tense over-shoulder frame with deep perspective toward a half-open door, then cut to a restrained reverse angle that keeps the axis intact and the emotional distance readable. Let practical tungsten from the ceiling fight with cool spill from the doorway, preserving texture in the peeling walls and worn wood. The scene should feel intimate, claustrophobic, and narratively loaded, as if the next sentence will change everything.`,
    structure: {
      camera: '35mm over-shoulder then restrained reverse angle, axis-safe framing',
      space: 'narrow corridor with doorway vanishing point and compressed depth',
      layer: 'foreground shoulder silhouette, middle dialogue pair, rear doorway spill',
      lighting: 'practical tungsten top light mixed with cool door spill',
      subject: 'two characters in pre-conflict negotiation',
      semantic: 'suppressed confrontation before emotional turn',
      material: 'peeling wall paint, worn wood trim, matte floor reflections',
      detail: 'micro-expression flicker, finger twitch, fabric friction on sleeve',
      mood: 'claustrophobic, tense, emotionally loaded',
      composition: 'two-shot tension axis with controlled headroom and doorway depth',
      style: 'narrative neo-noir realism'
    }
  }
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toScene(sample) {
  const p = defaultProject();
  const s = p.scenes[0];
  const st = sample.structure;
  const [shot, ...moveParts] = st.camera.split(',');
  s.name = sample.id;
  s.camera.shot = shot.trim();
  s.camera.movement = moveParts.join(',').trim() || 'controlled move';
  s.lighting.mood = st.mood;
  s.layers[0].type = st.subject;
  s.layers[0].look = `${st.material}; ${st.detail}`;
  s.notes = [
    `semantic: ${st.semantic}`,
    `space: ${st.space}`,
    `composition: ${st.composition}`,
    `style: ${st.style}`
  ].join('\n');
  return { project: p, scene: s };
}

function run() {
  ensureDir(benchDir);
  ensureDir(path.dirname(outReport));

  const report = {
    generatedAt: new Date().toISOString(),
    count: samples.length,
    items: []
  };

  for (const sample of samples) {
    const templateObj = {
      id: sample.id,
      kind: 'visual_benchmark',
      visualType: sample.type,
      realPrompt: sample.realPrompt,
      structure: sample.structure
    };

    fs.writeFileSync(
      path.join(benchDir, `${sample.id}.json`),
      JSON.stringify(templateObj, null, 2) + '\n',
      'utf8'
    );

    const { project, scene } = toScene(sample);
    const engineOut = buildPromptForScene({
      project,
      scene,
      lang: 'en',
      platformId: 'universal',
      profile: 'universal',
      workspace: 'pro'
    });

    report.items.push({
      id: sample.id,
      type: sample.type,
      realPrompt: sample.realPrompt,
      structure: sample.structure,
      generatedPrompt: engineOut.finalCopyPrompt,
      observation: {
        keepsSceneSemantic: engineOut.finalCopyPrompt.toLowerCase().includes('semantic') || engineOut.finalCopyPrompt.toLowerCase().includes('scene'),
        keepsSubjectSignal: engineOut.finalCopyPrompt.toLowerCase().includes(sample.structure.subject.split(' ')[0].toLowerCase()),
        engineId: engineOut.metadata.engineId
      }
    });
  }

  fs.writeFileSync(outReport, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ ok: true, count: report.count, report: 'artifacts/benchmark-test/visual-samples-report.json' }, null, 2));
}

run();
