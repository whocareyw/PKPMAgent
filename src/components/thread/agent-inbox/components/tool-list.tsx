import { useState, useEffect } from 'react';
import { getTools, setEnabledToolsSet, getEnabledToolsSet } from '@/lib/model-config-api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Wrench, Zap, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

function ToolList() {
  const [toolSets, setToolSets] = useState<Record<string, Record<string, string>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabledSets, setEnabledSets] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchTools = async () => {
      const toolsResponse = await getTools();
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
  }, []);

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

  const renderToolsForSet = (tools: Record<string, string>) => (
    <ScrollArea className="h-[452px] w-flex pr-0">
      <div className="space-y-2">
        {Object.entries(tools).map(([toolName, description]) => (
          <div key={toolName} className="group p-2 rounded-lg border border-gray-200 bg-gray-100 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
            <div className="flex items-start gap-0">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-900 group-hover:text-blue-700 transition-colors break-all">
                  {toolName}
                </h4>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
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
          <div className="flex flex-col h-auto p-1 w-fit gap-2 bg-gray-100 border border-gray-200 rounded-md">
            {Object.entries(toolSets || {}).map(([setName, tools]) => (
              <div key={setName} className="flex items-center gap-2 text-sm px-1 py-1 w-full">
                <Switch 
                   checked={enabledSets[setName] || false}
                   onCheckedChange={(checked) => handleSetToggle(setName, checked as boolean)}
                   className="flex-shrink-0"
                 />
                <div 
                  onClick={() => setActiveTab(setName)}
                  className={`flex-1 text-left flex flex-col gap-1 justify-start h-auto py-1 cursor-pointer rounded px-1 transition-colors ${
                    activeTab === setName ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-mid text-gray-900 font-simibold"> 
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          type="button" 
          className="flex cursor-pointer items-center justify-center space-x-0 px-0 py-1 transition-all duration-200 ease-in-out hover:bg-gray-100"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
            <span className="text-sm font-semibold text-gray-600">
              🛠️ 管理
            </span> 
          </motion.button>
        {/* <Button variant="outline" className="text-gray-600 border-0 transition-all">
          
        </Button> */}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[200vh]">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-xl font-bold  flex items-center gap-2">
            🛠️ 工具管理 ：管理 PKPMMcp 工具集
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
        <div className="mt-0 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-mid text-gray-600 text-left">
                💡 使用左侧开关可以控制是否启用工具组          
              </p>
              <p className="text-mid text-gray-600 text-left">
                ✨ 明确场景，只启用必要的工具组可以提高执行的效率与准确性，并大幅降低Token消耗。
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">
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