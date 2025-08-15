/**
 * OpenAI Client Configuration for ThinkSpace
 * 
 * This file provides OpenAI client configuration using OpenRouter API
 * for chat completions and AI-powered features in ThinkSpace.
 */

import { OpenAI } from 'openai';

// Initialize OpenRouter client (compatible with OpenAI API)
export const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
});

// Default models from environment variables
export const DEFAULT_CHAT_MODEL = process.env.DEFAULT_CHAT_MODEL || 'qwen/qwen3-coder:free';
export const DEFAULT_EMBEDDING_MODEL = process.env.DEFAULT_EMBEDDING_MODEL || 'text-embedding-3-small';

/**
 * Generate chat completion using OpenRouter
 */
export async function generateChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  try {
    const response = await openai.chat.completions.create({
      model: options?.model || DEFAULT_CHAT_MODEL,
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2000,
      stream: false,
    });

    return response;
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw new Error(`Failed to generate chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate streaming chat completion using OpenRouter
 */
export async function generateStreamingChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  try {
    const stream = await openai.chat.completions.create({
      model: options?.model || DEFAULT_CHAT_MODEL,
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2000,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error('Error generating streaming chat completion:', error);
    throw new Error(`Failed to generate streaming chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create system message for PARA methodology context
 */
export function createSystemMessage(context?: {
  projectTitle?: string;
  areaTitle?: string;
  resourceTitle?: string;
  noteTitle?: string;
}): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  let systemContent = `You are an AI assistant for ThinkSpace, a PARA methodology-based knowledge management system. 

The PARA method organizes information into:
- Projects: Things with a deadline and specific outcome
- Areas: Ongoing responsibilities to maintain over time
- Resources: Topics of ongoing interest for future reference
- Archive: Inactive items from the other categories

You help users manage their knowledge, make connections between ideas, and provide insights based on their PARA-organized content.`;

  if (context) {
    systemContent += '\n\nCurrent context:';
    if (context.projectTitle) systemContent += `\n- Project: ${context.projectTitle}`;
    if (context.areaTitle) systemContent += `\n- Area: ${context.areaTitle}`;
    if (context.resourceTitle) systemContent += `\n- Resource: ${context.resourceTitle}`;
    if (context.noteTitle) systemContent += `\n- Note: ${context.noteTitle}`;
  }

  return {
    role: 'system',
    content: systemContent,
  };
}
