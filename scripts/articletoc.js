function loadResource(type, attributes) {
  if (type === "style") {
    const style = document.createElement("style");
    style.textContent = attributes.css;
    document.head.appendChild(style);
  }
}

function createTOC() {
  // 查找文章内容容器 - 适配 flavor 主题
  const contentContainer =
    document.querySelector(".article-content") ||
    document.querySelector(".post-content") ||
    document.querySelector(".markdown-body");

  if (!contentContainer) return;

  // 查找文章中的标题
  const headings = contentContainer.querySelectorAll("h1, h2, h3, h4, h5, h6");
  if (headings.length === 0) return;

  const tocElement = document.createElement("div");
  tocElement.className = "toc";

  // 添加目录标题
  const tocTitle = document.createElement("div");
  tocTitle.className = "toc-title";
  tocTitle.textContent = "目录";
  tocElement.appendChild(tocTitle);

  headings.forEach((heading) => {
    if (!heading.id) {
      heading.id = heading.textContent
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
    }
    const link = document.createElement("a");
    link.href = "#" + heading.id;
    link.textContent = heading.textContent;
    link.className = "toc-link toc-link--" + heading.tagName.toLowerCase();
    link.style.paddingLeft = `${(parseInt(heading.tagName.charAt(1)) - 1) * 12 + 8}px`;

    // 点击目录项时关闭目录
    link.addEventListener("click", () => {
      setTimeout(() => {
        const toc = document.querySelector(".toc");
        const tocIcon = document.querySelector(".toc-icon");
        if (toc && toc.classList.contains("show")) {
          toc.classList.remove("show");
          tocIcon.classList.remove("active");
          tocIcon.textContent = "☰";
        }
      }, 100);
    });

    tocElement.appendChild(link);
  });

  document.body.appendChild(tocElement);
}

function toggleTOC() {
  const tocElement = document.querySelector(".toc");
  const tocIcon = document.querySelector(".toc-icon");
  if (tocElement) {
    tocElement.classList.toggle("show");
    tocIcon.classList.toggle("active");
    tocIcon.textContent = tocElement.classList.contains("show") ? "✖" : "☰";
  }
}

function updateTOCTheme() {
  const tocElement = document.querySelector(".toc");
  const tocIcon = document.querySelector(".toc-icon");
  if (!tocElement || !tocIcon) return;

  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  if (theme === "light") {
    tocElement.setAttribute("data-theme", "light");
    tocIcon.setAttribute("data-theme", "light");
  } else {
    tocElement.setAttribute("data-theme", "dark");
    tocIcon.setAttribute("data-theme", "dark");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  createTOC();

  // 如果没有创建目录（页面没有标题），则不添加按钮
  const tocElement = document.querySelector(".toc");
  if (!tocElement) return;

  const css = `
        .toc {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 260px;
            max-height: 60vh;
            background-color: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: 12px;
            padding: 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            overflow-y: auto;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px) scale(0.95);
            transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
        }
        .toc.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }
        .toc-title {
            font-family: var(--font-heading);
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-primary);
            padding: 12px 16px;
            border-bottom: 1px solid var(--color-border);
            position: sticky;
            top: 0;
            background-color: var(--color-surface);
            z-index: 1;
        }
        .toc a {
            display: block;
            color: var(--color-text-secondary);
            text-decoration: none;
            padding: 8px 16px;
            font-size: 13px;
            line-height: 1.5;
            border-bottom: 1px solid var(--color-border);
            transition: all 0.2s ease;
        }
        .toc a:last-child {
            border-bottom: none;
        }
        .toc a:hover {
            color: var(--color-text-primary);
            background-color: var(--color-border);
        }
        .toc a.toc-link--h1 {
            font-weight: 600;
            color: var(--color-text-primary);
        }
        .toc-icon {
            position: fixed;
            bottom: 20px;
            right: 20px;
            cursor: pointer;
            font-size: 18px;
            background-color: var(--color-accent);
            color: var(--color-bg);
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1001;
            transition: all 0.3s ease;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            outline: none;
        }
        .toc-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .toc-icon:active {
            transform: scale(0.95);
        }
        .toc-icon.active {
            background-color: var(--color-text-primary);
            color: var(--color-bg);
            transform: rotate(90deg);
        }
        
        /* 移动端适配 */
        @media (max-width: 768px) {
            .toc {
                width: calc(100vw - 40px);
                max-width: 300px;
                right: 20px;
            }
        }
    `;
  loadResource("style", { css: css });

  const tocIcon = document.createElement("div");
  tocIcon.className = "toc-icon";
  tocIcon.textContent = "☰";
  tocIcon.onclick = (e) => {
    e.stopPropagation();
    toggleTOC();
  };
  document.body.appendChild(tocIcon);

  // 点击外部关闭目录
  document.addEventListener("click", (e) => {
    const toc = document.querySelector(".toc");
    const tocIcon = document.querySelector(".toc-icon");
    if (
      toc &&
      toc.classList.contains("show") &&
      !toc.contains(e.target) &&
      !e.target.classList.contains("toc-icon")
    ) {
      toc.classList.remove("show");
      tocIcon.classList.remove("active");
      tocIcon.textContent = "☰";
    }
  });

  // 监听主题变化
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "data-theme"
      ) {
        updateTOCTheme();
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // 初始设置主题
  updateTOCTheme();
});
