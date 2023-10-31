import Cleanup from './cleanup';
import getConfiguration from './getConfigurations';
import runConfigurations from './runConfigurations';
import Webhook from './webhook';
import { program } from 'commander';

program.option('-d, --dry', 'Enable dry run');

program.parse(Bun.argv);

const options = program.opts<{ dry: boolean }>();

const webhook = new Webhook();
const cleanup = new Cleanup();

const reserve = async (): Promise<void> => {
  try {
    const configurations = await getConfiguration(
      'configuration.json',
      options,
    );
    webhook.loadConfiguration(...configurations);
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
};

if (process.env['PORT']) {
  const server = Bun.serve({
    port: 3000,
    async fetch(_) {
      await reserve();
      return new Response(webhook.dump());
    },
  });
} else {
  await reserve();
}
