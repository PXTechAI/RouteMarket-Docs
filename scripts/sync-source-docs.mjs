import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import config from "./source-docs.config.mjs";

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const force = args.has("--force");
const requestedPath = getArgValue("--path");
const requestedScope = getArgValue("--scope");
const rootDir = process.cwd();
const outputDir = path.join(rootDir, config.target.outputDir);

const indexMarkdown = await fetchText(config.source.indexUrl);
const pages = discoverPages(indexMarkdown).filter((page) => {
  if (!requestedPath) {
    return !requestedScope || page.scope === requestedScope;
  }

  return page.sourcePath === requestedPath;
});

if (pages.length === 0) {
  throw new Error(
    requestedPath
      ? `No source page found for ${requestedPath}`
      : "No matching pages were discovered from the source index."
  );
}

const report = [];

for (const page of pages) {
  const slug = getDestinationSlug(page.sourcePath);
  const destinationPath = getDestinationPath(page.sourcePath);
  const destination = path.join(
    outputDir,
    `${destinationPath}.${config.target.locale}.mdx`
  );
  const exists = await fileExists(destination);
  const markdownUrl = `${config.source.markdownBaseUrl}${page.sourcePath}/content.md`;
  const sourceMarkdown = await fetchText(markdownUrl);
  const facts = extractTechnicalFacts(sourceMarkdown);
  const output =
    page.scope === "guide"
      ? renderGuidePage({ ...page, slug, facts })
      : renderApiPage({ ...page, slug, facts });

  const generatedFile = exists && (await isGeneratedFile(destination));
  const preserve =
    config.migration.preserveExistingFiles &&
    exists &&
    !generatedFile &&
    !force;

  if (shouldWrite && !preserve) {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, output, "utf8");
  }

  report.push({
    sourcePath: page.sourcePath,
    destination: path.relative(rootDir, destination).replaceAll("\\", "/"),
    status: preserve
      ? "preserved-existing"
      : shouldWrite
        ? generatedFile
          ? "updated-generated"
          : "written"
        : "dry-run",
    endpointCount: facts.endpoints.length,
    tableCount: facts.tables.length,
    codeBlockCount: facts.codeBlocks.length
  });
}

if (shouldWrite) {
  await updateNavigationFiles();
  await writeFile(
    path.join(rootDir, "source-docs-migration-report.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceIndex: config.source.indexUrl,
        policy: {
          scopes: config.source.includedPathPrefixes,
          storesRawSourcePages: false,
          preservesExistingFiles: config.migration.preserveExistingFiles && !force
        },
        pages: report
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

printReport(report);

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "RouteMarketDocsMigration/1.0"
    },
    signal: AbortSignal.timeout(30_000)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function discoverPages(index) {
  const linkPattern = /\[([^\]]+)\]\((\/docs\/(?:api|guide)(?:\/[^)]*)?)\)(?::\s*([^\r\n]*))?/g;
  const unique = new Map();

  for (const match of index.matchAll(linkPattern)) {
    const [, title, sourcePath, sourceDescription = ""] = match;

    if (!isIncludedPath(sourcePath) || isExcludedPath(sourcePath) || unique.has(sourcePath)) {
      continue;
    }

    unique.set(sourcePath, {
      title:
        config.migration.titleOverrides[sourcePath] ??
        replaceSourceIdentity(title.trim()),
      sourceDescription: replaceSourceIdentity(sourceDescription.trim()),
      sourcePath,
      scope: sourcePath.startsWith("/docs/guide") ? "guide" : "api"
    });
  }

  return Array.from(unique.values());
}

function isIncludedPath(sourcePath) {
  return config.source.includedPathPrefixes.some(
    (included) => sourcePath === included || sourcePath.startsWith(`${included}/`)
  );
}

function isExcludedPath(sourcePath) {
  return config.migration.excludedPaths.some(
    (excluded) => sourcePath === excluded || sourcePath.startsWith(`${excluded}/`)
  );
}

