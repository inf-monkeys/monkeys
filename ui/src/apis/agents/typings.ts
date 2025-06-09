export interface IAgent {
  displayName: string | Record<string, string>;
  description?: string | Record<string, string>;
  customModelName?: string;
  model: string;
  systemPrompt?: string;
  knowledgeBase?: string;
  sqlKnowledgeBase?: string;
  tools?: string[];
  temperature?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  createdTimestamp?: string;
  updatedTimestamp?: string;
}
