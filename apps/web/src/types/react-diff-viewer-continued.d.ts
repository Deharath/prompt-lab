declare module 'react-diff-viewer-continued' {
  import type { ComponentType, ReactElement, MouseEvent } from 'react';

  export enum DiffMethod {
    CHARS = 'CHARS',
    WORDS = 'WORDS',
    LINES = 'LINES',
  }

  export interface ReactDiffViewerProps {
    oldValue: string | object;
    newValue: string | object;
    splitView?: boolean;
    disableWordDiff?: boolean;
    compareMethod?: DiffMethod;
    extraLinesSurroundingDiff?: number;
    hideLineNumbers?: boolean;
    hideMarkers?: boolean;
    alwaysShowLines?: string[];
    showDiffOnly?: boolean;
    renderContent?: (source: string) => ReactElement;
    codeFoldMessageRenderer?: (
      totalFoldedLines: number,
      leftStartLineNumber: number,
      rightStartLineNumber: number,
    ) => ReactElement;
    onLineNumberClick?: (
      lineId: string,
      event: MouseEvent<HTMLTableCellElement>,
    ) => void;
    renderGutter?: (data: unknown) => ReactElement;
    highlightLines?: string[];
    styles?: Record<string, unknown>;
    useDarkTheme?: boolean;
    leftTitle?: string | ReactElement;
    rightTitle?: string | ReactElement;
    linesOffset?: number;
  }

  const DiffViewer: ComponentType<ReactDiffViewerProps>;
  export default DiffViewer;
  export { DiffMethod, ReactDiffViewerProps };
}