function getDestinationSlug(sourcePath) {
  const override = config.migration.routeOverrides[sourcePath];
  if (override) {
    return override;
  }

  const suffix = sourcePath
    .replace(/^\/docs\//, "")
    .replaceAll("/", "-");

  return suffix;
}

function getDestinationPath(sourcePath) {
  return (
    config.migration.destinationOverrides[sourcePath] ??
    getDestinationSlug(sourcePath)
  );
}

function extractTechnicalFacts(markdown) {
  const normalized = markdown.replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");
  const codeBlocks = [];
  const tables = [];
  const endpoints = new Set();
  const authSchemes = new Set();
  let inFence = false;
  let fenceLanguage = "";
  let fenceLines = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^```([\w+-]*)\s*$/);

    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceLanguage = fence[1] || "text";
        fenceLines = [];
      } else {
        const sanitized = sanitizeCodeBlock(fenceLines.join("\n"));
        collectEndpoints(sanitized, endpoints);
        collectAuthSchemes(sanitized, authSchemes);

        if (
          sanitized.trim() &&
          codeBlocks.length < config.migration.maxCodeBlocksPerPage
        ) {
          codeBlocks.push({
            language: fenceLanguage,
            content: sanitized.trim()
          });
        }

        inFence = false;
        fenceLanguage = "";
        fenceLines = [];
      }
      continue;
    }

    if (inFence) {
      fenceLines.push(line);
      continue;
    }

    collectEndpoints(line, endpoints);
    collectAuthSchemes(line, authSchemes);

    if (looksLikeTableHeader(lines, index)) {
      const tableLines = [line, lines[index + 1]];
      index += 2;

      while (index < lines.length && lines[index].includes("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }

      index -= 1;
      const table = sanitizeTable(tableLines);
      if (table) {
        tables.push(table);
      }
    }
  }

  return {
    endpoints: Array.from(endpoints),
    authSchemes: Array.from(authSchemes),
    tables,
    codeBlocks
  };
}

function sanitizeCodeBlock(value) {
  const withoutComments = value
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return !(
        trimmed.startsWith("//") ||
        trimmed.startsWith("# ") ||
        trimmed.startsWith("<!--")
      );
    })
    .join("\n");

  return replaceCredentialNames(replaceSourceIdentity(withoutComments));
}

function replaceCredentialNames(value) {
  return value
    .replace(
      /\$(?:OPENAI_API_KEY|TWELVE_API_KEY|12API_API_KEY|API_KEY)\b/g,
      `$${config.target.apiKeyEnv}`
    )
    .replace(
      /process\.env\.(?:OPENAI_API_KEY|TWELVE_API_KEY|12API_API_KEY|API_KEY)\b/g,
      `process.env.${config.target.apiKeyEnv}`
    )
    .replace(
      /os\.environ\[(["'])(?:OPENAI_API_KEY|TWELVE_API_KEY|12API_API_KEY|API_KEY)\1\]/g,
      `os.environ["${config.target.apiKeyEnv}"]`
    );
}

function looksLikeTableHeader(lines, index) {
  const current = lines[index];
  const next = lines[index + 1];

  return Boolean(
    current?.includes("|") &&
    next &&
    /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(next)
  );
}

function sanitizeTable(lines) {
  const rows = lines.map(parseTableRow);
  const headers = rows[0];

  if (headers.length < 2) {
    return undefined;
  }

  const descriptionIndexes = new Set();
  headers.forEach((header, index) => {
    if (/说明|描述|备注|用途|example|description|notes?/i.test(header)) {
      descriptionIndexes.add(index);
    }
  });

  const sanitizedRows = rows.map((cells, rowIndex) =>
    cells.map((cell, columnIndex) => {
      const branded = replaceCredentialNames(replaceSourceIdentity(cell.trim()));
      if (rowIndex < 2 || !descriptionIndexes.has(columnIndex)) {
        return branded || "-";
      }

      return summarizeDescriptionFacts(branded);
    })
  );

  return sanitizedRows
    .map((cells) => `| ${cells.join(" | ")} |`)
    .join("\n");
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function summarizeDescriptionFacts(value) {
  const literals = Array.from(value.matchAll(/`([^`]+)`/g), (match) => match[1]);
  const urls = Array.from(
    value.matchAll(/https?:\/\/[^\s<>)`"']+/g),
    (match) => match[0]
  );
  const numeric = Array.from(
    value.matchAll(/\b(?:true|false|null|\d+(?:\.\d+)?(?:px|s|ms|MB|GB|K|P)?)\b/gi),
    (match) => match[0]
  );
  const facts = Array.from(new Set([...literals, ...urls, ...numeric]));

  if (facts.length === 0) {
    return "-";
  }

  return `相关值：${facts.map((fact) => `\`${fact}\``).join("、")}`;
}

function collectEndpoints(value, endpoints) {
  const transformed = replaceSourceIdentity(value);
  const absolutePattern =
    /\b(GET|POST|PUT|PATCH|DELETE)\s+(https?:\/\/[^\s"'`\\]+)/gi;
  const relativePattern =
    /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/(?:v1|v1beta|api)\/[^\s"'`\\]+)/gi;

  for (const match of transformed.matchAll(absolutePattern)) {
    endpoints.add(`${match[1].toUpperCase()} ${trimEndpoint(match[2])}`);
  }

  for (const match of transformed.matchAll(relativePattern)) {
    endpoints.add(
      `${match[1].toUpperCase()} ${config.target.apiBaseUrl}${trimEndpoint(match[2])}`
    );
  }
}

function collectAuthSchemes(value, authSchemes) {
  if (/\bx-api-key\s*:/i.test(value)) {
    authSchemes.add("x-api-key");
  }

  if (/\bAuthorization\s*:\s*Bearer\b/i.test(value)) {
    authSchemes.add("bearer");
  }
}

function trimEndpoint(value) {
  return value.replace(/[),.;]+$/, "");
}

function replaceSourceIdentity(value) {
  let output = value;

  for (const pattern of config.migration.sourceUrlPatterns) {
    output = output.replace(pattern, config.target.apiBaseUrl);
  }

  for (const pattern of config.migration.sourceBrandPatterns) {
    output = output.replace(pattern, config.target.brandName);
  }

  return output.replace(
    /\((\/docs\/(?:api|guide)(?:\/[^)]*)?)\)/g,
    (_match, sourcePath) => `(./${getDestinationSlug(sourcePath)})`
  );
}

