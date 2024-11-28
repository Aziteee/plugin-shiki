import { Tab } from "../type";
import { Highlighter } from 'shiki';
import type { ShikiMagicMove } from "./ShikiMagicMove";

import "./ShikiMagicMove";

export class CodeTabs extends HTMLElement {

  highlighter!: Highlighter;

  private _tabs: Tab[] = [];
  private _index: number = 0;

  get tabs() {
    return this._tabs;
  }

  set tabs(value: Tab[]) {
    this._tabs = value;
  }

  get index() {
    return this._index;
  }

  set index(value: number) {
    this._index = value;
  }

  private magicMoveEl!: ShikiMagicMove;

  get tab() {
    return this.tabs[this.index];
  }

  constructor() {
    super();
  }

  async connectedCallback() {
    this.magicMoveEl = document.createElement('shiki-magic-move') as ShikiMagicMove;
    this.magicMoveEl.highlighter = this.highlighter;
    this.magicMoveEl.themes = {
      light: window.shikiConfig.themeLight,
      dark: window.shikiConfig.themeDark,
    };
    this.magicMoveEl.options = {
      duration: window.shikiConfig.duration,
      stagger: window.shikiConfig.stagger,
      lineNumbers: false,
    };

    this.innerHTML = `
      <div class="code-tabs">
        <div class="tabs">
          ${this.tabs.map((tab, index) => `<button class="tab-button" data-index="${index}">${tab.title}</button>`).join('\n')}
        </div>
        <div class="blocks">
        </div>
      </div>
    `
    await this.changeTab(0);

    this.querySelectorAll('.tab-button')!.forEach((button) => {
      button.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLButtonElement).dataset.index!);
        this.changeTab(index);
      });
    });

    this.querySelector('.blocks')!.appendChild(this.magicMoveEl);
  }

  async changeTab(idx: number) {
    this.index = idx;
    await this.highlighter.loadLanguage(this.tab.language);
    this.update();
    this.querySelectorAll('.tab-button')!.forEach((button, index) => {
      button.classList.toggle('active', index === idx);
    });
  }

  update() {
    this.magicMoveEl.lang = this.tab.language;
    this.magicMoveEl.code = this.tab.code;
  }
}
customElements.define('code-tabs', CodeTabs)
