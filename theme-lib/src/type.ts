import { BundledLanguage } from "shiki";

export interface Tab {
  title: string;
  code: string;
  language: BundledLanguage;
}