function renderApiPage({ title, sourceDescription, sourcePath, facts }) {
  const description =
    sourceDescription ||
    `${config.target.brandName} 的 ${title} 兼容接口参考。`;
  const sections = [
    "---",
    `title: ${escapeFrontmatter(title)}`,
    `description: ${escapeFrontmatter(description)}`,
    "---",
    "",
    `本页整理 ${config.target.brandName} 的 **${title}** 兼容接口，包括可识别的端点、结构化参数和请求示例。`,
    "",
    "> 兼容性提示：页面由公开协议中的技术字段生成。具体模型、额度和路由能力以 RouteMarket 控制台及实际网关响应为准。",
    ""
  ];

  if (facts.endpoints.length > 0) {
    sections.push(
      "## 接口地址",
      "",
      ...facts.endpoints.map((endpoint) => `- \`${endpoint}\``),
      ""
    );
  }

  if (facts.tables.length > 0) {
    sections.push("## 参数参考", "");
    facts.tables.forEach((table, index) => {
      sections.push(`### 参数表 ${index + 1}`, "", table, "");
    });
  }

  if (facts.codeBlocks.length > 0) {
    sections.push("## 请求与响应示例", "");
    facts.codeBlocks.forEach((block, index) => {
      sections.push(
        `### 示例 ${index + 1}`,
        "",
        `\`\`\`${block.language}`,
        block.content,
        "```",
        ""
      );
    });
  }

  sections.push(
    "## 接入说明",
    "",
    `- API 基础地址：\`${config.target.apiBaseUrl}\``,
    `- 推荐密钥环境变量：\`${config.target.apiKeyEnv}\``,
    ...renderAuthenticationNotes(facts.authSchemes),
    "- 上线前请用实际账号验证端点、模型名、限额与异步任务状态。",
    "",
    `{/* migration-source-path: ${sourcePath} */}`,
    ""
  );

  return sections.join("\n");
}

function renderAuthenticationNotes(authSchemes) {
  if (authSchemes.includes("x-api-key") && authSchemes.includes("bearer")) {
    return [
      "- 页面同时包含 `x-api-key` 与 Bearer 示例，请以目标端点要求的认证头为准。"
    ];
  }

  if (authSchemes.includes("x-api-key")) {
    return ["- 请求使用 `x-api-key: <API_KEY>`；需要时同时发送协议版本头。"];
  }

  return ["- 请求使用 `Authorization: Bearer <API_KEY>`。"];
}

