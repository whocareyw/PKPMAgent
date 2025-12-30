import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect, useCallback, useState, type MouseEvent } from "react";
import { useStreamContext } from "@/providers/Stream";
import { getContentString } from "../utils";
import { useQueryState, parseAsBoolean } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRightOpen, PanelRightClose, Trash2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function ThreadList({
  threads,
  onThreadClick,
  width,
  onDeleteThread,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
  width: number;
  onDeleteThread: () => void;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");
  const Stream = useStreamContext();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    await Stream.client.threads.delete(deleteId);
    if (deleteId === threadId) {
      setThreadId(null);
    }
    onDeleteThread();
    setDeleteId(null);
  };

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        let itemText = "Latest Chat(最新聊天)" //t.thread_id;
        if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        return (
          <div
            key={t.thread_id}
            className="group relative w-full px-1"
          >
            <Button
              variant="ghost"
              className="items-start justify-start text-left font-normal pr-8"
              style={{ width: `${width - 10}px` }}
              onClick={(e: MouseEvent<HTMLButtonElement>)  => {
                e.preventDefault();
                onThreadClick?.(t.thread_id);
                if (t.thread_id === threadId) return;
                setThreadId(t.thread_id);
              }}
            >
              <p className="truncate text-ellipsis">{itemText}</p>
            </Button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDeleteId(t.thread_id);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:bg-primary/20 hover:text-accent-foreground mr-0"
              title="Delete"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        );
      })}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="删除对话？"
        description="确定要删除对话吗？此操作无法撤销。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        autoFocus="confirm"
      />
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="h-10 w-[280px]"
        />
      ))}
    </div>
  );
}

export default function ThreadHistory({ width }: { width: number }) {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  const refreshThreads = useCallback(() => {
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, [getThreads, setThreads, setThreadsLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    refreshThreads();
  }, [refreshThreads]);

  return (
    <>
      <div 
        className="shadow-inner-right hidden h-screen shrink-0 flex-col items-start justify-start gap-6 border-r-[1px] border-slate-300 lg:flex"
        style={{ width }}
      >
        <div className="flex w-full items-center justify-between p-2">
          <Button
            size="icon"
            className={"hover:bg-gray-200 w-8 h-8 rounded-md"}
            variant="ghost"
            onClick={() => setChatHistoryOpen((p) => !p)}
          >
            {chatHistoryOpen ? (
              <PanelRightOpen className="size-5" />
            ) : (
              <PanelRightClose className="size-5" />
            )}
          </Button>
          <h1 className="text-lg font-semibold mr-1">
            历史记录
          </h1>
        </div>
        {threadsLoading ? (
          <ThreadHistoryLoading />
        ) : (
          <ThreadList threads={threads} width={width} onDeleteThread={refreshThreads} />
        )}
      </div>
      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent
            side="left"
            className="flex lg:hidden"
            style={{ width }}
          >
            <SheetHeader>
              <SheetTitle>历史记录</SheetTitle>
            </SheetHeader>
            <ThreadList
              threads={threads}
              onThreadClick={() => setChatHistoryOpen((o) => !o)}
              width={width}
              onDeleteThread={refreshThreads}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
