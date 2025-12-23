import React, { useState, useEffect, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  FilePlus,
  ChevronDown,
  Plus,
  ArrowUpDown,
  Search,
  PanelRightClose,
  PanelRightOpen,
  Play,
  File,
  Trash2,
  X,
  Loader2
} from "lucide-react";
import {
  getAllScripts,
  getScriptContent,
  saveScript,
  deleteScript,
  executeScript,
} from "../lib/model-config-api";
import { toast } from "sonner";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface ScriptFile {
  name: string;
}

export function CodeEditor() {
  // State
  const [files, setFiles] = useState<string[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>("");
  const [sidebarWidth, setSidebarWidth] = useState<number>(160); // Default 256px
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [outputHeight, setOutputHeight] = useState<number>(200);
  const [isResizingOutput, setIsResizingOutput] = useState<boolean>(false);

  const isPortrait = useMediaQuery("(orientation: portrait)");

  useEffect(() => {
    if (!isPortrait) {
      setIsSidebarVisible(true);
    }
    else{
      setIsSidebarVisible(false);
    }
  }, [isPortrait]);

  useEffect(() => {
    setNewFileName(currentFileName);
  }, [currentFileName]);

  // Load scripts on mount
  useEffect(() => {
    fetchScripts();
  }, []);

  // Handle Resize
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth > 150 && newWidth < 600) { // Min 150px, Max 600px
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  const startResizingOutput = useCallback(() => {
    setIsResizingOutput(true);
  }, []);

  const stopResizingOutput = useCallback(() => {
    setIsResizingOutput(false);
  }, []);

  const resizeOutput = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizingOutput) {
        const newHeight = window.innerHeight - mouseMoveEvent.clientY;
        if (newHeight > 50 && newHeight < window.innerHeight - 100) {
          setOutputHeight(newHeight);
        }
      }
    },
    [isResizingOutput]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    window.addEventListener("mousemove", resizeOutput);
    window.addEventListener("mouseup", stopResizingOutput);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      window.removeEventListener("mousemove", resizeOutput);
      window.removeEventListener("mouseup", stopResizingOutput);
    };
  }, [resize, stopResizing, resizeOutput, stopResizingOutput]);

  const fetchScripts = async () => {
    setIsLoading(true);
    const result = await getAllScripts();
    setIsLoading(false);
    if (result.data) {
      setFiles(result.data.scripts);
      // If no file selected and files exist, select the first one
      if (!currentFileName && result.data.scripts.length > 0) {
        selectFile(result.data.scripts[0]);
      }
    } else if (result.error) {
      toast.error(`Failed to load scripts: ${result.error}`);
    }
  };

  const selectFile = async (fileName: string, shouldSave = true) => {
    // Auto-save current file before switching
    if (shouldSave && currentFileName) {
      await saveScript({ script_name: currentFileName, content: code });
    }
    
    setIsLoading(true);
    const result = await getScriptContent({ script_name: fileName });
    setIsLoading(false);

    if (result.data) {
      setCurrentFileName(fileName);
      setNewFileName(fileName);
      setCode(result.data.content);
      setOutput(""); // Clear output on file switch
    } else if (result.error) {
      toast.error(`Failed to load script ${fileName}: ${result.error}`);
    }
  };

  const handleCreateNew = async () => {
    const baseName = "untitled";
    let name = `${baseName}.py`;
    let counter = 1;
    while (files.includes(name)) {
      name = `${baseName}_${counter}.py`;
      counter++;
    }

    const result = await saveScript({ script_name: name, content: "" });
    if (result.data) {
      toast.success(`Created ${name}`);
      await fetchScripts();
      selectFile(name);
    } else if (result.error) {
      toast.error(`Failed to create script: ${result.error}`);
    }
  };

  const handleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleDelete = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    if (!confirm(`确定删除 ${fileName}?`)) return;

    const result = await deleteScript({ script_name: fileName });
    if (result.data) {
      toast.success(`Deleted ${fileName}`);
      const newFiles = files.filter(f => f !== fileName);
      setFiles(newFiles);
      if (currentFileName === fileName) {
        setCurrentFileName("");
        setCode("");
        if (newFiles.length > 0) {
          selectFile(newFiles[0], false);
        }
      }
    } else if (result.error) {
      toast.error(`Failed to delete script: ${result.error}`);
    }
  };

  const handleSave = async (showToast: boolean | any = true) => {
    if (!currentFileName) return;
    const shouldShowToast = typeof showToast === 'boolean' ? showToast : true;
    // If name changed, it's a rename (save new + delete old)
    if (newFileName !== currentFileName) {
       // Validate new name
       if (!newFileName.endsWith(".py")) {
         toast.error("File name must end with .py");
         return;
       }
       
       // Save new
       const saveResult = await saveScript({ script_name: newFileName, content: code });
       if (saveResult.error) {
         toast.error(`Failed to save as ${newFileName}: ${saveResult.error}`);
         return;
       }
       
       // Delete old
       const deleteResult = await deleteScript({ script_name: currentFileName });
       if (deleteResult.error) {
          toast.warning(`Saved new file but failed to delete old file: ${deleteResult.error}`);
       }

       setCurrentFileName(newFileName);
       setFiles((prev) => prev.map(f => f === currentFileName ? newFileName : f));
       toast.success("File renamed and saved");
    } else {
       // Just save content
       const result = await saveScript({ script_name: currentFileName, content: code });
       if (result.data) {
        if (shouldShowToast) {
         toast.success("Saved");
        }
       } else if (result.error) {
         toast.error(`Failed to save: ${result.error}`);
       }
    }
  };

  // Ref to access latest handleSave in editor command
  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        handleSaveRef.current();
    });
  };

  const handleRun = async () => {
    if (!currentFileName) return;
    
    // Auto-save before run
    await handleSave(false);

    setIsRunning(true);
    setOutput("Running...");
    const result = await executeScript({ script_name: currentFileName, content: code });
    setIsRunning(false);

    if (result.data) {
        // The API returns the result directly, usually stdout?
        // Let's check the API implementation again. 
        // The python side returns "result" which is PythonExecutor(content).
        // Assuming PythonExecutor returns a string or an object. 
        // If it returns an object, we might need to stringify it.
        const outputData = result.data;
        if (typeof outputData === 'string') {
            setOutput(outputData);
        } else {
            setOutput(JSON.stringify(outputData, null, 2));
        }
    } else if (result.error) {
      setOutput(`Error: ${result.error}\nDetails: ${result.details || ''}`);
    }
  };

  // Filter and Sort files
  const filteredFiles = files
    .filter((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      return sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a);
    });

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      {isSidebarVisible && (
        <div 
            style={{ width: sidebarWidth }}
            className="flex-shrink-0 border-r bg-muted/20 flex flex-col relative"
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-center h-10 px-2 border-b">
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateNew}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                title="新建 (New)"
              >
                <FilePlus className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleSort}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                title="排序 (Sort)"
              >
                <ArrowUpDown className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                className={`p-2 hover:bg-accent rounded-md transition-colors ${isSearchVisible ? 'bg-accent' : ''}`}
                title="搜索 (Search)"
              >
                <Search className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {isSearchVisible && (
            <div className="p-2 border-b">
              <div className="relative">
                 <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                 />
                 {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </button>
                 )}
              </div>
            </div>
          )}

          {/* File List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading && files.length === 0 ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="text-xs text-center text-muted-foreground p-4">
                    No scripts found
                </div>
            ) : (
                filteredFiles.map((file) => (
                <div
                    key={file}
                    onClick={() => selectFile(file)}
                    className={`group flex items-center justify-between px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
                    currentFileName === file
                        ? "bg-[rgb(31,154,236)] text-white"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                    <File className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{file}</span>
                    </div>
                    <button
                        onClick={(e) => handleDelete(e, file)}
                        className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all ${
                             currentFileName === file ? "text-white hover:bg-primary/20" : "text-muted-foreground hover:bg-primary/20 hover:text-accent-foreground"
                        }`}
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
                ))
            )}
          </div>
          
          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
            onMouseDown={startResizing}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-10 border-b flex items-center justify-between px-2 bg-background">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              className="p-1.5 hover:bg-accent rounded-md text-foreground transition-colors"
              title={isSidebarVisible ? "隐藏目录" : "显示目录"}
            >
              {isSidebarVisible ? (
                <PanelRightClose className="h-4.5 w-4.5" />
              ) : (
                <PanelRightOpen className="h-4.5 w-4.5" />
              )}
            </button>
            
            {/* File Name Input */}
            <div className="relative flex-1 w-45 group">
                {isDropdownOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                )}
                <div className={`flex items-center w-full max-w-[350px] border rounded-md transition-all ${
                    isDropdownOpen ? 'border-ring ring-1 ring-ring' : 'border-transparent hover:border-border focus-within:border-ring focus-within:ring-1 focus-within:ring-ring'
                }`}>
                    <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur(); // Trigger onBlur to save
                                setIsDropdownOpen(false);
                            }
                        }}
                        className="flex-1 px-2 py-1 text-sm bg-transparent border-none focus:outline-none rounded-l-md transition-all font-medium min-w-0"
                        placeholder="请新建脚本 Add new script"
                        disabled={!currentFileName}
                    />
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="px-2 py-1 text-muted-foreground hover:text-foreground focus:outline-none"
                        tabIndex={-1}
                    >
                        <ChevronDown className="h-5 w-5" />
                    </button>                    
                </div>                
                
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full max-w-[350px] mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto py-1">
                        {files.length > 0 ? (
                            files.map((file) => (
                                <div
                                    key={file}
                                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                                    onClick={() => {
                                        selectFile(file);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 ${
                                        currentFileName === file ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                                    }`}
                                >
                                    <File className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="truncate">{file}</span>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                                No files
                            </div>
                        )}
                     
                    </div>
                )}
            </div>
            
            {/* <div className="h-[1px] bg-border my-0" /> */}
            <div className="flex items-center gap-2 ml-0">
              <button
                  // onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                      handleCreateNew();
                      setIsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1 px-1.5 py-1.5 text-xs font-medium rounded-md transition-colors bg-[rgb(31,154,236)] text-white hover:bg-[rgba(0,118,253,1)]`}
                  title="新建脚本"
                  // className="px-3 py-1.5 text-sm cursor-pointer hover:bg-accent/50 flex items-center gap-2 text-blue-500"
              >
                  <Plus className="h-4 w-4" strokeWidth={3} />
                  {/* <span>新建 py 文件...</span> */}              
              </button>
            </div>

          </div>

          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={handleRun}
              disabled={isRunning || !currentFileName}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isRunning 
                ? "bg-muted text-muted-foreground cursor-not-allowed" 
                : "bg-[rgb(31,154,236)] text-white hover:bg-[rgba(0,118,253,1)]"
              }`}
              title="运行脚本 (Run Script)"
            >
              {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
              Run
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative min-h-0">
            {currentFileName ? (
                 <Editor
                    height="100%"
                    defaultLanguage="python"
                    value={code} // Use value instead of defaultValue for controlled component
                    theme="vs-light" // Use vs-light or vs-dark based on preference
                    onChange={(value) => setCode(value || "")}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        lineNumbersMinChars: 3,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: "on",
                        padding: { top: 10, bottom: 10 }
                    }}
                />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm text-center gap-1">
                    <div>请新建一个 Python 脚本开始编辑</div>
                    <div>Create a script to start editing</div>
                </div>
            )}
         
        </div>

        {/* Output Area */}
        <div 
            style={{ height: outputHeight }}
            className="border-t bg-muted/10 flex flex-col relative"
        >
            {/* Resize Handle */}
            <div
                className="absolute left-0 right-0 top-0 h-1 cursor-row-resize hover:bg-primary/50 transition-colors z-10"
                onMouseDown={startResizingOutput}
            />
            <div className="px-3 py-1.5 border-t bg-muted/50 text-xs font-medium text-muted-foreground flex justify-between items-center">
                <button 
                    onClick={() => setOutput("")}
                    className="hover:text-foreground transition-colors"
                >
                    Clear
                </button>
            </div>
            <div className="flex-1 overflow-auto bg-muted/50 p-3 font-mono text-sm whitespace-pre-wrap">
                {(() => {
                    if (!output) return <span className="text-muted-foreground italic">No output</span>;
                    try {
                        const parsed = JSON.parse(output);
                        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                            return (
                                <div className="flex flex-col gap-4">
                                    {Object.entries(parsed).map(([key, value]) => (
                                        <div key={key}>
                                            <div className="font-bold text-[rgb(31,154,236)] mb-1">{key}</div>
                                            <div className="whitespace-pre-wrap pl-2 border-l-2 border-muted-foreground/20">
                                                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        }
                    } catch (e) {
                        // ignore
                    }
                    return output;
                })()}
            </div>
        </div>
      </div>
    </div>
  );
}