function renderGuidePage(page) {
  const body = renderKnownGuide(page) ?? renderGenericGuide(page);
  const description = getGuideDescription(page);

  return [
    "---",
    `title: ${escapeFrontmatter(page.title)}`,
    `description: ${escapeFrontmatter(description)}`,
    "---",
    "",
    body,
    "",
    `{/* migration-source-path: ${page.sourcePath} */}`,
    ""
  ].join("\n");
}

function getGuideDescription(page) {
  const descriptions = {
    "/docs/guide": "按目标选择 RouteMarket 的账户、客户端与 API 使用指南。",
    "/docs/guide/registration": "创建 RouteMarket 账户，完成计费设置，并生成项目 API Key。",
    "/docs/guide/nanobanana": "通过 RouteMarket 控制台或兼容 API 生成和编辑图片。",
    "/docs/guide/chat-clients": "在桌面端、iOS、Android 和自动化客户端中配置 RouteMarket。",
    "/docs/guide/chat-clients/pcclients": "在桌面聊天客户端中配置 RouteMarket。",
    "/docs/guide/chat-clients/iosclients": "在 iPhone 和 iPad 聊天客户端中配置 RouteMarket。",
    "/docs/guide/chat-clients/Androidclients": "在 Android 聊天客户端中配置 RouteMarket。",
    "/docs/guide/chat-clients/openclaw": "将 RouteMarket 配置为 OpenClaw 的 OpenAI 兼容模型服务。",
    "/docs/guide/troubleshooting": "排查 RouteMarket 的认证、网络、参数、额度与上游错误。"
  };

  return descriptions[page.sourcePath] ?? `${config.target.brandName} 的 ${page.title}。`;
}

function renderKnownGuide(page) {
  const guides = {
    "/docs/guide": renderGuideIndex,
    "/docs/guide/registration": renderRegistrationGuide,
    "/docs/guide/nanobanana": renderImageWorkbenchGuide,
    "/docs/guide/chat-clients": renderChatClientsGuide,
    "/docs/guide/chat-clients/pcclients": () =>
      renderPlatformClientGuide("桌面端", [
        "Cherry Studio",
        "Chatbox",
        "支持自定义 OpenAI 服务的其他桌面客户端"
      ]),
    "/docs/guide/chat-clients/iosclients": () =>
      renderPlatformClientGuide("iOS", [
        "支持自定义 OpenAI 服务的 iPhone 或 iPad 客户端",
        "支持手动填写 Base URL、API Key 与模型名的应用"
      ]),
    "/docs/guide/chat-clients/Androidclients": () =>
      renderPlatformClientGuide("Android", [
        "支持自定义 OpenAI 服务的 Android 客户端",
        "支持手动填写 Base URL、API Key 与模型名的应用"
      ]),
    "/docs/guide/chat-clients/openclaw": renderOpenClawGuide,
    "/docs/guide/troubleshooting": renderTroubleshootingGuide
  };
  const renderer = guides[page.sourcePath];

  return renderer?.();
}

function renderGuideIndex() {
  return [
    "RouteMarket 的使用流程分成账户准备、客户端配置、API 接入和问题排查四部分。",
    "",
    "## 第一次使用",
    "",
    `1. 在 [RouteMarket 控制台](${config.target.consoleUrl}) 创建或登录账户。`,
    "2. 按控制台提示完成计费设置；启用余额制时，先确保账户余额充足。",
    "3. 创建项目和 API Key，并立即保存只显示一次的密钥。",
    "4. 选择聊天客户端、图片工作台或 API 接入方式。",
    "5. 用一个低成本请求验证密钥、模型与网络配置。",
    "",
    "## 按目标选择",
    "",
    "- [注册、计费与密钥创建](./registration)",
    "- [聊天客户端配置](./chat-clients)",
    "- [图片工作台](./image-workbench)",
    "- [API 概览](./api-overview)",
    "- [报错与排查](./troubleshooting)"
  ].join("\n");
}

