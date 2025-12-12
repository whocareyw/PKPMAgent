import React from "react";
import { MessageSquare, Code, Book, Settings, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export type TabId = "chat" | "editor" | "knowledge";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const isPortrait = useMediaQuery("(orientation: portrait)");

  const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: "chat", icon: <MessageSquare className="size-5" />, label: "Chat" },
    { id: "editor", icon: <Code className="size-5" />, label: "Python" },
    { id: "knowledge", icon: <BookOpen className="size-5" />, label: "知识库" },
  ];

  return (
    <div
      className={cn(
        "flex bg-muted/40 items-center",
        isPortrait
          ? "h-[41px] w-full flex-row border-b px-2"
          : "h-screen w-[41px] flex-col border-r pt-2 pb-2.5"
      )}
    >
      {/* <div className="mb-4"> */}
        {/* Logo or Top Icon placeholder */}
        {/* <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            P
        </div> */}
      {/* </div> */}
      
      <div
        className={cn(
          "flex flex-1 gap-2",
          isPortrait ? "flex-row w-full items-center" : "flex-col w-full p-0 px-0 pt-0 pb-2 pl-1"
        )}
      >
        {tabs.map((tab) => (
          <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-8 w-8 flex-col p-1 gap-0.5 rounded-none",
                  activeTab === tab.id
                    ? "text-[rgb(31,154,236)] font-bold bg-transparent hover:bg-transparent hover:text-[rgb(31,154,236)] "
                    : "hover:bg-gray-200 ]"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isPortrait ? "bottom" : "right"}>
              <p>{tab.label}</p>
            </TooltipContent>
          </Tooltip>
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
