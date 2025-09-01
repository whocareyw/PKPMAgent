import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Copy, CopyCheck } from "lucide-react";
import { SyntaxHighlighter } from "@/components/thread/syntax-highlighter";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

// 通用的图片复制hook
function useImageCopy() {
  const [copied, setCopied] = useState(false);
  
  const copyImageToClipboard = async (imageSource: string, isBase64: boolean = false) => {
    try {
      // 检查浏览器支持
      if (!navigator.clipboard || !window.ClipboardItem) {
        if (isBase64) {
          const link = document.createElement('a');
          link.href = imageSource;
          link.download = 'image.png';
          link.click();
        } else {
          await navigator.clipboard.writeText(imageSource);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        return;
      }
      
      let blob: Blob;
      
      if (isBase64) {
        // Base64图片处理 - 使用Canvas方式
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageSource;
        });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/png');
        });
      } else {
        // HTTP URL图片处理 - 使用Canvas方式避免跨域问题
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageSource;
        });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/png');
        });
      }
      
      const item = new ClipboardItem({ [blob.type || 'image/png']: blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
    } catch (error) {
      console.error('复制图片失败:', error);
      // 降级到复制文本
      try {
        await navigator.clipboard.writeText(imageSource);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (textError) {
        console.error('复制文本也失败:', textError);
        // 显示错误提示
        alert('复制失败，请手动右键保存图片');
      }
    }
  };
  
  return { copied, copyImageToClipboard };
}


export default function PicViewer({ base64 }: { base64: string }) {
  const { copied, copyImageToClipboard } = useImageCopy();

  return base64 ? (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        src={base64}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <button
        onClick={() => copyImageToClipboard(base64, true)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.14)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: '0.8',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.opacity = '0.8';
        }}
        title="复制图片到剪贴板"
      >
        {copied ? <CopyCheck size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>
    </div>
  ) : <p>图片加载失败</p>;
}

export function LocalSvgViewer({ imagePath }: { imagePath: string }) {
  const { copied, copyImageToClipboard } = useImageCopy();
  
  if (!imagePath) {
    return <p>图片路径无效</p>;
  }

  const port = window.location.port;
  const encodedPath = encodeURIComponent(imagePath);
  const httpUrl = `http://localhost:${port}/localfile/${encodedPath}`;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        src={httpUrl}
        alt="Local Image"
        style={{ 
          maxWidth: '100%', 
          height: 'auto'
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.setAttribute('style', 'display: block;');
        }}
      />
      <button
        onClick={() => copyImageToClipboard(httpUrl, false)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.14)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: '0.8',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.opacity = '0.8';
        }}
        title="复制图片到剪贴板"
      >
        {copied ? <CopyCheck size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>
      <p style={{ display: 'none', color: '#666', fontSize: '14px' }}>
        无法显示图片: {imagePath}
      </p>
    </div>
  );
}



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
            className="w-full overflow-hidden rounded-lg border border-gray-100"
          >            
            {/* <div className="border-b border-gray-50 bg-gray-50 px-2 py-1">
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
            </div> */}
            <motion.div
              className="rounded-lg border border-gray-100 bg-gray-50"
              initial={false}
              animate={{ backgroundColor: isExpanded ? "rgb(249 250 251)" : "rgb(249 250 251)" }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full cursor-pointer items-center justify-between px-2 py-1 text-left text-gray-700 transition-all duration-200 ease-in-out hover:bg-gray-100"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1 }}
                whileTap={{ scale: 1 }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-md">🛠️</span>
                  <span className="font-bold text-sm">Tool Calling...</span>
                  <span className="font-medium text-sm">{tc.name}</span>
                </div>
                <motion.div
                  initial={false}
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </motion.button>
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
      <div className="overflow-hidden rounded-lg border border-gray-100">
        {/* <div className="border-b border-gray-50 bg-gray-50 px-2 py-1">
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
        </div> */}
       <motion.div
          className="rounded-lg border border-gray-100 bg-gray-50"
          initial={false}
          animate={{ backgroundColor: isExpanded ? "rgb(249 250 251)" : "rgb(249 250 251)" }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full cursor-pointer items-center justify-between px-2 py-1 text-left text-gray-700 transition-all duration-200 ease-in-out hover:bg-gray-100"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1 }}
            whileTap={{ scale: 1 }}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-md">🛠️</span>
              <span className="font-bold text-sm">Tool Result ：</span>
              <span className="font-medium text-sm">{message.name}</span>
            </div>
            <motion.div
              initial={false}
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.button>
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
                     {/* <PicViewer base64={String(message.artifact)} /> */}
                    <LocalSvgViewer imagePath={String(message.content)} />                     
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
        </motion.div>
      </div>
    </div>
  );
}
