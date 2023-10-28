import Cleanup from './cleanup';
import getConfiguration from './getConfigurations';
import runConfigurations from './runConfigurations';
import Webhook from './webhook';

const webhook = new Webhook();
const cleanup = new Cleanup();

try {
  const configurations = await getConfiguration('configuration.json');
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