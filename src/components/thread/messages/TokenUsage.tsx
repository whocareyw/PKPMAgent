import { MessageContentComplex } from "@langchain/core/messages";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";

// Token使用量组件
export function TokenUsageSection({ message }: { message: Message }) {
  // 尝试从message的不同字段中获取token使用量信息
  const getTokenUsage = () => {
    const messageAny = message as any;
    
    // 检查response_metadata字段
    if (messageAny.usage_metadata) {
      return messageAny.usage_metadata;
    }
    
    // 检查usage_metadata字段
    if (messageAny.usage_metadata) {
      return messageAny.usage_metadata;
    }
    
    // 检查additional_kwargs中的usage信息
    if (messageAny.additional_kwargs?.usage_metadata) {
      return messageAny.additional_kwargs.usage_metadata;
    }
    
    
    // 检查message本身是否有usage字段
    if (messageAny.usage) {
      return messageAny.usage;
    }
    
    return null;
  };
  
  const usage = getTokenUsage();
  
  if (!usage) {
    return null;
  }
  
  // 计算总token数
  const inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
  const outputTokens = usage.output_tokens || usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (inputTokens + outputTokens) || 0;
  
  return (
    <div className="text-xs text-muted-foreground mt-0 px-1 py-2 ">
      <div className="flex items-center gap-2">
        {totalTokens > 0 && (
          <span className="flex items-center gap-0">            
            <span className="font-medium font-semibold">Tokens:</span>
            <span className="font-medium font-semibold">{totalTokens}</span>
          </span>
        )}
        {inputTokens > 0 && (
          <span className="flex items-center gap-0">
            <span className="font-medium text-gray-600 font-semibold">↑</span>
            <span className="font-medium font-semibold">{inputTokens}</span>
          </span>
        )}
        {outputTokens > 0 && (
          <span className="flex items-center gap-0">
            <span className="font-medium text-gray-600 font-semibold">↓</span>
            <span className="font-medium font-semibold">{outputTokens}</span>
          </span>
        )}        
      </div>
    </div>
  );
}
