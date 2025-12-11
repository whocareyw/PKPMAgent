import React from "react";
import { MessageSquare, Code, Database, Settings, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type TabId = "chat" | "editor" | "knowledge";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: "chat", icon: <MessageSquare className="h-5 w-5" />, label: "Chat" },
    { id: "editor", icon: <Code className="h-5 w-5" />, label: "python脚本" },
    { id: "knowledge", icon: <Database className="h-5 w-5" />, label: "知识库" },
  ];

  return (
    <div className="flex h-screen w-[40px] flex-col items-center border-r bg-muted/40 py-2.5">
      {/* <div className="mb-4"> */}
        {/* Logo or Top Icon placeholder */}
        {/* <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            P
        </div> */}
      {/* </div> */}
      
      <div className="flex flex-1 flex-col gap-2 w-full px-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-md",
              activeTab === tab.id ? "bg-[rgb(31,154,236)] text-white hover:bg-[rgb(31,154,236)]" : "text-muted-foreground hover:bg-muted"
            )}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
          >
            {tab.icon}
          </Button>
        ))}
      </div>

      {/* <div className="mt-auto flex flex-col gap-2 w-full px-2">
        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground">
            <Settings className="h-5 w-5" />
        </Button>
      </div> */}
    </div>
  );
}
