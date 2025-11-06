import { useState, useEffect, useRef } from 'react';
import { getTools, setEnabledToolsSet, getEnabledToolsSet, getAutoToolsSelectionMode, setAutoToolsSelectionMode } from '@/lib/model-config-api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Wrench, Zap, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function ToolList() {
  const [toolSets, setToolSets] = useState<Record<string, Record<string, string>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabledSets, setEnabledSets] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [autoMode, setAutoMode] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);  
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');

  useEffect(() => {
    if (open) {
      const fetchTools = async () => {
        setToolSets(null); // 重置工具集，显示加载状态
        const toolsResponse = await getTools();
        // console.log('获取工具组成功');
        if (toolsResponse.error) {
          setError(toolsResponse.error);
          return;
        }
        setToolSets(toolsResponse.data || null);
        if (toolsResponse.data) {
          const firstKey = Object.keys(toolsResponse.data)[0];
          if (firstKey) {
            setActiveTab(firstKey);
          }
        }
      };
      fetchTools();
    }
  }, [open]);

  useEffect(() => {
    const fetchEnabled = async () => {
      if (!open || !toolSets) return;
      const enabledResponse = await getEnabledToolsSet();
      if (enabledResponse.error) {
        console.warn('获取启用工具组失败:', enabledResponse.error);
        const initialEnabled: Record<string, boolean> = {};
        Object.keys(toolSets).forEach(setName => {
          initialEnabled[setName] = true;
        });
        setEnabledSets(initialEnabled);
      } else {
        console.log('获取启用工具组成功:', enabledResponse.data);
        const enabledList = enabledResponse.data?.enabled_tools_set || [];
        const enabledState: Record<string, boolean> = {};
        Object.keys(toolSets).forEach(setName => {
          enabledState[setName] = enabledList.includes(setName);
        });
        setEnabledSets(enabledState);
      }
    };
    fetchEnabled();
  }, [open, toolSets]);

  // 初始化自动模式状态
  useEffect(() => {
    const initAutoMode = async () => {
      const res = await getAutoToolsSelectionMode();
      if (res.data && typeof res.data.selection_mode === 'boolean') {
        setAutoMode(res.data.selection_mode);
      }
    };
    initAutoMode();
  }, []);

  // 点击外部区域时关闭下拉菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSetToggle = (setName: string, checked: boolean) => {
    setEnabledSets(prev => ({
      ...prev,
      [setName]: checked
    }));
  };

  const handleConfirm = async () => {
    const enabledToolsList = Object.entries(enabledSets)
      .filter(([_, enabled]) => enabled)
      .map(([setName, _]) => setName);
    
    const response = await setEnabledToolsSet(enabledToolsList);
    if (response.error) {
      console.error('设置启用工具组失败:', response.error);
      // 这里可以添加错误提示
    } else {
      console.log('工具组设置成功:', response.data?.message);
      // 这里可以添加成功提示
    }
    setOpen(false);
  };

  const handleSelectAutoMode = async () => {
    setAutoMode(true);
    setMenuOpen(false);
    const res = await setAutoToolsSelectionMode(true);
    if (res.error) {
      console.warn('设置自动模式失败:', res.error);
    }
  };

  const handleSelectManualMode = async () => {
    setAutoMode(false);
    setMenuOpen(false);
    const res = await setAutoToolsSelectionMode(false);
    if (res.error) {
      console.warn('关闭自动模式失败:', res.error);
    }
  };

  const handleOpenSkillsDialog = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setMenuOpen(false);
    setOpen(true);
  };

  const renderToolsForSet = (tools: Record<string, string>) => (
    <ScrollArea className="h-[387px] w-flex pr-0">
      <div className="space-y-2">
        {Object.entries(tools).map(([toolName, description]) => (
          <div key={toolName} className="group p-1.5 rounded-md border border-gray-150 bg-gray-50 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-600 transition-all duration-200 ">
            <div className="flex items-start gap-0">
              <div className="flex-1">
                <p className="text-sm text-gray-900 group-hover:text-blue-600 transition-colors break-all">
                  {toolName}
                </p>
                <p className="text-xs text-gray-600 mt-0 leading-relaxed break-all">
                  {description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  const toolContent = (
    <div className="w-full">
      <div className="flex gap-2">
        <div className="w-fit flex-shrink-0">
          <div className="flex flex-col h-auto p-0 w-fit gap-0 bg-gray-50 border border-gray-150 rounded-md">
            {Object.entries(toolSets || {}).map(([setName, tools]) => (
              <div key={setName} className="flex items-center gap-1 text-sm px-1 py-1 w-full">
                <Switch 
                   checked={enabledSets[setName] || false}
                   onCheckedChange={(checked) => handleSetToggle(setName, checked as boolean)}
                   className="flex-shrink-0"
                 />
                <div 
                  onClick={() => setActiveTab(setName)}
                  className={`flex-1 text-left flex flex-col gap-0 justify-start h-auto py-0.5 cursor-pointer rounded px-2 transition-colors ${
                    activeTab === setName ? 'bg-blue-100 border border-blue-150' : 'hover:bg-gray-150'
                  }`}
                >
                  <span className="text-sm text-gray-900"> 
                    {setName.split('_')[0]}
                  </span>
                  <span className="text-xs text-gray-500">{setName.split('_')[1]}</span>
                  {/* :{Object.keys(tools).length} */}
                </div>               
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          {activeTab && toolSets && toolSets[activeTab] && (
            <div className="mt-0">
              {renderToolsForSet(toolSets[activeTab])}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // 计算下拉菜单展开方向
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calculateDropdownDirection = () => {
    if (!buttonRef.current) return 'down';
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // 估算下拉菜单高度
    
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // 如果下方空间不足且上方空间充足，则向上展开
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      return 'up';
    }    
    return 'down';
  };

  
  const toggleDropdown = () => {
    if (!menuOpen) {
      // 在打开下拉菜单前计算展开方向
      const direction = calculateDropdownDirection();
      // console.log(direction)
      setDropdownDirection(direction);
    }
    setMenuOpen(!menuOpen);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* 下拉触发器：替换原先的 DialogTrigger 按钮 */}
      <div ref={dropdownRef} className="relative inline-block">
        <motion.button        
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          className="flex cursor-pointer items-center justify-center space-x-1 px-2 py-1 text-gray-700 transition-all duration-200 ease-in-out hover:bg-gray-100"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* <span className="text-mid"></span> */}
          <span className="text-sm font-semibold text-gray-600">
            {autoMode ? '技能: 🔄Auto' : '技能: 🛠️自选'}
          </span>
          <div className="w-4 h-4">
              {menuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </motion.button>
        {menuOpen && (
            <motion.div
              className={`absolute ${dropdownDirection === 'up' ? 'bottom-full mb-4' : 'top-full mt-4'} -left-2 z-50 w-65 overflow-hidden rounded-lg border border-gray-200 bg-white`}
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
              {/* <div className="flex items-center group relative"> */}
                <button
                  className={`flex-1 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-200 ${
                        autoMode ? 'text-black font-bold' : 'text-gray-600'}`}
                  onClick={handleSelectAutoMode}
                >
                  <span>🔄Auto:根据任务自动配置技能</span>
              </button>
              {/* </div> */}
              <div className="flex items-center group relative">
                <button  
                  className={`flex-1 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-200 ${
                      !autoMode ? 'text-black font-bold' : 'text-gray-600'}`}
                  onClick={handleSelectManualMode}>
                  🛠️自选:手动配置技能(Tool)
                </button>                
                <motion.button
                      type="button"
                      onClick={handleOpenSkillsDialog}
                      className="px-2 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ opacity: 1 }}
                    >
                      ⚙️
                </motion.button>   
            </div>
          </motion.div>
        )}
      </div>
      <DialogContent className="sm:max-w-[500px] max-h-[150vh]">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-mid font-bold  flex items-center gap-2">
            🛠️ 为 PKPMAgent 开启/关闭 技能(Tools)
          </DialogTitle>          
        </DialogHeader>
        {error ? (
          <div className="flex items-center gap-0 p-0 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            Error: {error}
          </div>
        ) : !toolSets ? (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading tools...</span>
          </div>
        ) : (
          toolContent
        )
        }
        <div className="mt-0 -mb-2 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xl text-gray-600 text-left">
                ✨      
            </p>
            <div className="flex-1">
              {/* <p className="text-sm text-gray-600 text-left">
                💡 使用左侧开关可以控制是否启用工具组          
              </p> */}
              <p className="text-sm text-gray-600 text-left">
                只启用必要的工具(Tools)可以提高效率与准确性，大幅降低Token消耗。
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <Button onClick={handleConfirm} className="bg-[rgb(31,154,236)] hover:bg-blue-600 text-white">
                确定
              </Button>
            </div>
          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}

export default ToolList;



// // 初次加载时获取已启用的工具组，用于 Tooltip 展示
// useEffect(() => {
//   const fetchInitialEnabled = async () => {
//     const enabledResponse = await getEnabledToolsSet();
//     if (enabledResponse.error) {
//       // 初次加载失败则保持为空即可
//       return;
//     }
//     const enabledList = enabledResponse.data?.enabled_tools_set || [];
//     const initialEnabled: Record<string, boolean> = {};
//     enabledList.forEach((name) => {
//       initialEnabled[name] = true;
//     });
//     setEnabledSets(initialEnabled);
//   };
//   fetchInitialEnabled();
// }, []);
{/* <TooltipProvider>
  <Tooltip>
    <DialogTrigger asChild>
    <TooltipTrigger asChild>    

      <motion.button
        type="button" 
        className="flex cursor-pointer items-center justify-center space-x-1 px-0 py-1 transition-all duration-200 ease-in-out hover:bg-gray-100"
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
          <span className="text-mid font-semibold text-gray-600">
            🛠️
          </span>
          <span className="text-sm font-semibold text-gray-600">
            技能管理
          </span> 
        </motion.button>
  
    </TooltipTrigger>
    </DialogTrigger>
    <TooltipContent side="bottom">
      {(() => {
        const enabledGroupNames = Object.entries(enabledSets)
          .filter(([, enabled]) => enabled)
          .map(([name]) => name);
        if (enabledGroupNames.length === 0) {
          return (
            <p className="text-xs">暂无启用的工具组</p>
          );
        }
        return (
          <div className="max-w-[280px]">                    
            <div className="flex flex-wrap gap-1">
              {enabledGroupNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-md bg-gray-50 px-2 py-[2px] text-[11px] text-gray-700"
                >
                  <span>{name.split('_')[0]}</span>                          
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </TooltipContent>
  </Tooltip>
</TooltipProvider> */}