function renderRegistrationGuide() {
  return [
    "本页说明 RouteMarket 的通用开户流程。控制台按钮名称可能随版本调整，但账户、计费、项目和密钥四个环节保持一致。",
    "",
    "## 1. 打开控制台",
    "",
    `访问 [${config.target.consoleUrl}](${config.target.consoleUrl})，选择注册或登录。`,
    "",
    "建议使用团队长期可访问的邮箱，并完成页面要求的邮箱验证或安全验证。",
    "",
    '<DocImage src="/images/docs/guide/registration/account.png" alt="RouteMarket 账户注册操作示意" caption="使用团队长期可访问的邮箱注册并完成验证。" />',
    "",
    "## 2. 完成计费设置",
    "",
    "进入控制台的计费或钱包区域，根据当前账户模式完成充值、余额确认或付款方式设置。",
    "",
    "> 如果账户采用后付费或管理员统一分配额度，以组织管理员给出的计费规则为准。",
    "",
    "## 3. 创建项目",
    "",
    "为不同应用或环境分别创建项目，例如 `development`、`staging` 和 `production`。分项目管理可以隔离密钥、用量和权限。",
    "",
    '<DocImage src="/images/docs/guide/registration/billing-project.png" alt="RouteMarket 计费和项目创建操作示意" caption="先确认计费状态，再为不同环境创建独立项目。" />',
    "",
    "## 4. 创建 API Key",
    "",
    "在项目的密钥管理页面创建新密钥，并设置容易识别的名称。密钥通常只完整显示一次，请立即保存到密码管理器或部署平台的 Secret 中。",
    "",
    "不要把 API Key 写进前端代码、公开仓库、截图或工单正文。",
    "",
    '<DocImage src="/images/docs/guide/registration/api-key.png" alt="RouteMarket API Key 创建操作示意" caption="密钥只完整显示一次，请立即保存到安全的 Secret 管理工具。" />',
    "",
    "## 5. 验证密钥",
    "",
    "```bash",
    `export ${config.target.apiKeyEnv}="your_key_here"`,
    "",
    `curl ${config.target.apiBaseUrl}/v1/models \\`,
    `  -H "Authorization: Bearer $${config.target.apiKeyEnv}"`,
    "```",
    "",
    "返回模型列表或有效的权限提示，说明域名、密钥和网络链路已经连通。",
    "",
    "## 下一步",
    "",
    "- 使用桌面或移动客户端时，继续阅读 [聊天客户端配置](./chat-clients)。",
    "- 直接开发时，继续阅读 [Chat Completions](./chat-completions) 或 [Responses](./responses)。"
  ].join("\n");
}

function renderImageWorkbenchGuide() {
  return [
    "RouteMarket 的图片能力可以通过控制台工作台或兼容 API 使用。工作台适合交互式生成和编辑，API 适合批量任务与产品集成。",
    "",
    "## 使用控制台",
    "",
    `1. 登录 [RouteMarket 控制台](${config.target.consoleUrl})。`,
    "2. 打开图片生成或多模态工作区。",
    "3. 选择账户可用的图片模型。",
    "",
    '<DocImage src="/images/docs/guide/image-workbench/model.png" alt="RouteMarket 图片工作台模型选择示意" caption="按任务质量、速度和成本选择可用图片模型。" />',
    "",
    "4. 输入提示词；编辑任务还需要上传参考图。",
    "5. 设置尺寸、数量和输出格式后提交。",
    "",
    '<DocImage src="/images/docs/guide/image-workbench/prompt.png" alt="RouteMarket 图片提示词与参数设置示意" caption="填写提示词、参考素材、尺寸和生成数量。" />',
    "",
    "6. 在历史记录中查看结果、消耗和任务状态。",
    "",
    '<DocImage src="/images/docs/guide/image-workbench/history.png" alt="RouteMarket 图片任务历史示意" caption="保存任务 ID，并在历史记录中查看状态、消耗和输出。" />',
    "",
    "## 使用 API",
    "",
    "- Gemini 图片协议：[NanoBanana 图片](./api-gemini-image)",
    "- OpenAI 图片协议：[GPT Image](./api-gpt-image)",
    "- 需要轮询或回调时：[异步图片任务](./api-async-image)",
    "",
    "## 使用建议",
    "",
    "- 上传素材前确认你拥有必要的使用权。",
    "- 批量任务先用小尺寸和少量样本验证提示词。",
    "- 异步任务应保存任务 ID，并为轮询设置超时与退避。"
  ].join("\n");
}

