import getConfiguration from './getConfigurations';
import runConfigurations from './runConfigurations';

const configurations = await getConfiguration('configuration.json');
await runConfigurations(...configurations);

export {};
