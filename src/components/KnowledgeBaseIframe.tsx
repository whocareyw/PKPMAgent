import React, { useEffect, useRef } from "react";
import { getCozeToken } from "./AccessToken";

export function KnowledgeBase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const data = event.data as any;
      if (!data || typeof data !== "object") return;
      if (data.type !== "coze-refresh-request") return;
      const requestId = data.requestId;
      if (!requestId || typeof requestId !== "string") return;
      try {
        const newToken = await getCozeToken();
        const token = newToken?.access_token || "";
        iframeRef.current?.contentWindow?.postMessage(
          { type: "coze-refresh-response", requestId, token },
          "*",
        );
      } catch {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "coze-refresh-response", requestId, token: "" },
          "*",
        );
      }
    };

    window.addEventListener("message", handleMessage);

    const init = async () => {
      if (!containerRef.current) return;
      try {
        const jwtToken = await getCozeToken();
        const accessToken = jwtToken?.access_token;
        if (!accessToken) {
          throw new Error("获取的 Coze 令牌无效，缺少 access_token 字段");
        }

        containerRef.current.innerHTML = "";
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
        iframe.style.display = "block";
        iframe.src = "/coze-webchat.html";
        iframeRef.current = iframe;
        containerRef.current.appendChild(iframe);

        const sendToken = () => {
          iframe.contentWindow?.postMessage({ type: "coze-token", token: accessToken }, "*");
        };

        iframe.addEventListener("load", sendToken);
        setTimeout(sendToken, 500);
      } catch (error) {
        const msg = (error as Error)?.message || String(error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #ff4444; font-size: 14px;">
              <div>知识库加载失败</div>
              <div style="margin-top: 8px; font-size: 12px; color: #999;">${msg}</div>
            </div>
          `;
        }
      }
    };

    init();

    return () => {
      window.removeEventListener("message", handleMessage);
      iframeRef.current = null;
    };
  }, []);

  return (
    <div
      className="relative h-full w-full bg-background overflow-hidden"
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--background, #ffffff)",
      }}
    />
  );
}