function renderChatClientsGuide() {
  return [
    "只要客户端支持自定义 OpenAI 兼容服务，通常就可以接入 RouteMarket。",
    "",
    "## 通用配置",
    "",
    "| 配置项 | 填写内容 |",
    "| --- | --- |",
    "| Provider / 类型 | OpenAI Compatible 或 Custom OpenAI |",
    `| Base URL | \`${config.target.apiBaseUrl}/v1\` |`,
    "| API Key | 在 RouteMarket 控制台创建的项目密钥 |",
    "| Model | 账户可用的逻辑模型名 |",
    "",
    '<DocImage src="/images/docs/guide/clients/provider.png" alt="RouteMarket 客户端通用 Provider 配置示意" caption="不同客户端名称可能不同，但 Provider、Base URL、API Key 和模型是通用核心字段。" />',
    "",
    "## 按设备选择",
    "",
    "- [桌面端聊天配置](./chat-clients-pc)",
    "- [iOS 聊天配置](./chat-clients-ios)",
    "- [Android 聊天配置](./chat-clients-android)",
    "- [OpenClaw 配置](./openclaw)",
    "",
    "## 验证顺序",
    "",
    "1. 先确认 API Key 可以调用 `/v1/models`。",
    "2. 再在客户端中填写 Base URL 和密钥。",
    "3. 使用模型列表中真实存在的模型名。",
    "4. 最后发送一条短消息测试。",
    "",
    "遇到问题时，记录客户端名称、请求时间和状态码，不要发送完整 API Key。"
  ].join("\n");
}

function renderPlatformClientGuide(platform, examples) {
  const platformImage = {
    桌面端: "desktop",
    iOS: "ios",
    Android: "android"
  }[platform];

  return [
    `${platform} 客户端的界面各不相同，但 RouteMarket 接入所需字段基本一致。`,
    "",
    "## 可用客户端",
    "",
    ...examples.map((example) => `- ${example}`),
    "",
    "## 配置步骤",
    "",
    "1. 在客户端中新增模型服务或自定义 Provider。",
    "2. 类型选择 OpenAI Compatible、Custom OpenAI 或等价选项。",
    `3. Base URL 填写 \`${config.target.apiBaseUrl}/v1\`。`,
    "4. API Key 填写 RouteMarket 项目密钥。",
    "5. 模型名填写 `/v1/models` 返回的可用模型。",
    "6. 保存后新建会话并发送短消息测试。",
    "",
    `<DocImage src="/images/docs/guide/clients/${platformImage}.png" alt="${platform} RouteMarket 客户端配置示意" caption="${platform} 客户端的操作入口可能不同，连接字段保持一致。" />`,
    "",
    '<DocImage src="/images/docs/guide/clients/test.png" alt="RouteMarket 客户端连接验证示意" caption="先验证模型列表，再新建会话发送一条短消息。" />',
    "",
    "## 常见配置错误",
    "",
    "- Base URL 漏掉 `/v1`，或客户端自动重复追加 `/v1`。",
    "- 模型名来自客户端预设，但账户并没有对应模型权限。",
    "- 密钥前后带有空格、引号或换行。",
    "- 移动网络、代理或私有 DNS 阻止了网关连接。",
    "",
    "更多状态码说明见 [报错与排查](./troubleshooting)。"
  ].join("\n");
}

function renderOpenClawGuide() {
  const sections = [
    "OpenClaw 接入 RouteMarket 时，应把 RouteMarket 配置为 OpenAI 兼容模型服务。不同版本的配置字段可能不同，请同时对照当前 OpenClaw 版本的配置说明。",
    "",
    "## 必填信息",
    "",
    `- Base URL：\`${config.target.apiBaseUrl}/v1\``,
    `- API Key：通过 \`${config.target.apiKeyEnv}\` 或 Secret 注入`,
    "- Model：RouteMarket 账户可用的逻辑模型名",
    "",
    "## 配置片段"
  ];

  sections.push(
    "",
    "```json",
    "{",
    `  "baseURL": "${config.target.apiBaseUrl}/v1",`,
    `  "apiKey": "\${${config.target.apiKeyEnv}}",`,
    '  "model": "your-model-name"',
    "}",
    "```"
  );

  sections.push(
    "",
    '<DocImage src="/images/docs/guide/clients/openclaw-config.png" alt="RouteMarket OpenClaw 配置示意" caption="使用环境变量注入 API Key，避免把 Secret 直接写进配置文件。" />',
    "",
    "## 验证",
    "",
    "先用同一密钥调用 `/v1/models`，再启动 OpenClaw。若命令行请求成功而 OpenClaw 失败，重点检查配置文件路径、环境变量加载和模型名。",
    "",
    '<DocImage src="/images/docs/guide/clients/openclaw-verify.png" alt="RouteMarket OpenClaw 连接验证示意" caption="把接口验证和应用启动分开执行，可以更快定位配置问题。" />'
  );

  return sections.join("\n");
}

