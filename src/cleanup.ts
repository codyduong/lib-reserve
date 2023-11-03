// Cleanup any artifacts if we fail a run

import { ConfigurationBase, Configurations } from './getConfigurations';

class Cleanup {
  #sessions: number[] = [];
  #loaded: boolean = false;
  #configuration: ConfigurationBase | undefined;
  // eslint-disable-next-line no-empty-function
  constructor() {}

  loadConfigurations(...configurations: Configurations) {
    const [base] = configurations;
    this.#configuration = base;
    this.#loaded = true;
  }

  addSession(session: number) {
    this.#sessions.push(session);
  }

  removeSession(session: number) {
    this.#sessions = this.#sessions.filter((s) => s == session);
  }

  async cleanup() {
    if (!this.#loaded) {
      throw Error(
        'No configuration! Call loadConfiguration with getConfiguration first',
      );
    }

    this.#sessions.forEach(async (session) => {
      const formData = new FormData();
      formData.append('session', `${session}`);

      const response = await fetch(this.#configuration!.urlEnd!, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: this.#configuration!.url!,
        },
        body: formData,
      });

      if (response.status !== 200) {
        throw Error(`Unhandled status: ${response.status}`);
      }
    });
  }
}

export default Cleanup;
