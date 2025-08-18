import { useState, useEffect } from 'react';
import { getTools } from '@/lib/model-config-api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Wrench, Zap, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

function ToolList() {
  const [toolSets, setToolSets] = useState<Record<string, Record<string, string>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabledSets, setEnabledSets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchTools = async () => {
      const response = await getTools();
      console.log('你好，我是工具列表', response);
      if (response.error) {
        setError(response.error);
      } else {
        setToolSets(response.data || null);
        // 初始化所有工具集为启用状态
        if (response.data) {
          const initialEnabled: Record<string, boolean> = {};
          Object.keys(response.data).forEach(setName => {
            initialEnabled[setName] = true;
          });
          setEnabledSets(initialEnabled);
        }
      }
    };
    fetchTools();
  }, []);

  const handleSetToggle = (setName: string, checked: boolean) => {
    setEnabledSets(prev => ({
      ...prev,
      [setName]: checked
    }));
  };

  const renderToolsForSet = (tools: Record<string, string>) => (
    <ScrollArea className="h-[432px] w-flex pr-0">
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
    <Tabs defaultValue={Object.keys(toolSets || {})[0]} className="w-full" orientation="vertical">
      <div className="flex gap-2">
        <div className="w-fit flex-shrink-0">
          <TabsList className="flex flex-col h-auto p-1 w-fit gap-3 bg-gray-100 border border-gray-200">
            {Object.entries(toolSets || {}).map(([setName, tools]) => (
               <TabsTrigger key={setName} value={setName} className="flex items-center gap-2 text-sm px-1 py-1 w-full justify-start">                
                <Switch 
                   checked={enabledSets[setName] || false}
                   onCheckedChange={(checked) => handleSetToggle(setName, checked as boolean)}
                   onClick={(e) => e.stopPropagation()}
                   className="flex-shrink-0"
                 />
                <span className="flex-1 text-left flex flex-col gap-1">
                  <span className="text-mid text-gray-900 font-simibold"> 
                    {setName.split('_')[0]}
                  </span>
                  <span className="text-xs text-gray-500">{setName.split('_')[1]}</span>
                  {/* :{Object.keys(tools).length} */}
                </span>               
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="flex-1">
          {Object.entries(toolSets || {}).map(([setName, tools]) => (
            <TabsContent key={setName} value={setName} className="mt-0">
              {/* <div className="mb-3 flex items-center gap-2">
                {getIconForToolSet(setName)}
                <h3 className="text-lg font-semibold text-gray-800">{setName}</h3>
                <Badge variant="outline" className="ml-auto">
                  {Object.keys(tools).length} tools
                </Badge>
              </div> */}
              {renderToolsForSet(tools)}
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          type="button" 
          className="flex cursor-pointer items-center justify-center space-x-0 px-0 py-1 transition-all duration-200 ease-in-out hover:bg-gray-100"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
            <span className="text-mid font-semibold text-gray-600">
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
          <p className="text-mid text-gray-600 text-left">
            💡 使用左侧开关可以控制是否启用工具组          
          </p>
          <p className="text-mid text-gray-600 text-left">
            ✨ 明确场景，只启用必要的工具组可以提高执行的效率与准确性，并大幅降低Token消耗。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ToolList;