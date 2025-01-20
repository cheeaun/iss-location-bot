import '@std/dotenv/load';
import { createBot, link, mention, parseSemVer, text } from '@fedify/botkit';
import { mentions } from '@fedify/botkit/text';
import { DenoKvMessageQueue, DenoKvStore } from '@fedify/fedify/x/denokv';

import metadata from './deno.json' with { type: 'json' };

const NAME = 'iss-location-bot';
const GITHUB_REPO = 'https://github.com/cheeaun/iss-location-bot';
const LANG = 'en';

const SERVER_NAME = Deno.env.get('SERVER_NAME');
if (SERVER_NAME == null) {
  console.error('The SERVER_NAME environment variable is not set.');
  Deno.exit(1);
}

const kv = await Deno.openKv();

const bot = createBot({
  username: NAME,
  name: 'ISS Location Bot',
  summary: text`Show the current location of the International Space Station.`,
  // Icon from https://www.reddit.com/r/ISS/
  icon: new URL(
    'https://styles.redditmedia.com/t5_2uhsj/styles/communityIcon_ktlx4tgv4ek51.png',
  ),
  properties: {
    'Source code': link(
      'GitHub',
      GITHUB_REPO,
    ),
    'Powered by': link('BotKit', 'https://botkit.fedify.dev/'),
    'Created by': mention('@cheeaun@mastodon.social'),
  },
  software: {
    name: NAME,
    version: parseSemVer(metadata.version),
    repository: new URL(GITHUB_REPO),
  },
  kv: new DenoKvStore(kv),
  queue: new DenoKvMessageQueue(kv),
  behindProxy: Deno.env.get('DENO_DEPLOYMENT_ID') == null,
});

// bot.onFollow = async (session, follower) => {
//   await session.publish(text`Thanks for following me, ${follower}!`, {
//     visibility: 'direct',
//   });
// };

async function getPeopleInSpace() {
  const response = await fetch('http://api.open-notify.org/astros.json');
  return await response.json();
}

const replyPeople = async (session, msg) => {
  // if (msg.replyTarget != null) return;
  const actor = msg.actor;
  console.log('💬', actor.url || actor.id, msg.text);
  if (/(who|astronaut|crew|people)/i.test(msg.text)) {
    const data = await getPeopleInSpace();
    const astronauts = data.people
      .map(
        (person) => `${person.name}${person.craft ? ` (${person.craft})` : ''}`,
      )
      .join('\n');
    const txt = text`People in space: ${data.number}

${astronauts}`;
    await msg.reply(
      (await mentions(session, txt, actor))
        ? txt
        : text`${mention(actor)}\n\n${txt}`,
      {
        language: LANG,
      },
    );
  }
};

bot.onMention = async (session, msg) => {
  if (msg.replyTarget != null) return;
  await replyPeople(session, msg);
};
bot.onReply = replyPeople;

async function getISSLocation() {
  const response = await fetch('http://api.open-notify.org/iss-now.json');
  return await response.json();
}

Deno.cron(
  'Post ISS location',
  { hour: { every: 1 } },
  {
    backoffSchedule: [1000, 5000, 10000],
  },
  () => {
    getISSLocation().then((data) => {
      const { iss_position } = data;
      const session = bot.getSession(SERVER_NAME);
      console.log('🛰️', iss_position);
      session.publish(
        text`Latitude: ${iss_position.latitude}${'\n'}Longitude: ${iss_position.longitude}`,
        {
          language: LANG,
        },
      );
    });
  },
);

bot.federation.startQueue();

export default bot;
