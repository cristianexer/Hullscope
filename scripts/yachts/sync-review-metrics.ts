import {readdir, readFile, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';

import selection from '../../research/yachts/release-selection.json' with {type: 'json'};

const root = process.cwd();
const reviewRoot = join(root, '.tools', 'yachts', 'review');

async function readJson(path: string, fallback: Record<string, unknown>) {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return fallback;
  }
}

async function main() {
  let updated = 0;
  for (const vesselId of selection.ids) {
    const renderDir = join(reviewRoot, vesselId, 'renders');
    let files: string[] = [];
    try {
      files = (await readdir(renderDir))
        .filter((file) => file.toLowerCase().endsWith('.png'))
        .sort()
        .map((file) => relative(root, join(renderDir, file)));
    } catch {
      files = [];
    }
    const metricsPath = join(reviewRoot, vesselId, 'metrics.json');
    const metrics = await readJson(metricsPath, {vesselId, selfReviewStatus: 'not QA-approved'});
    metrics.vesselId = vesselId;
    metrics.renderedViews = files;
    metrics.renderedViewCount = files.length;
    metrics.selfReviewStatus = metrics.selfReviewStatus ?? 'not QA-approved';
    await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');

    const reportPath = join(reviewRoot, vesselId, 'scene_report.json');
    try {
      const report = await readJson(reportPath, {});
      const technical = await readJson(join(root, '.tools', 'yachts', 'assets', 'models', vesselId, 'technical-review.json'), {});
      const assets = Array.isArray(technical.assets) ? technical.assets : [];
      report.manifest = {
        ...(typeof report.manifest === 'object' && report.manifest ? report.manifest : {}),
        assets,
        assetCount: assets.length,
      };
      report.renderOutputs = files;
      report.renderedViews = files;
      report.renderedViewCount = files.length;
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    } catch {
      // Metrics are the required release evidence; some masters do not emit a
      // scene report, so do not fabricate one here.
    }
    updated += 1;
  }
  console.log(JSON.stringify({updated, vessels: selection.ids.length}));
}

await main();
