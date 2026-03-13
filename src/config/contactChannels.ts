export const CONTACT_CHANNELS = {
  support: "support@scenepilotix.com",
  admin: "admin@scenepilotix.com",
  contact: "contact@scenepilotix.com",
  noreply: "noreply@scenepilotix.com"
} as const;

export const PUBLIC_CONTACT_CHANNELS = {
  support: CONTACT_CHANNELS.support,
  business: CONTACT_CHANNELS.contact
} as const;

export const SYSTEM_NOTIFICATION_MAILBOX = CONTACT_CHANNELS.noreply;
