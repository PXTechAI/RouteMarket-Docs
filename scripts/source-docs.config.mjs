export default {
  source: {
    indexUrl: "https://doc.12ai.org/llms.txt",
    markdownBaseUrl: "https://doc.12ai.org/llms.mdx",
    includedPathPrefixes: ["/docs/guide", "/docs/api"]
  },
  target: {
    brandName: "RouteMarket",
    siteUrl: "https://routemarket.ai",
    consoleUrl: "https://console.routemarket.ai",
    docsUrl: "https://docs.routemarket.ai",
    apiBaseUrl: "https://api.routemarket.ai",
    apiKeyEnv: "ROUTEMARKET_API_KEY",
    outputDir: "content/docs",
    locale: "zh"
  },
  migration: {
    maxCodeBlocksPerPage: 10,
    preserveExistingFiles: true,
    excludedPaths: ["/docs/terms", "/docs/privacy"],
    sourceBrandPatterns: [/\b12API\b/gi, /\b12ai\b/gi],
    sourceUrlPatterns: [
      /https:\/\/(?:[a-z0-9-]+\.)?12ai\.org/gi,
      /https:\/\/api\.12ai\.org/gi,
      /https:\/\/doc\.12ai\.org/gi,
      /https:\/\/12ai\.org/gi
    ],
    routeOverrides: {
      "/docs/guide": "guide",
      "/docs/guide/registration": "registration",
      "/docs/guide/nanobanana": "image-workbench",
      "/docs/guide/chat-clients": "chat-clients",
      "/docs/guide/chat-clients/pcclients": "chat-clients-pc",
      "/docs/guide/chat-clients/iosclients": "chat-clients-ios",
      "/docs/guide/chat-clients/Androidclients": "chat-clients-android",
      "/docs/guide/chat-clients/openclaw": "openclaw",
      "/docs/guide/troubleshooting": "troubleshooting",
      "/docs/api": "api-overview",
      "/docs/api/chat-completions": "chat-completions",
      "/docs/api/responses": "responses"
    },
    destinationOverrides: {
      "/docs/guide": "guide/index",
      "/docs/guide/registration": "guide/registration",
      "/docs/guide/nanobanana": "guide/image-workbench",
      "/docs/guide/chat-clients": "guide/chat-clients/index",
      "/docs/guide/chat-clients/pcclients": "guide/chat-clients/chat-clients-pc",
      "/docs/guide/chat-clients/iosclients": "guide/chat-clients/chat-clients-ios",
      "/docs/guide/chat-clients/Androidclients":
        "guide/chat-clients/chat-clients-android",
      "/docs/guide/chat-clients/openclaw": "guide/chat-clients/openclaw",
      "/docs/guide/troubleshooting": "guide/troubleshooting",
      "/docs/api": "api/index",
      "/docs/api/chat-completions": "api/text/chat-completions",
      "/docs/api/responses": "api/text/responses",
      "/docs/api/claude-messages": "api/text/api-claude-messages",
      "/docs/api/gemini": "api/text/api-gemini",
      "/docs/api/gemini-image": "api/image/api-gemini-image",
      "/docs/api/gpt-image": "api/image/api-gpt-image",
      "/docs/api/async-image": "api/image/api-async-image",
      "/docs/api/videos": "api/video/api-videos",
      "/docs/api/seedance": "api/video/api-seedance",
      "/docs/api/veo-official": "api/video/api-veo-official",
      "/docs/api/gemini-veo": "api/video/api-gemini-veo",
      "/docs/api/omni": "api/video/api-omni",
      "/docs/api/async-video": "api/async-video/index",
      "/docs/api/async-video/seedance-2-0-fast":
        "api/async-video/api-async-video-seedance-2-0-fast",
      "/docs/api/async-video/seedance-2-0":
        "api/async-video/api-async-video-seedance-2-0",
      "/docs/api/async-video/grok-imagine-1-5":
        "api/async-video/api-async-video-grok-imagine-1-5",
      "/docs/api/async-video/happy-horse-1-1":
        "api/async-video/api-async-video-happy-horse-1-1",
      "/docs/api/async-video/gemini-omni-flash":
        "api/async-video/api-async-video-gemini-omni-flash"
    },
    navigationFiles: {
      "meta.zh.json": {
        title: "RouteMarket 文档",
        pages: [
          "index",
          "quickstart",
          "authentication",
          "models",
          "code-examples",
          "routing-and-models",
          "routing-preferences",
          "errors",
          "architecture",
          "deployment",
          "faq",
          "guide",
          "api"
        ]
      },
      "meta.en.json": {
        title: "RouteMarket Docs",
        pages: [
          "index",
          "quickstart",
          "authentication",
          "models",
          "code-examples",
          "routing-and-models",
          "routing-preferences",
          "errors",
          "architecture",
          "deployment",
          "faq",
          "api"
        ]
      },
      "guide/meta.zh.json": {
        title: "使用指南",
        defaultOpen: true,
        pages: [
          "index",
          "registration",
          "image-workbench",
          "chat-clients",
          "troubleshooting"
        ]
      },
      "guide/chat-clients/meta.zh.json": {
        title: "聊天客户端配置",
        defaultOpen: true,
        pages: [
          "index",
          "chat-clients-pc",
          "chat-clients-ios",
          "chat-clients-android",
          "openclaw"
        ]
      },
      "api/meta.zh.json": {
        title: "API 手册",
        defaultOpen: true,
        pages: ["index", "text", "image", "video", "async-video"]
      },
      "api/meta.en.json": {
        title: "API Reference",
        defaultOpen: true,
        pages: ["index", "text"]
      },
      "api/text/meta.zh.json": {
        title: "文本与多模态",
        defaultOpen: true,
        pages: [
          "chat-completions",
          "responses",
          "api-claude-messages",
          "api-gemini"
        ]
      },
      "api/text/meta.en.json": {
        title: "Text and Multimodal",
        defaultOpen: true,
        pages: ["chat-completions", "responses"]
      },
      "api/image/meta.zh.json": {
        title: "图片",
        pages: ["api-gemini-image", "api-gpt-image", "api-async-image"]
      },
      "api/video/meta.zh.json": {
        title: "视频",
        pages: [
          "api-videos",
          "api-seedance",
          "api-veo-official",
          "api-gemini-veo",
          "api-omni"
        ]
      },
      "api/async-video/meta.zh.json": {
        title: "异步视频任务",
        pages: [
          "index",
          "api-async-video-seedance-2-0-fast",
          "api-async-video-seedance-2-0",
          "api-async-video-grok-imagine-1-5",
          "api-async-video-happy-horse-1-1",
          "api-async-video-gemini-omni-flash"
        ]
      }
    },
    titleOverrides: {
      "/docs/guide": "使用指南",
      "/docs/guide/registration": "注册、计费与密钥创建",
      "/docs/guide/nanobanana": "图片工作台",
      "/docs/guide/chat-clients": "聊天客户端配置",
      "/docs/guide/chat-clients/pcclients": "桌面端聊天配置",
      "/docs/guide/chat-clients/iosclients": "iOS 聊天配置",
      "/docs/guide/chat-clients/Androidclients": "Android 聊天配置",
      "/docs/guide/chat-clients/openclaw": "OpenClaw 配置",
      "/docs/guide/troubleshooting": "报错与排查"
    }
  }
};
