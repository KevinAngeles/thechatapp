import { z } from 'zod';

export const messageInputSchema = z.object({
  user: z.email('Username must be a valid email address')
    .max(50, 'Username must be at most 50 characters'),
    
  nickname: z.string()
    .min(2, 'Nickname must be at least 2 characters')
    .max(30, 'Nickname must be at most 30 characters'),
    
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be at most 1000 characters')
});

export type MessageInput = z.infer<typeof messageInputSchema>;
