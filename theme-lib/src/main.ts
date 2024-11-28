import { BundledLanguage, BundledTheme, createHighlighter, Highlighter } from "shiki/bundle/full";
import * as transformers from "@shikijs/transformers";
import { Tab } from "./type";
import { CodeTabs } from "./components/CodeTabs";

import "./components/CodeTabs"

declare global {
  interface Window {
    shikiConfig: {
      themeLight: BundledTheme;
      themeDark: BundledTheme;
      duration: number;
      stagger: number;
    };
  }
}

// Check the first line of code block to see if it should use transformer
function processCodes(input: string) {
  const lines = input.split('\n');

  const firstLine = lines[0];
  const isUseTransformer = !firstLine.includes('[!no transformer]');

  const codes = isUseTransformer ? input : lines.slice(1).join('\n');

  return {
    isUseTransformer,
    codes,
  };
}

async function highlightAllCodeBlock(highlighter: Highlighter) {
  const codeElements = document.querySelectorAll("pre>code[class*=language-],pre>code[class*=lang-]");

  for (let i = 0; i < codeElements.length; i++) {
    const codeblock = codeElements[i];
    const lang = extractLanguageFromCodeElement(codeblock) || "text";
    const themeLight = window.shikiConfig.themeLight;
    const themeDark = window.shikiConfig.themeDark;

    const { isUseTransformer, codes } = processCodes(codeblock.textContent || "");

    await highlighter.loadLanguage(lang as BundledLanguage);

    codeblock.parentElement!.outerHTML = highlighter.codeToHtml(codes || "", {
      lang,
      themes: {
        light: themeLight,
        dark: themeDark,
      },
      transformers: isUseTransformer
        ? [
          transformers.transformerNotationDiff(),
          transformers.transformerNotationHighlight(),
          transformers.transformerNotationWordHighlight(),
          transformers.transformerNotationFocus(),
          transformers.transformerNotationErrorLevel(),
          transformers.transformerRenderWhitespace(),
        ]
        : [],
    });
  }
}

function extractLanguageFromCodeElement(codeElement: Element) {
  const classList = codeElement.classList;
  const supportedClasses = ["language-", "lang-"];
  for (let i = 0; i < classList.length; i++) {
    const className = classList[i];
    for (let j = 0; j < supportedClasses.length; j++) {
      const supportedClass = supportedClasses[j];
      if (className.startsWith(supportedClass)) {
        return className.substring(supportedClass.length);
      }
    }
  }
  return null;
}

async function initTabs(highlighter: Highlighter) {
  const columns = document.querySelectorAll('.columns[cols]');
  columns.forEach((column) => {
    const extractedTabs: Tab[] = [];

    const innerColumns = column.querySelectorAll('.column[index]');

    innerColumns.forEach(innerColumn => {
      const codeBlock = innerColumn.querySelector('pre>code');
      if (!codeBlock) return;

      const codeLines = (codeBlock.textContent ?? "").split('\n');

      const firstLine = codeLines[0].trim();
      const match = firstLine.match(/\[!code tab:(.*?)\]/);

      if (match) {
        const title = match[1];

        const code = codeLines.slice(1).join('\n').trim();

        const language = (extractLanguageFromCodeElement(codeBlock) ?? "typescript") as BundledLanguage;

        extractedTabs.push({ title, code, language });
      }
    });

    const codeTabsEl = document.createElement('code-tabs') as CodeTabs
    codeTabsEl.highlighter = highlighter;
    codeTabsEl.tabs = extractedTabs;

    column.replaceWith(codeTabsEl);
  })
}

document.addEventListener("DOMContentLoaded", async () => {
  const themeLight = window.shikiConfig.themeLight;
  const themeDark = window.shikiConfig.themeDark;
  const highlighter = await createHighlighter({
    themes: [themeDark, themeLight],
    langs: []
  })
  await initTabs(highlighter);
  await highlightAllCodeBlock(highlighter);
});
