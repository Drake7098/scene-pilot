import React from "react";
import type { Lang } from "../../../i18n";

type Props = {
  lang: Lang;
  onGenerate: () => void;
  busy: boolean;
};

export function ExportGenerateSection({ lang, onGenerate, busy }: Props) {
  void lang;
  void onGenerate;
  void busy;
  // Generate action is centralized in ProWorkspaceShell bottom action bar.
  return null;
}
