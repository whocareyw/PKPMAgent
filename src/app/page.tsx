"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import React, { useState } from "react";
import { Sidebar, TabId } from "@/components/layout/Sidebar";
import { CodeEditor } from "@/components/CodeEditor";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

function MainLayout() {
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const isPortrait = useMediaQuery("(orientation: portrait)");

  return (
    <div className={cn("flex h-screen w-full overflow-hidden bg-background", isPortrait ? "flex-col" : "flex-row")}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 h-full overflow-hidden relative">
        <div className={activeTab === "chat" ? "block h-full w-full" : "hidden"}>
             <Thread />
        </div>
        <div className={activeTab === "editor" ? "block h-full w-full" : "hidden"}>
          <CodeEditor />
        </div>
        <div className={activeTab === "knowledge" ? "block h-full w-full" : "hidden"}>
          <KnowledgeBase />
        </div>
      </main>
    </div>
  );
}

export default function DemoPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <ThreadProvider>
        <StreamProvider>
          <ArtifactProvider>
            <MainLayout />
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
