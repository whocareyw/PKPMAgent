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
import { Fragment, memo } from "react";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { useQueryState, parseAsBoolean } from "nuqs";
import { GenericInterruptView } from "./generic-interrupt";
import { useArtifact } from "../artifact";


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

  const handleRegenerate = async() => {

    const state = message ? await getMessageState(thread, message) : undefined;    

    thread.submit(undefined, {
      checkpoint: state?.parent_checkpoint ?? parentCheckpoint,
      streamMode: ['messages'],
      streamSubgraphs: true,
      // streamResumable: true,
    });
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

  // let isTempToolCall: boolean = false
  // if (!toolCallsHaveContents && message && 
  //   "tool_call_chunks" in message &&
  //   message.tool_call_chunks && 
  //   Array.isArray(message.tool_call_chunks) && 
  //   message.tool_call_chunks.length >= 1)
  //   { 
  //     isTempToolCall = true; 
  //   }

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
                {(hasToolCalls && toolCallsHaveContents && (
                  <OptimizedToolCalls toolCalls={message.tool_calls} isLoading={isLoading} />
                )) ||
                  (hasAnthropicToolCalls && (
                    <OptimizedToolCalls toolCalls={anthropicStreamedToolCalls} isLoading={isLoading} />
                  )) 
                  // ||
                  // (hasToolCalls &&(
                  //   <ToolCalls toolCalls={message.tool_calls} isTempToolCall={Boolean(isTempToolCall)} />
                  // ))
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
                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
              )}
            >             
              <BranchSwitcher
                branch={meta?.branch}
                branchOptions={meta?.branchOptions}
                onSelect={(branch) => thread.setBranch(branch)}
                isLoading={isLoading}
              />
              <CommandBar
                content={contentString}
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
