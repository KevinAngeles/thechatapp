import { z } from 'zod';

/**
 * Validation schema for posting a chat message.
 * Identity (publicId, nickname, sessionId) is now derived exclusively from the
 * verified accessToken cookie in the GraphQL context. Only validate message content.
 */
export const messageInputSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be at most 1000 characters')
});

export type MessageInput = z.infer<typeof messageInputSchema>;
