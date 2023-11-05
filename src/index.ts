import Cleanup from './cleanup';
import getConfiguration, { ConfigurationBase } from './getConfigurations';
import runConfigurations from './runConfigurations';
import Webhook from './webhook';
import { program } from 'commander';

program.option('-d, --dry', 'Enable dry run');
program.option(
  '-c, --configuration <filepath>',
  'Specify configuration file location',
  './configuration.json',
);

program.parse(Bun.argv);

const options = {
  ...program.opts<Partial<{ dry: boolean; filepath: string }>>(),
  filepath: './configuration.json',
};

const webhook = new Webhook();
const cleanup = new Cleanup();

async function reserve(override: Partial<ConfigurationBase>): Promise<Response>;
async function reserve(override?: undefined): Promise<void>;
async function reserve(
  override?: Partial<ConfigurationBase>,
): Promise<Response | void> {
  try {
    const configurations = await getConfiguration(options, override);
    webhook.loadConfiguration(...configurations);

    if (override === undefined) {
      webhook.log('**Running manually**\n');
    }

    cleanup.loadConfigurations(...configurations);
    await runConfigurations(webhook, cleanup, ...configurations);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    webhook.ping();
    webhook.log(`\`\`\`${e.stack ?? e}\`\`\``);
    throw e;
  } finally {
    await cleanup.cleanup();
    await webhook.send();
  }
  if (override !== undefined) {
    return new Response(webhook.dump());
  }
}

if (typeof Bun === 'undefined') {
  throw new Error('This code is meant to be run with Bun, not Node or Deno!');
}

if (process.env['PORT']) {
  Bun.serve({
    port: 3000,
    async fetch(req) {
      try {
        if (req.method === 'GET') {
          // expose one GET method to dump configuration file for debugging purposes
          await new Response(
            await Bun.file(options.filepath, {
              type: 'application/json',
            }).text(),
            {
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
              },
            },
          );
        }
        if (req.method === 'POST') {
          const configuration = req.body ? await req.json() : {};
          return await reserve(configuration);
        }
        return new Response(undefined, {
          status: 405,
        });
      } catch (e) {
        // @ts-expect-error: yada
        console.log(e?.trace);
        return new Response('Server Error', {
          status: 500,
        });
      }
    },
  });
} else {
  await reserve();
}
