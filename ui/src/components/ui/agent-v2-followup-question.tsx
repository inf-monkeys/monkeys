import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';
import { IParsedFollowupQuestion } from '@/utils/agent-v2-response-parser';

interface IAgentV2FollowupQuestionProps {
  followupQuestion: IParsedFollowupQuestion;
  onAnswer: (answer: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const AgentV2FollowupQuestion: React.FC<IAgentV2FollowupQuestionProps> = ({
  followupQuestion,
  onAnswer,
  isLoading = false,
  className,
}) => {
  const [customAnswer, setCustomAnswer] = useState('');

  const handleSuggestionClick = (suggestion: string) => {
    onAnswer(suggestion);
  };

  const handleCustomSubmit = () => {
    if (customAnswer.trim()) {
      onAnswer(customAnswer.trim());
      setCustomAnswer('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(className)}
    >
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-blue-900">
            <MessageCircle className="size-4" />
            智能体询问
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="leading-relaxed text-blue-800">{followupQuestion.question}</CardDescription>

          {/* 预设建议 */}
          {followupQuestion.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">建议回答：</p>
              <div className="grid gap-2">
                {followupQuestion.suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="default"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                    className="h-auto justify-start whitespace-normal border-blue-200 bg-white px-3 py-2 text-left text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 自定义回答 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-900">自定义回答：</p>
            <div className="flex gap-2">
              <Input
                value={customAnswer}
                onChange={setCustomAnswer}
                onKeyDown={handleKeyDown}
                placeholder="输入您的回答..."
                disabled={isLoading}
                className="flex-1 border-blue-200 bg-white focus:border-blue-400"
              />
              <Button
                onClick={handleCustomSubmit}
                disabled={!customAnswer.trim() || isLoading}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>

          {isLoading && <div className="animate-pulse text-sm text-blue-700">正在处理您的回答...</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
};
