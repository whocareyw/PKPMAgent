import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext, getMessageState } from "@/providers/Stream";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { cn } from "@/lib/utils";
import { ToolCalls, ToolResult } from "./tool-calls";
import { TokenUsageSection } from "./TokenUsage";
import { ThinkingSection } from "./Thinking";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment, memo, useState } from "react";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { useQueryState, parseAsBoolean } from "nuqs";
import { GenericInterruptView } from "./generic-interrupt";
import { useArtifact } from "../artifact";
import { Star, Loader2 } from "lucide-react";
import { TooltipIconButton } from "../tooltip-icon-button";
import { getAllScripts, saveScript } from "@/lib/model-config-api";
import { toast } from "sonner";


function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const artifact = useArtifact();
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id,
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent, artifact }}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

interface InterruptProps {
  interrupt?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({
  interrupt,
  isLastMessage,
  hasNoAIOrToolMessages,
}: InterruptProps) {
  const fallbackValue = Array.isArray(interrupt)
    ? (interrupt as Record<string, any>[])
    : (((interrupt as { value?: unknown } | undefined)?.value ??
        interrupt) as Record<string, any>);

  return (
    <>
      {isAgentInboxInterruptSchema(interrupt) &&
        (isLastMessage || hasNoAIOrToolMessages) && (
          <ThreadView interrupt={interrupt} />
        )}
      {interrupt &&
      !isAgentInboxInterruptSchema(interrupt) &&
      (isLastMessage || hasNoAIOrToolMessages) ? (
        <GenericInterruptView interrupt={fallbackValue} />
      ) : null}
    </>
  );
}

const OptimizedToolCalls = memo(
  ({
    toolCalls,
    isLoading,
    isTempToolCall,
  }: {
    toolCalls: AIMessage["tool_calls"];
    isLoading: boolean;
    isTempToolCall?: boolean;
  }) => {
    return <ToolCalls toolCalls={toolCalls} isTempToolCall={isTempToolCall} />;
  },
  (prevProps, nextProps) => {
    if (prevProps.isLoading && !nextProps.isLoading) return false;
    if (!nextProps.isLoading) {
      return (
        JSON.stringify(prevProps.toolCalls) ===
        JSON.stringify(nextProps.toolCalls)
      );
    }

    const prevToolCalls = prevProps.toolCalls;
    const nextToolCalls = nextProps.toolCalls;

    if (!prevToolCalls || !nextToolCalls)
      return prevToolCalls === nextToolCalls;
    if (prevToolCalls.length !== nextToolCalls.length) return false;

    const prevFirst = prevToolCalls[0];
    const nextFirst = nextToolCalls[0];

    if (!prevFirst || !nextFirst) return prevFirst === nextFirst;
    if (prevFirst.id !== nextFirst.id) return false;
    if (prevFirst.name !== nextFirst.name) return false;

    const prevArgsStr = JSON.stringify(prevFirst.args);
    const nextArgsStr = JSON.stringify(nextFirst.args);

    if (Math.abs(nextArgsStr.length - prevArgsStr.length) < 50) {
      return true;
    }

    return false;
  },
);

export function AssistantMessage({
  message,
  isLoading,
}: {
  message: Message | undefined;
  isLoading: boolean;
}) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);

  let argsString = ''
  if (message && "tool_calls" in message && (message as AIMessage).tool_calls?.length) {
    const args = (message as AIMessage).tool_calls![0].args;
    if (args && "code" in args) {
      const codeVal = args.code;
      argsString = typeof codeVal === "string" ? codeVal : JSON.stringify(codeVal);
    }
  }
  // if (!argsString || argsString.length === 0){
  //   argsString = contentString;
  // }

  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages[thread.messages.length - 1].id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint // state?.parent_checkpoint  
  const [threadId] = useQueryState("threadId");
  const [isSaving, setIsSaving] = useState(false);

  const handleRegenerate = async() => {

    const state = message ? await getMessageState(thread, message, threadId) : undefined;    

    thread.submit(undefined, {
      checkpoint: state?.parent_checkpoint,
      streamMode: ['messages'],
      streamSubgraphs: true,
      // streamResumable: true,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find current message index
      const currentIndex = thread.messages.findIndex(m => m.id === message?.id);
      if (currentIndex === -1) {
        toast.error("Current message not found in thread");
        setIsSaving(false);
        return;
      }

      // Find the last human message
      let humanMessageIndex = -1;
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (thread.messages[i].type === 'human') {
          humanMessageIndex = i;
          break;
        }
      }

      const humanMessageContent = humanMessageIndex !== -1 
        ? getContentString(thread.messages[humanMessageIndex].content)
        : "Unknown Prompt";

      // Collect scripts
      const scripts: string[] = [];
      const startIndex = humanMessageIndex !== -1 ? humanMessageIndex + 1 : 0;
      
      for (let i = startIndex; i <= currentIndex; i++) {
        const msg = thread.messages[i] as AIMessage;
        // Check for tool calls
        if (msg.tool_calls && msg.tool_calls.length > 0) {

            // 本次调用有error，就不复制了
            if(i+1 <= currentIndex){
              const nextMsg = thread.messages[i+1];
              if(nextMsg?.type === "tool" && Array.isArray(nextMsg.content)){
                const hasError = nextMsg.content.some((c: any) => {
                  try {
                    if (c.type === 'text' && c.text) {
                      const res = JSON.parse(c.text);
                      return res && res.error;
                    }
                  } catch (e) {
                    // ignore
                  }
                  return false;
                });
                if (hasError) {
                  continue;
                }
              }
            }
           
            for (const tc of msg.tool_calls) {
                if (tc.args && tc.args.code) {
                    const code = tc.args.code;
                    // 构建包含 name 和其他参数的注释
                    const otherArgs = Object.entries(tc.args)
                        .filter(([key]) => key !== 'code')
                        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
                        .join(', ');
                    const comment = otherArgs ? `# ${tc.name}: ${otherArgs}` : `# ${tc.name}`;
                    const codeStr = typeof code === 'string' ? code : JSON.stringify(code);
                    // 把注释和 code 合并为一个字符串，中间用单个换行符
                    scripts.push(`${comment}\n${codeStr}`);
                }
            }
        }
      }

      if (scripts.length === 0) {
        toast.info("No scripts found to save.");
        setIsSaving(false);
        return;
      }

      const allScriptsContent = scripts.join("\n\n");
      const finalContent = `"""\n${humanMessageContent}\n"""\n\n${allScriptsContent}`;

      // Generate unique name
      const { data: existingScriptsData } = await getAllScripts();
      const existingNames = new Set(existingScriptsData?.scripts || []);
      
      let scriptName = `ShortCut_${1}.py`;
      // Ensure uniqueness
      let counter = 1;
      while (existingNames.has(scriptName)) {
         scriptName = `ShortCut_${counter}.py`;
         counter++;
      }

      // Save
      const saveRes = await saveScript({ script_name: scriptName, content: finalContent });
      if (saveRes.error) {
        toast.error(`保存失败: ${saveRes.error}`);
      } else {
        toast.success(`${scriptName} 已收藏到 Python 快捷指令`);
      }

    } catch (e) {
      console.error(e);
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    );    

  const isTempToolCall = message && "tool_call_chunks" in message 
    && message.tool_call_chunks &&  Array.isArray(message.tool_call_chunks) 
    && message.tool_call_chunks.length > 0
    && message.tool_call_chunks?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    ); 
  

  // if (isTempToolCall && message && "tool_call_chunks" in message && "tool_calls" in message ) {
  //   if( Array.isArray(message.tool_calls) && message.tool_calls?.length > 0 &&
  //   Array.isArray(message.tool_call_chunks) && message.tool_call_chunks.length >= 1) 
  //   {
  //     message.tool_calls[0].name = message.tool_call_chunks[0].name
  //     message.tool_calls[0].args = [message.tool_call_chunks[0].args]
  //     //console.log(message.tool_call_chunks[message.tool_call_chunks.length-1].args)
  //   }    
  //   // = (message.tool_calls || []).map((tc, index) => {
  //   //   const additionalTc = Array.isArray(message.tool_call_chunks) ? message.tool_call_chunks[index] : undefined;
  //   //   if (additionalTc?.function?.arguments && typeof additionalTc.function.arguments === 'string') {
  //   //     return {
  //   //       ...tc,
  //   //       args: {
  //   //         Info: additionalTc.function.arguments
  //   //       }
  //   //     };
  //   //   }
  //   //   return tc;
  //   // });
  // }

  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message?.type === "tool";

  if (isToolResult && hideToolCalls) {
    return null;
  }

  return (
    <div className="group mr-auto flex w-full items-start gap-2">
      <div className="flex w-full flex-col gap-2">
        {isToolResult ? (
          <>
            <ToolResult message={message} />
            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
          </>
        ) : (
          <>
            { message?.additional_kwargs?.reasoning_content && (
              <ThinkingSection content={String(message.additional_kwargs?.reasoning_content || '')} isUnFinish={message?.content?.length == 0} />
            )}

            {contentString.length > 0 && (
              <div className="py-1">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            {!hideToolCalls && (
              <>
                {(hasToolCalls && toolCallsHaveContents && isTempToolCall &&(
                  <OptimizedToolCalls toolCalls={message.tool_calls} isLoading={isLoading} />
                )) ||
                  (hasAnthropicToolCalls && (
                    <OptimizedToolCalls toolCalls={anthropicStreamedToolCalls} isLoading={isLoading} />
                  )) 
                  ||
                  (hasToolCalls && toolCallsHaveContents && !isTempToolCall &&(
                    <ToolCalls toolCalls={message.tool_calls} isTempToolCall={Boolean(isTempToolCall)} />
                  ))
                  }
              </>
            )}

            {message && (
              <CustomComponent
                message={message}
                thread={thread}
              />
            )}
            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            <div
              className={cn(
                "mr-auto flex items-center gap-2 transition-opacity",
                "opacity-100 group-focus-within:opacity-100 group-hover:opacity-100",
              )}
            >             
              {/* 收藏按钮 */}
              {message && message.type === "ai" && (message as any).response_metadata?.finish_reason === "stop" && (
                <TooltipIconButton
                  tooltip="收藏到 Python 快捷指令 "
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="w-auto h-auto px-1 gap-0.5"
                  >
                   {isSaving ? <Loader2 className="text-[rgb(31,154,236)] animate-spin size-4.5" /> : <Star className="text-[rgb(31,154,236)] size-4.5" strokeWidth={2.5} />}
                   <span className="text-[rgb(31,154,236)] text-sm font-bold">快捷指令</span>
                </TooltipIconButton>
              )}
              <BranchSwitcher
                branch={meta?.branch}
                branchOptions={meta?.branchOptions}
                onSelect={(branch) => thread.setBranch(branch)}
                isLoading={isLoading}
              />
              <CommandBar
                content={argsString}
                isLoading={isLoading}
                isAiMessage={true}
                handleRegenerate={handleRegenerate}
              />            
              {/* Token使用量显示 */}
              {message && message.type === "ai" && (
                <TokenUsageSection message={message} />
              )}     
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="mr-auto flex items-start gap-2">
      <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_0.5s_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_1s_infinite] rounded-full"></div>
      </div>
    </div>
  );
}
