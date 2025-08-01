import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SyntaxHighlighter } from "@/components/thread/syntax-highlighter";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}


export default function PicViewer({ base64 }: { base64: string }) {
  return base64 ? (
    <img
  src={base64}
  style={{ cursor: 'pointer' }}
  onClick={() => {
    const win = window.open();
    if (win) {
      const doc = win.document;
      doc.title = 'SVG Image';

      const img = doc.createElement('img');
      img.src = base64;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';

      doc.body.style.margin = '0';
      doc.body.appendChild(img);
    }
  }}
/>
  ) : <p>图片加载失败</p>;
}


// export default function LocalSvgViewer({ filePath }: { filePath: string }) {
//   const [svgContent, setSvgContent] = useState('');

//   useEffect(() => {
//     if ((window as any).electronAPI?.loadSvgContent) {
//       const content = (window as any).electronAPI.loadSvgContent(filePath);
//       setSvgContent(content);
//     }
//   }, [filePath]);

//   const handleOpenExternally = () => {
//     if ((window as any).electronAPI?.openFileExternally) {
//       (window as any).electronAPI.openFileExternally(filePath);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center p-4">
//       <div
//         className="border rounded p-2"
//         style={{ maxHeight: '500px', overflow: 'auto' }}
//         dangerouslySetInnerHTML={{ __html: svgContent }}
//       />
//       <button
//         onClick={handleOpenExternally}
//         className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//       >
//         点击在新窗口中打开 📈
//       </button>
//     </div>
//   );
// }



export function ToolCalls({
  toolCalls,
  isTempToolCall = false,
}: {
  toolCalls: AIMessage["tool_calls"];
  isTempToolCall?: boolean; //默认是false
}) {
  const [isExpanded, setIsExpanded] = useState(isTempToolCall); 
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
                                    <SyntaxHighlighter language="python" className="text-sm"  wrapLongLines={true} >
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
                     <PicViewer base64={String(message.artifact)} />
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
