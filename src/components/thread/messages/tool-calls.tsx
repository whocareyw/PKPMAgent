import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SyntaxHighlighter } from "@/components/thread/syntax-highlighter";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="w-fit h-full grid grid-rows-[1fr_auto] gap-0">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const hasArgs = Object.keys(args).length > 0;
        return (
          <div
            key={idx}
            className="w-full overflow-hidden rounded-lg border border-gray-200"
          >            
            <div className="border-b border-gray-50 bg-gray-50 px-2 py-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                {tc.name ? (
                  <h3 className="font-sm text-gray-900">
                    🛠️Tool Calling...{" "}
                    <code className="rounded bg-gray-50 px-2 py-1">
                      {tc.name}
                    </code>
                  </h3>
                ) : (
                  <h3 className="font-sm text-gray-900">Tool Result</h3>
                )}            
              </div>
            </div>
            <motion.div
              className="min-w-full bg-white"
              initial={false}
              animate={{ height: "auto" }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded && (
                <div className="p-3">
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    <motion.div
                      key={isExpanded ? "expanded" : "collapsed"}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {hasArgs ? (
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="divide-y divide-gray-200">
                            {Object.entries(args).map(([key, value], argIdx) => (
                              <tr key={argIdx}>
                                <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                                  {key}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {isComplexValue(value) ? (
                                    <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
                                      {JSON.stringify(value, null, 2)}
                                    </code>
                                  ) : (
                                    <SyntaxHighlighter language="python" className="text-sm">
                                      {String(value)}
                                    </SyntaxHighlighter>                         
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <code className="block text-sm">{"{}"}</code>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
              <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-gray-200 py-1 text-gray-500 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-600"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-4 h-4">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </motion.button>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {

  const isImage = typeof message.content === 'string' && 
  (message.content.endsWith('.svg') || message.content.endsWith('.png') || 
   message.content.endsWith('.jpg') || message.content.endsWith('.jpeg') || 
   message.content.endsWith('.gif'));

  const [isExpanded, setIsExpanded] = useState(isImage); // 直接用 isImage 初始化 
  
  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = isComplexValue(parsedContent);
    }
  } catch {
    // Content is not JSON, use as is
    parsedContent = message.content;
  }

  const contentStr = isJsonContent
    ? JSON.stringify(parsedContent, null, 2)
    : String(message.content);
  const contentLines = contentStr.split("\n");
  const displayedContent = isExpanded ? contentStr : "";

  return (
    <div className="w-fit h-full grid grid-rows-[1fr_auto] gap-0">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="border-b border-gray-50 bg-gray-50 px-2 py-1">
          <div className="flex flex-wrap items-center justify-between gap-1">
            {message.name ? (
              <h3 className="font-sm text-gray-900">
                🛠️Tool Result ：{" "}
                <code className="rounded bg-gray-50 px-2 py-1">
                  {message.name}
                </code>
              </h3>
            ) : (
              <h3 className="font-sm text-gray-900">🛠️Tool Result</h3>
            )}            
          </div>
        </div>
        <motion.div          
          className="min-w-full bg-white"
          initial={false}
          animate={{ height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded && (
            <div className="p-3">
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.div
                  key={isExpanded ? "expanded" : "collapsed"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {isImage ? (
                    <div className="flex justify-center">
                      <a 
                        href={`file:///${typeof message.content === 'string' ? message.content.replace(/\\/g, '/') : ''}`}
                        target="_blank"
                      >
                        <img 
                          src={`file:///${typeof message.content === 'string' ? message.content.replace(/\\/g, '/') : ''}`}
                          alt="Generated figure"
                          className="max-w-full h-auto cursor-pointer rounded border"
                          style={{ maxHeight: '500px' }}
                        />
                      </a>
                    </div>
                  ) : (
                    isJsonContent ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="divide-y divide-gray-200">
                          {(Array.isArray(parsedContent)
                            ? parsedContent
                            : Object.entries(parsedContent)
                          ).map((item, argIdx) => {
                            const [key, value] = Array.isArray(parsedContent)
                              ? [argIdx, item]
                              : [item[0], item[1]];
                            return (
                              <tr key={argIdx}>
                                <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                                  {key}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {isComplexValue(value) ? (
                                    <code className="rounded bg-gray-50 px-2 py-1 font-mono text-sm break-all">
                                      {JSON.stringify(value, null, 2)}
                                    </code>
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <code className="block text-sm">{displayedContent}</code>
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full cursor-pointer items-center justify-center border-t-[1px] border-gray-200 py-1 text-gray-500 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-600"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-4 h-4">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
