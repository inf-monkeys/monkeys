import { ChatMessage } from '@/components/ai-chatbot/typings';

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}
