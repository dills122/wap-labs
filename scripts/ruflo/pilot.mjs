import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = process.cwd();
const adapter = path.join(
  root,
  '.ruflo-local/releases/3.77.1/node_modules/@claude-flow/cli/node_modules/@claude-flow/codex/dist/dual-mode/orchestrator.js'
);
const { DualModeOrchestrator } = await import(pathToFileURL(adapter).href);
const jobs = [
  {
    id: 'http',
    marker: 'HTTP_PILOT_OK',
    file: 'transport-rust/README.md',
    task: 'describe the documented direct HTTP cancellation limitation'
  },
  {
    id: 'script',
    marker: 'SCRIPT_PILOT_OK',
    file: 'docs/waves/WBP_14_DESKTOP_PATH_EVIDENCE.md',
    task: 'describe the missing script trap evidence'
  }
];
const orchestrator = new DualModeOrchestrator({
  projectPath: root,
  maxConcurrent: 2,
  maxWriters: 1,
  timeout: 60000,
  maxOutputBytes: 20000,
  policyPreflight: true,
  sharedNamespace: 'wap-local-pilot'
});
for (const event of ['worker:started', 'worker:completed', 'worker:failed']) {
  orchestrator.on(event, (data) => console.log(JSON.stringify({ event, ...data })));
}
const workers = jobs.map((job) => ({
  id: job.id,
  platform: 'codex',
  role: 'reviewer',
  readOnly: true,
  prompt: `Read ${job.file} and ${job.task}. Reply beginning with ${job.marker} followed by one sentence. Do not run npx, access the network, modify files, or use other agents.`
}));
const result = await orchestrator.runCollaboration(
  workers,
  'Two bounded read-only Waves resilience research checks.'
);
for (const worker of result.workers) {
  console.log(
    JSON.stringify({
      id: worker.id,
      status: worker.status,
      output: worker.output,
      error: worker.error
    })
  );
}
const verified =
  result.success &&
  jobs.every((job) =>
    result.workers.some(
      (worker) =>
        worker.id === job.id && worker.status === 'completed' && worker.output?.includes(job.marker)
    )
  );
console.log(JSON.stringify({ verified }));
process.exitCode = verified ? 0 : 1;
