import { program, Option } from 'commander';

const ARTIFACT_REGISTRY = process.env.ARTIFACT_REGISTRY;
const PROJECT_ID = process.env.PROJECT_ID;
const REGION = process.env.REGION;

program
  .addOption(new Option('-b, --build', 'Enable build only').conflicts('deploy'))
  .addOption(
    new Option('-d --deploy', 'Enable deploy only').conflicts('build'),
  );

program.parse(Bun.argv);

const options = program.opts<{ build: boolean; deploy: boolean }>();

const override = !options.build && !options.deploy;

if (!ARTIFACT_REGISTRY) {
  throw Error('');
}

if ((options.build || override) && ARTIFACT_REGISTRY) {
  const buildProc = Bun.spawn([
    'docker',
    'build',
    '-t',
    ARTIFACT_REGISTRY,
    '.',
  ]);
  console.log(await new Response(buildProc.stdout).text());
  const pushProc = Bun.spawn(['docker', 'push', ARTIFACT_REGISTRY]);
  console.log(await new Response(pushProc.stdout).text());
}

if (options.deploy || override) {
  const deployProc = Bun.spawn([
    'gcloud',
    'run',
    'deploy',
    'libreserve',
    '--image',
    ARTIFACT_REGISTRY,
    // `--region=${REGION}`,
    '--region',
    `${REGION}`,
  ]);
  console.log(await new Response(deployProc.stdout).text());
}
