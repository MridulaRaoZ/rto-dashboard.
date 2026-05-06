import {
  BotFrameworkAdapter,
  TurnContext,
  ActivityTypes,
  type ConversationReference,
} from 'botbuilder';
import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { config } from '../config.js';
import {
  upsertBotResponse,
  saveConversationRef,
  getAllConversationRefs,
} from '../services/botResponseService.js';

export const adapter = new BotFrameworkAdapter({
  appId: config.botAppId,
  appPassword: config.botAppSecret,
});

adapter.onTurnError = async (context, error) => {
  console.error('Bot turn error:', error);
  await context.sendActivity('Something went wrong. Please try again later.');
};

async function handleActivity(context: TurnContext): Promise<void> {
  // Save conversation reference when user is added or messages the bot
  if (
    context.activity.type === ActivityTypes.ConversationUpdate ||
    context.activity.type === ActivityTypes.Message
  ) {
    const userId = context.activity.from?.aadObjectId ?? context.activity.from?.id;
    if (userId) {
      const ref = TurnContext.getConversationReference(context.activity);
      saveConversationRef(userId, JSON.stringify(ref));
    }
  }

  // Handle adaptive card submission (Yes/No button press)
  if (context.activity.type === ActivityTypes.Invoke) {
    const value = context.activity.value as {
      userId?: string;
      date?: string;
      response?: string;
    } | null;

    if (value?.userId && value?.date && value?.response) {
      const inOffice = value.response === 'yes';
      upsertBotResponse(value.userId, '', value.date, inOffice);

      const reply = inOffice
        ? `Logged! You're in the office on ${value.date}.`
        : `Logged! Working remotely on ${value.date}.`;

      await context.sendActivity(reply);
    }

    // Required invoke response
    await context.sendActivity({
      type: 'invokeResponse',
      value: { status: 200 },
    });
    return;
  }

  if (context.activity.type === ActivityTypes.Message) {
    await context.sendActivity(
      "Hi! I'll send you a daily check-in message each morning. No action needed right now."
    );
  }
}

export function buildBotRouter(): Router {
  const router = createRouter();

  router.post('/messages', (req, res) => {
    adapter.processActivity(req, res, handleActivity);
  });

  return router;
}

// ─── Proactive daily message ──────────────────────────────────────────────────

export function buildDailyCard(userId: string, date: string): object {
  return {
    contentType: 'application/vnd.microsoft.card.adaptive',
    content: {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: `RTO Check-In — ${date}`,
          weight: 'Bolder',
          size: 'Medium',
        },
        {
          type: 'TextBlock',
          text: 'Are you in the office today?',
          wrap: true,
        },
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: 'Yes, I am in office',
          data: { userId, date, response: 'yes' },
        },
        {
          type: 'Action.Submit',
          title: 'No, working remotely',
          data: { userId, date, response: 'no' },
        },
      ],
    },
  };
}

export async function sendDailyCheckins(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const refs = getAllConversationRefs();

  for (const row of refs) {
    const ref = JSON.parse(row.ref_json) as Partial<ConversationReference>;
    try {
      await adapter.continueConversation(ref as ConversationReference, async (ctx) => {
        await ctx.sendActivity({
          attachments: [buildDailyCard(row.user_id, today)],
        });
      });
    } catch (err) {
      console.error(`Failed to send daily check-in to ${row.user_id}:`, err);
    }
  }
}
