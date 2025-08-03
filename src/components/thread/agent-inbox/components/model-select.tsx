import { useState, useEffect, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, X } from "lucide-react";

import { ModelConfig, getModelConfig, setModelConfig } from '@/lib/model-config-api';


interface ModelConfigEx extends ModelConfig {
  api_keys_url: string;
  ID_url: string;
}

interface ModelSelectProps {
  onModelChange?: (model: ModelConfigEx) => void;
  className?: string;
}

export function ModelSelect({ 
  onModelChange,
  className = ""
}: ModelSelectProps) {    
  const [availableModels, setAvailableModels] = useState<ModelConfigEx[]>([
      { name: "DeepSeek", 
          id: "deepseek-chat",
          url: "https://api.deepseek.com"                        , 
          api_key: '',
          api_keys_url: "https://platform.deepseek.com/api_keys" , 
          ID_url: "https://api-docs.deepseek.com/zh-cn/" },
      { name: "Qwen",                
          id: "qwen3-235b-a22b-instruct-2507",
          url: "https://dashscope.aliyuncs.com/compatible-mode/v1", 
          api_key: '',
          api_keys_url: "https://bailian.console.aliyun.com/?tab=model#/api-key",
          ID_url: "https://bailian.console.aliyun.com/?tab=doc#/api/?type=model&url=https%3A%2F%2Fhelp.aliyun.com%2Fdocument_detail%2F2840914.html%239f8890ce29g5u" },
      { name: "Kimi",                           
          id: "kimi-k2-0711-preview",
          url: "https://api.moonshot.cn/v1"                           , 
          api_key: '',
          api_keys_url: "https://platform.moonshot.cn/console/api-keys" ,
          ID_url: "https://platform.moonshot.cn/docs/introduction" },
      { name: "Gemini",                  
          id: "gemini-2.5-flash",
          url: "https://generativelanguage.googleapis.com/v1beta/openai/" , 
          api_key: '',
          api_keys_url: "https://aistudio.google.com/app/apikey" ,
          ID_url: "https://ai.google.dev/gemini-api/docs/models?hl=zh-cn" },
      { name: "GPT",                   
          id: "gpt-4.1",
          url: "https://api.openai.com"                        , 
          api_key: '',
          api_keys_url: "https://platform.openai.com/api-keys" ,
          ID_url: "https://platform.openai.com/docs/models" },
      ]);   
  // 获取模型配置（如果本地有配置会返回本地的，没有的话会保存传入的配置）
  const getModelConfigFromLocal = async () => {        
      const result = await getModelConfig(availableModels);
      if (result.data) {
        //遍历result.data，给availableModels中的每个模型添加api_key
          result.data.forEach((config) => {
              const modelIndex = availableModels.findIndex((m) => m.name === config.name);
              if (modelIndex !== -1) {
                  availableModels[modelIndex].api_key = config.api_key;                    
                  availableModels[modelIndex].id = config.id;                  
                  availableModels[modelIndex].url = config.url;
              }
          });    
          setAvailableModels([...availableModels]);
          console.error('获取模型配置成功:', result);
      } else if (result.error) {
          console.error('获取模型配置失败:', result.error);
      }        
  };  
  // 保存模型配置
  const setModelConfigToLocal = async () => {
      const result = await setModelConfig(availableModels);
      if (result.data) {
          console.log('保存模型配置成功:', result.data);
      } else if (result.error) {
          console.error('保存模型配置失败:', result.error);
      }
  }; 
  // 在组件初次加载时获取模型配置
  useEffect(() => {
    getModelConfigFromLocal();
  }, []);
            
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const [editingModel, setEditingModel] = useState(availableModels[0]);
  const handleFinishEditModel = () => {
    const modelIndex = availableModels.findIndex((m) => m.name === editingModel.name);
    if (modelIndex !== -1) {
      availableModels[modelIndex] = editingModel;
      setAvailableModels([...availableModels]);
      setModelConfigToLocal();
    }     
  };
  // availableModels改了，需要更新selectedModel
  useEffect(() => {
    const modelIndex = availableModels.findIndex((m) => m.name === editingModel.name);
    if (modelIndex !== -1) {
      setSelectedModel(availableModels[modelIndex]);
    }    
  }, [availableModels]);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const configRef = useRef<HTMLDivElement>(null);
          

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

  // 模型变化时触发
  const handleModelSelect = (model: ModelConfigEx) => {
    if (onModelChange) {
      onModelChange(model);
    } 
    setSelectedModel(model);    
    setModelDropdownOpen(false);
  };

  const handleConfigClick = (model: ModelConfigEx, event: React.MouseEvent) => {
    event.stopPropagation();
    // console.log('Config button clicked for model:', model.name);
    setEditingModel(model);
    setConfigDialogOpen(!configDialogOpen);
    // console.log('Config dialog should be open:', true, 'for model:', model.name);
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
            <div className="flex flex-col space-y-0 items-start">
                <span className="text-sm font-semibold text-gray-600">
                    {selectedModel.name}
                </span>            
                <span className="text-xs font-normal text-gray-400">
                    {selectedModel.id}
                </span>
            </div>
            <div className="w-4 h-4">
                {modelDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
        </motion.button>
      </div>

      <AnimatePresence key="dropdown">
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
                <div key={model.name} className="flex items-center group relative">
                  <motion.button
                    type="button"
                    onClick={() => handleModelSelect(model)}
                    className={`flex-1 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-200 ${
                      selectedModel.name === model.name ? 'text-black font-bold' : 'text-gray-600'
                    }`}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                  >
                    {model.name}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={(e) => handleConfigClick(model, e)}
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
        <AnimatePresence key="config-dialog">
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
                        {editingModel.name}          
                    </label>     
                </div>  

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-sm text-gray-700">
                            * 模型 ID                         
                        </label> 
                        <a 
                            href={editingModel.ID_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:text-blue-800 underline"
                        >
                            查询可选的模型ID       
                        </a>
                    </div>                             
                    <input
                        type="text"
                        value={editingModel.id}
                        onChange={(e) => setEditingModel({...editingModel, id: e.target.value})}
                        placeholder="输入模型 ID "
                        className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div> 
                
                <div>
                    <label className="block text-sm font-sm text-gray-700 mb-2">
                        * API 地址 (默认为官方地址，也可填入 硅基流动 等第三方服务商)                        
                    </label>            
                    <input
                        type="text"
                        value={editingModel.url}
                        onChange={(e) => setEditingModel({...editingModel, url: e.target.value})}
                        placeholder="输入 API 地址"
                        className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>                           
                
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-sm text-gray-700">
                            * API 密钥
                        </label>
                        <a 
                            href={editingModel.api_keys_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:text-blue-800 underline"
                        >
                            获取 API 密钥         
                        </a>
                    </div>
                    <input
                        type="text"
                        value={editingModel.api_key}
                        onChange={(e) => setEditingModel({...editingModel, api_key: e.target.value})}
                        placeholder="输入 API 密钥"
                        className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>
            </div>
            
            <div className="flex items-right gap-2 p-3 border-t">
                <button                
                    type="button"
                    className="w-full bg-blue-400 text-white py-1 px-9 rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() =>{handleFinishEditModel(); setConfigDialogOpen(false)}}
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