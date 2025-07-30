import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, X } from "lucide-react";

const defaultModels: Model[] = [
  { id: "DeepSeek-V3-0324", Url: "https://api.deepseek.com"                            },
  { id: "Qwen3",            Url: "https://dashscope.aliyuncs.com/compatible-mode/v1/", },
  { id: "Kimi-K2",          Url: "https://api.moonshot.cn"                             },
  { id: "Gemini-2.5-Flash", Url: "https://generativelanguage.googleapis.com"           },
  { id: "Claude-4-Sonnet",  Url: "https://api.anthropic.com/"                          }
];

interface Model {
  id: string;
  Url: string;
}

interface ModelSelectProps {
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  availableModels?: Model[];
  className?: string;
}

export function ModelSelect({ 
  selectedModel: externalSelectedModel,
  onModelChange,
  availableModels = defaultModels,
  className = ""
}: ModelSelectProps) {
  const defaultSelectedModel = "DeepSeek-V3-0324";
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configModelId, setConfigModelId] = useState<string>("");
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const configRef = useRef<HTMLDivElement>(null);

  // 使用外部传入的selectedModel或内部状态
  const [selectedModel, setSelectedModel] = useState(externalSelectedModel ?? defaultSelectedModel);

  // 计算下拉菜单展开方向
  const calculateDropdownDirection = () => {
    if (!buttonRef.current) return 'down';
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = availableModels.length * 40 + 16; // 估算下拉菜单高度
    
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // 如果下方空间不足且上方空间充足，则向上展开
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      return 'up';
    }    
    return 'down';
  };

  
  const handleModelSelect = (modelId: string) => {
    if (onModelChange) {
      onModelChange(modelId);
    } 
    setSelectedModel(modelId);    
    setModelDropdownOpen(false);
  };

  const handleConfigClick = (modelId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Config button clicked for model:', modelId);
    setConfigModelId(modelId);
    setConfigDialogOpen(!configDialogOpen);
    console.log('Config dialog should be open:', true, 'for model:', modelId);
  };

  const toggleDropdown = () => {
    if (!modelDropdownOpen) {
      // 在打开下拉菜单前计算展开方向
      const direction = calculateDropdownDirection();
      setDropdownDirection(direction);
    }
    setModelDropdownOpen(!modelDropdownOpen);
  };

  return (
    <div className={`relative ${className}`} ref={modelDropdownRef}>
      <div className="flex items-center space-x-2">
        <motion.button
          ref={buttonRef}
          type="button" 
          onClick={toggleDropdown}
          className="flex cursor-pointer items-center justify-center space-x-2 px-2 py-1 text-gray-700 transition-all duration-200 ease-in-out hover:bg-gray-100"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1 }}
          whileTap={{ scale: 1 }}
        >
          <span className="text-sm font-semibold text-gray-600">
            {availableModels.find(m => m.id === selectedModel)?.id || "选择模型"}
          </span>
          <div className="w-4 h-4">
            {modelDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {modelDropdownOpen && (
          <motion.div
            className={`absolute ${dropdownDirection === 'up' ? 'bottom-full mb-4' : 'top-full mt-4'} -left-2 z-50 w-55 overflow-hidden rounded-lg border border-gray-200 bg-white`}
            initial={{ 
              opacity: 0, 
              y: dropdownDirection === 'up' ? 10 : -10, 
              scale: 0.95 
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              y: dropdownDirection === 'up' ? 10 : -10, 
              scale: 0.95 
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="py-1">
              {availableModels.map((model) => (
                <div key={model.id} className="flex items-center group relative">
                  <motion.button
                    type="button"
                    onClick={() => handleModelSelect(model.id)}
                    className={`flex-1 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-200 ${
                      selectedModel === model.id ? 'text-black font-bold' : 'text-gray-600'
                    }`}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                  >
                    {model.id}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={(e) => handleConfigClick(model.id, e)}
                    className="px-2 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ opacity: 1 }}
                  >
                    ⚙️
                  </motion.button>                
                 
                </div>
              ))}              
            </div>
          </motion.div>
        )}

        {/* 配置对话框 - 模态对话框 */}
        <AnimatePresence>
        {configDialogOpen && (
            <motion.div
                className="fixed inset-0 flex items-center justify-center"
                style={{ 
                    zIndex: 9999,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)' // 直接使用rgba设置50%透明度
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                // onClick={() => setConfigDialogOpen(false)}
            >
            <motion.div
                ref={configRef}
                className="w-120 bg-white rounded-lg border border-gray-200 shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
            >
                       
            <div className="p-3 space-y-2">
                 <div>
                    <label className="p-1 block text-bold font-bold text-gray-700 mb-2">
                        {configModelId}                       
                    </label>     
                </div>    
                <div>
                    <label className="block text-sm font-sm text-gray-700 mb-2">
                        * API 地址 (默认为官方地址，也可填入 硅基流动 等第三方服务商)                        
                    </label>            
                    <input
                        type="text"
                        defaultValue={availableModels.find(m => m.id === configModelId)?.Url}
                        placeholder="输入 API 地址（如：）"
                        className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>                           
                
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-sm text-gray-700">
                            * API 密钥
                        </label>
                        <a 
                            href="https://platform.openai.com/api-keys" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:text-blue-800 underline"
                        >
                            获取 API 密钥         
                        </a>
                    </div>
                    <input
                        type="password"
                        placeholder="输入 API 密钥"
                        className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>
            </div>
            
            <div className="flex items-right gap-2 p-3 border-t">
                <button                
                    type="button"
                    className="w-full bg-blue-400 text-white py-1 px-9 rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => setConfigDialogOpen(false)}
                >
                确定启用
                </button>

                 <button                
                    type="button"
                    className="w-full bg-green-400 text-white py-1 px-9 rounded-md hover:bg-green-700 transition-colors"
                    onClick={() => setConfigDialogOpen(false)}
                >
                检测连接
                </button>

                <button                
                    type="button"
                    className="w-full bg-gray-400 text-white py-1 px-9 rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => setConfigDialogOpen(false)}
                >
                取消
                </button>
            </div>
            </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

      </AnimatePresence>
    </div>
  );
}