function renderTroubleshootingGuide() {
  return [
    "排错时先保存状态码、请求时间、请求 ID 和所用模型。不要在日志或工单中暴露完整 API Key。",
    "",
    "## 常见状态码",
    "",
    "| 状态码 | 常见原因 | 建议操作 |",
    "| --- | --- | --- |",
    "| `400` | 请求 JSON、字段类型或模型参数不正确 | 用最小请求重试，并逐项加回可选参数 |",
    "| `401` | 密钥缺失、格式错误、失效或复制不完整 | 检查 `Bearer` 前缀并重新创建密钥 |",
    "| `403` | 项目、模型或路由没有权限 | 检查项目策略、模型授权和账户状态 |",
    "| `404` | Base URL、接口路径或模型名错误 | 核对 `/v1`、端点路径和模型列表 |",
    "| `413` | 请求体、图片或附件过大 | 压缩素材或减少输入内容 |",
    "| `429` | 频率、并发或额度达到限制 | 降低并发并采用指数退避 |",
    "| `500` / `502` / `503` | 网关或上游暂时不可用 | 稍后重试，并保留请求 ID |",
    "| `504` | 上游处理超时 | 缩短任务、增加客户端超时或改用异步接口 |",
    "",
    "## 最小化请求",
    "",
    "```bash",
    `curl ${config.target.apiBaseUrl}/v1/chat/completions \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "Authorization: Bearer $${config.target.apiKeyEnv}" \\`,
    `  -d '{"model":"your-model-name","messages":[{"role":"user","content":"ping"}]}'`,
    "```",
    "",
    "如果最小请求成功，问题通常来自额外参数、附件、客户端代理设置或模型特有能力。",
    "",
    "## 联系支持时提供",
    "",
    "- 请求时间和时区",
    "- HTTP 状态码与错误代码",
    "- 请求 ID 或任务 ID",
    "- 使用的端点和模型名",
    "- 已脱敏的最小复现请求"
  ].join("\n");
}

function renderGenericGuide(page) {
  const sections = [
    `${page.title} 已按 RouteMarket 的域名、密钥和控制台流程重新整理。`,
    "",
    "## 基础配置",
    "",
    `- 控制台：${config.target.consoleUrl}`,
    `- API：${config.target.apiBaseUrl}`,
    `- 密钥环境变量：\`${config.target.apiKeyEnv}\``
  ];

  if (page.facts.tables.length > 0) {
    sections.push("", "## 结构化参考", "", ...page.facts.tables);
  }

  if (page.facts.codeBlocks.length > 0) {
    sections.push("", "## 配置示例", "");
    page.facts.codeBlocks.slice(0, 5).forEach((block) => {
      sections.push(`\`\`\`${block.language}`, block.content, "```", "");
    });
  }

  sections.push(
    "## 上线前检查",
    "",
    "- 确认页面中的控制台入口与当前产品一致。",
    "- 使用测试账号走完完整流程。",
    "- 删除任何不属于 RouteMarket 的截图、联系方式或政策说明。"
  );

  return sections.join("\n");
}

function escapeFrontmatter(value) {
  return JSON.stringify(replaceSourceIdentity(value));
}

async function updateNavigationFiles() {
  for (const [relativePath, navigation] of Object.entries(
    config.migration.navigationFiles
  )) {
    const navigationPath = path.join(outputDir, relativePath);
    await mkdir(path.dirname(navigationPath), { recursive: true });
    await writeFile(
      navigationPath,
      `${JSON.stringify(navigation, null, 2)}\n`,
      "utf8"
    );
  }
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function isGeneratedFile(filePath) {
  const content = await readFile(filePath, "utf8");
  return (
    content.includes("{/* migration-source-path:") ||
    content.includes("<!-- migration-source-path:")
  );
}

function printReport(items) {
  for (const item of items) {
    console.log(
      [
        item.status.padEnd(18),
        item.sourcePath.padEnd(58),
        `endpoints=${item.endpointCount}`,
        `tables=${item.tableCount}`,
        `code=${item.codeBlockCount}`
      ].join(" ")
    );
  }

  console.log(
    `\n${items.length} source pages processed${shouldWrite ? "." : " (dry run)."}`
  );
}
