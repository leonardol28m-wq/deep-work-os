// ============================================================
// Deep Work OS — Site Blocker
// Uses declarativeNetRequest for efficient blocking
// ============================================================

import type { BlockerMode } from '../types';

export const BLOCKED_DOMAINS_NORMAL = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'tiktok.com',
  'twitch.tv',
  'reddit.com',
  'twitter.com',
  'x.com',
];

export const BLOCKED_DOMAINS_EXTREME = [
  ...BLOCKED_DOMAINS_NORMAL,
  'netflix.com',
  'discord.com',
  'whatsapp.com',
  'telegram.org',
  'linkedin.com',
  'pinterest.com',
  'tumblr.com',
  'buzzfeed.com',
  '9gag.com',
  'vimeo.com',
];

const RULE_ID_BASE = 1000;

function buildRules(
  domains: string[],
  baseId: number
): chrome.declarativeNetRequest.Rule[] {
  const blockedPageUrl = chrome.runtime.getURL('blocked/index.html');
  return domains.flatMap((domain, i) => {
    const ruleId = baseId + i * 2;
    return [
      {
        id: ruleId,
        priority: 10,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: { url: `${blockedPageUrl}?domain=${encodeURIComponent(domain)}` },
        },
        condition: {
          urlFilter: `||${domain}^`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      },
      {
        id: ruleId + 1,
        priority: 10,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: { url: `${blockedPageUrl}?domain=${encodeURIComponent(domain)}` },
        },
        condition: {
          urlFilter: `||www.${domain}^`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      },
    ];
  });
}

export async function updateBlockingRules(
  mode: BlockerMode,
  customDomains: string[],
  extremeExtra: string[]
): Promise<void> {
  await clearBlockingRules();
  if (mode === 'off') return;
  const domains = mode === 'extreme'
    ? [...new Set([...customDomains, ...extremeExtra])]
    : customDomains;
  const rules = buildRules(domains, RULE_ID_BASE);
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
      removeRuleIds: rules.map(r => r.id),
    });
    console.log(`[Blocker] ${mode}: ${domains.length} domains blocked`);
  } catch (err) {
    console.error('[Blocker] Failed to update rules:', err);
  }
}

export async function clearBlockingRules(): Promise<void> {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const ids = existing.map(r => r.id);
    if (ids.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ids, addRules: [] });
    }
  } catch (err) {
    console.error('[Blocker] Failed to clear rules:', err);
  }
}
