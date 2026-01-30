import React, { useEffect, useRef } from "react";
import { getCozeToken } from "./AccessToken";

export function KnowledgeBaseLegacy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handleIframeMessage = async (event: MessageEvent) => {
      const data = event?.data;
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

    window.addEventListener("message", handleIframeMessage);

    const resolveCozeSDK = () => {
      const w = window as any;
      const candidates = [
        w.CozeWebSDK,
        w.module?.exports?.CozeWebSDK,
        w.module?.exports,
        w.exports?.CozeWebSDK,
        w.exports,
      ];
      const sdk = candidates.find((c) => c && c.WebChatClient);
      if (sdk && !w.CozeWebSDK) {
        w.CozeWebSDK = sdk;
      }
      return sdk;
    };

    // 1. 优化 SDK 加载：增加超时处理、重复加载防护、稳定版地址备选
    const loadCozeSDK = () => {
      return new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector('script[src*="chat-app-sdk"]');
        if (existingScript && !resolveCozeSDK()) {
          existingScript.remove();
        }

        if (resolveCozeSDK()) {
          resolve();
          return;
        }

        const tryUrls = [
          "https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js",
          "https://sf-cdn.coze.com/obj/unpkg-va/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js",
        ];

        let index = 0;

        const tryLoad = () => {
          const url = tryUrls[index];
          if (!url) {
            reject(new Error("Coze SDK 加载检测超时，window.CozeWebSDK 未定义"));
            return;
          }

          const script = document.createElement("script");
          script.src = `${url}?t=${Date.now()}`;
          script.type = "text/javascript";
          script.async = true;

          const timeoutTimer = setTimeout(() => {
            script.remove();
            index++;
            tryLoad();
          }, 15000);

          script.onload = () => {
            clearTimeout(timeoutTimer);

            if (resolveCozeSDK()) {
              resolve();
              return;
            }

            let checkCount = 0;
            const checkTimer = setInterval(() => {
              checkCount++;
              if (resolveCozeSDK()) {
                clearInterval(checkTimer);
                resolve();
              } else if (checkCount > 50) {
                clearInterval(checkTimer);
                script.remove();
                index++;
                tryLoad();
              }
            }, 100);
          };

          script.onerror = () => {
            clearTimeout(timeoutTimer);
            script.remove();
            index++;
            tryLoad();
          };

          document.head.appendChild(script);
        };

        tryLoad();
      });
    };

    // 2. 优化 Coze 初始化：增加全链路容错、分步校验
    const initCoze = async () => {
      // 提前校验容器是否就绪（避免后续无意义执行）
      if (!containerRef.current) {
        console.error("Coze 初始化失败：渲染容器未就绪");
        return;
      }

      let accessToken = "";
      try {
        // 步骤1：获取 JWT 令牌并校验
        console.log("开始获取 Coze 令牌...");
        const jwtToken = await getCozeToken();
        if (!jwtToken || !jwtToken.access_token) {
          throw new Error("获取的 Coze 令牌无效，缺少 access_token 字段");
        }
        accessToken = jwtToken.access_token;
        console.log("Coze 令牌获取成功");

        // 步骤2：加载 Coze SDK 并校验
        console.log("开始加载 Coze SDK...");
        await loadCozeSDK();

        const sdk = resolveCozeSDK();
        if (!sdk || !sdk.WebChatClient) {
          const w = window as any;
          const keys = w.CozeWebSDK ? Object.keys(w.CozeWebSDK).join(",") : "undefined";
          const hasExports = !!w.exports;
          const hasModule = !!w.module;
          throw new Error(
            `Coze SDK 加载异常，未找到 WebChatClient 构造函数。SDK Keys: ${keys} (exports:${hasExports}, module:${hasModule})`,
          );
        }
        console.log("Coze SDK 加载成功");

        // 步骤3：初始化 WebChatClient（保持原有配置，增加容错）
        console.log("开始初始化 Coze WebChatClient...");
        const client = new sdk.WebChatClient({
          config: {
            bot_id: '7471631685688246298',
            isIframe: false,
          },
          ui: {
            base: {
              layout: 'pc',
              lang: 'zh-CN',
            },
            header: {
              isNeedClose: false,
              isShow: false
            },
            chatBot: {
              el: containerRef.current, // 渲染容器
              width: '100%',
              isNeedQuote: true, // 消息追问功能
            },
            conversations: {
              isNeed: true,
            },
            footer: {
              isShow: false,
            },
          },
          auth: {
            type: 'token',
            token: accessToken,
            onRefreshToken: async () => {
              try {
                const newToken = await getCozeToken();
                return newToken?.access_token || '';
              } catch (refreshErr) {
                console.error("Coze 令牌刷新失败：", refreshErr);
                return '';
              }
            }
          },
          userInfo: {
            id: '123',
            url: 'data:image/png;base64,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',
            nickname: 'User',
          },
        });

        // 步骤4：保存客户端实例并显示聊天窗口
        clientRef.current = client;
        client.showChatBot();
        console.log("Coze WebChatClient 初始化成功，聊天窗口已显示");

      } catch (error) {
        console.error("Coze 初始化流程异常：", error);
        const msg = (error as Error)?.message || String(error);
        if (!containerRef.current) return;

        containerRef.current.innerHTML = "";
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
        iframe.style.display = "block";
        iframe.src = "/coze-webchat.html";
        iframeRef.current = iframe;
        containerRef.current.appendChild(iframe);

        iframe.addEventListener("load", () => {
          iframe.contentWindow?.postMessage(
            { type: "coze-token", token: accessToken },
            "*",
          );
        });

        setTimeout(() => {
          if (!iframeRef.current) return;
          if (!iframeRef.current.contentWindow) return;
          iframeRef.current.contentWindow.postMessage(
            { type: "coze-token", token: accessToken },
            "*",
          );
        }, 500);

        const notice = document.createElement("div");
        notice.style.position = "absolute";
        notice.style.left = "0";
        notice.style.right = "0";
        notice.style.bottom = "0";
        notice.style.padding = "6px 10px";
        notice.style.fontSize = "12px";
        notice.style.color = "#999";
        notice.style.background = "rgba(255,255,255,0.7)";
        notice.style.backdropFilter = "blur(4px)";
        notice.innerText = msg.includes("CozeWebSDK")
          ? "已切换到 iframe 兜底加载模式"
          : "加载异常，已尝试 iframe 兜底模式";
        containerRef.current.appendChild(notice);
      }
    };

    // 3. 执行初始化
    initCoze();

    // 4. 组件卸载时：销毁 Coze 客户端实例，避免内存泄漏
    return () => {
      window.removeEventListener("message", handleIframeMessage);
      if (clientRef.current) {
        try {
          clientRef.current.destroy?.();
          console.log("Coze 客户端实例已销毁");
        } catch (err) {
          console.error("销毁 Coze 客户端实例失败：", err);
        }
        clientRef.current = null;
      }
    };
  }, []); // 空依赖：仅组件挂载时执行一次

  // 5. 优化容器样式：兜底宽高、避免样式失效导致空白
  return (
    <div 
      className="relative h-full w-full bg-background overflow-hidden" 
      ref={containerRef}
      // 内联样式兜底：确保即使 tailwind 样式失效，容器仍有有效宽高
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--background, #ffffff)', // 兜底背景色
      }}
    >
      <style>{`
        /* 确保容器内的 SDK 元素无多余边距，占满容器 */
        .coze-webchat,
        #web_sdk_official_banner {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
        }

        /* 隐藏关闭按钮（CSS 兜底） */
        button[aria-label="Close"],
        .close-btn,
        div[class*="close-icon"],
        .coze-webchat__close {
            display: none !important;
        }

        /* 兜底：确保 SDK 渲染的元素不会被隐藏 */
        [class^="coze-webchat__"],
        [class*=" coze-webchat__"] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

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
