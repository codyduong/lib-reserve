import { Temporal } from '@js-temporal/polyfill';
import { Configurations } from './getConfigurations';

type MessageOptions = {
  newline: boolean;
};

type Message = string | [string | undefined, MessageOptions | undefined];

/* eslint-disable @typescript-eslint/no-explicit-any */
class Webhook {
  #webhookURI: string | undefined;
  #date: Temporal.PlainDate;
  #dryRun: boolean;
  #messages: Record<number, Message[]>;
  #ping: string[];

  constructor() {
    this.#messages = {};
    this.#date = Temporal.Now.zonedDateTimeISO('America/Chicago')
      .toPlainDate()
      .add(Temporal.Duration.from(`P7D`));
    this.#dryRun = false;
    this.#ping = [];
  }

  loadConfiguration(...configurations: Configurations): void {
    const [configuration, _, date] = configurations;
    this.#webhookURI = configuration.webhook ?? undefined;
    this.#date = date;
    configuration.dryRun && (this.#dryRun = configuration.dryRun);
    this.#ping = configuration.ping ?? [];
  }

  #send(message?: Message, group = 0): void {
    this.#messages[group] = this.#messages[group] ?? [];
    this.#messages[group].push(message ?? '');
  }

  async send(): Promise<void> {
    for (const messages of Object.values(this.#messages)) {
      if (this.#webhookURI && messages.length > 0) {
        const payload = JSON.stringify({
          content:
            `**DEBUG LOG${this.#dryRun ? ' (DRY RUN)' : ''} - ${
              this.#date
            }**\n` +
            messages
              // .filter((message) => message !== undefined)
              .reduce((prev, message) => {
                if (Array.isArray(message)) {
                  const newline = message[1]?.newline ?? true;
                  return `${prev}${newline ? '\n' : ''}${message[0] ?? ''}`;
                }

                return `${prev}\n${message}`;
              }, ''),
        });

        console.log(payload, payload.length);

        const response = await fetch(this.#webhookURI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
        });

        console.log(response);
      }
    }
  }

  log(message?: string, options?: MessageOptions): void {
    this.#send([message, options]);
    console.log(message);
  }

  ping(): void {
    this.#ping.length > 0 &&
      this.#send(this.#ping.reduce((prev, curr) => prev + `<@${curr}>`, ''));
  }

  dump(): string {
    const temp = this.#messages;
    this.#messages = {};
    return Object.values(temp).reduce(
      (messages, message) => `${messages}\n${message}`,
      '',
    );
  }
}

export default Webhook;
