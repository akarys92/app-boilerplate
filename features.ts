export const features = {
  auth: true,
  payments: true,
  chat: true,
  voice: false,
  analytics: true,
  emails: true,
  uploads: true,
  rag: false,
};

export type FeatureFlag = keyof typeof features;

export function isFeatureEnabled(flag: FeatureFlag) {
  return Boolean(features[flag]);
}
