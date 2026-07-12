import type { DetailedHTMLProps, HTMLAttributes } from "react";

interface TypeScriptEditorElement extends HTMLElement {
  value: string;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ts-editor": DetailedHTMLProps<HTMLAttributes<TypeScriptEditorElement>, TypeScriptEditorElement> & {
        component?: string;
        room?: string;
        value?: string;
        url?: string;
      };
    }
  }
}

export {};
