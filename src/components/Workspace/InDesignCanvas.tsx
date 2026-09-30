import React, { useState, useRef, useEffect } from 'react';
import { LayoutDocument, ToolType } from '../../types';

interface InDesignCanvasProps {
  doc: LayoutDocument;
  onUpdateDoc: (updated: Partial<LayoutDocument>) => void;
  activeTool: ToolType;
  onSelectTool?: (tool: ToolType) => void;
  isOverset: boolean;
  currentUserSeat?: string;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type BoxTarget = 'border' | 'text';

export const InDesignCanvas: React.FC<InDesignCanvasProps> = ({
  doc,
  onUpdateDoc,
  activeTool,
  onSelectTool,
  isOverset
}) => {
  const [cursorPos, setCursorPos] = useState<{ xMm: number; yMm: number }>({ xMm: 0, yMm: 0 });
  const [selectedBox, setSelectedBox] = useState<BoxTarget>('border');
  const [isMoveTogether, setIsMoveTogether] = useState<boolean>(false);

  // Rich text editor ref and floating selection toolbar
  const editorRef = useRef<HTMLDivElement>(null);
  const [floatingToolbar, setFloatingToolbar] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [draggingTarget, setDraggingTarget] = useState<BoxTarget | null>(null);

  // Resizing state
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizingTarget, setResizingTarget] = useState<BoxTarget | null>(null);

  // Pan canvas state
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: doc.panX || 0,
    y: doc.panY || 0
  });

  const panStartRef = useRef<{ startX: number; startY: number; initPanX: number; initPanY: number }>({
    startX: 0,
    startY: 0,
    initPanX: 0,
    initPanY: 0
  });

  // Coordinates resolution
  const borderX = doc.posX;
  const borderY = doc.posY;
  const borderWidth = doc.frameWidth;
  const borderHeight = doc.frameHeight;

  // Text box coordinates (default to 2mm inset inside border box if not explicitly set)
  const textX = doc.textPosX !== undefined ? doc.textPosX : borderX + 2;
  const textY = doc.textPosY !== undefined ? doc.textPosY : borderY + 2;
  const textW = doc.textWidth !== undefined ? doc.textWidth : Math.max(20, borderWidth - 4);
  const textH = doc.textHeight !== undefined ? doc.textHeight : Math.max(20, borderHeight - 4);

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initBorderX: number;
    initBorderY: number;
    initBorderW: number;
    initBorderH: number;
    initTextX: number;
    initTextY: number;
    initTextW: number;
    initTextH: number;
  }>({
    startX: 0,
    startY: 0,
    initBorderX: borderX,
    initBorderY: borderY,
    initBorderW: borderWidth,
    initBorderH: borderHeight,
    initTextX: textX,
    initTextY: textY,
    initTextW: textW,
    initTextH: textH
  });

  const isPreview = doc.viewportMode === 'preview' || doc.viewportMode === 'print_preview';
  const isNewsprint = doc.viewportMode === 'newsprint';
  const isTypeTool = activeTool === 'type';

  // Handle Mouse Move for Rulers, Dragging, and Resizing
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // 1. Pan mode with Hand tool or Middle-click drag
    if (isPanning) {
      const deltaX = e.clientX - panStartRef.current.startX;
      const deltaY = e.clientY - panStartRef.current.startY;
      setPanOffset({
        x: panStartRef.current.initPanX + deltaX,
        y: panStartRef.current.initPanY + deltaY
      });
      return;
    }

    const sheetEl = document.getElementById('a4-canvas-sheet');
    if (!sheetEl) return;
    const rect = sheetEl.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xMm = Math.max(0, Math.min(210, (clientX / rect.width) * 210));
    const yMm = Math.max(0, Math.min(297, (clientY / rect.height) * 297));
    setCursorPos({ xMm: Math.round(xMm), yMm: Math.round(yMm) });

    // 2. Dragging Frame Position
    if (isDragging && draggingTarget) {
      const deltaX = ((e.clientX - dragStartRef.current.startX) / rect.width) * 210;
      const deltaY = ((e.clientY - dragStartRef.current.startY) / rect.height) * 297;

      if (isMoveTogether) {
        // Move both Border Box and Text Box together
        const newBorderX = Math.max(2, Math.min(210 - dragStartRef.current.initBorderW - 2, dragStartRef.current.initBorderX + deltaX));
        const newBorderY = Math.max(2, Math.min(297 - dragStartRef.current.initBorderH - 2, dragStartRef.current.initBorderY + deltaY));
        const actualDeltaX = newBorderX - dragStartRef.current.initBorderX;
        const actualDeltaY = newBorderY - dragStartRef.current.initBorderY;

        onUpdateDoc({
          posX: Math.round(newBorderX),
          posY: Math.round(newBorderY),
          textPosX: Math.round(dragStartRef.current.initTextX + actualDeltaX),
          textPosY: Math.round(dragStartRef.current.initTextY + actualDeltaY)
        });
      } else if (draggingTarget === 'border') {
        // Move ONLY Border Box
        const newBorderX = Math.max(2, Math.min(210 - dragStartRef.current.initBorderW - 2, dragStartRef.current.initBorderX + deltaX));
        const newBorderY = Math.max(2, Math.min(297 - dragStartRef.current.initBorderH - 2, dragStartRef.current.initBorderY + deltaY));
        onUpdateDoc({
          posX: Math.round(newBorderX),
          posY: Math.round(newBorderY)
        });
      } else if (draggingTarget === 'text') {
        // Move ONLY Text Box
        const newTextX = Math.max(2, Math.min(210 - dragStartRef.current.initTextW - 2, dragStartRef.current.initTextX + deltaX));
        const newTextY = Math.max(2, Math.min(297 - dragStartRef.current.initTextH - 2, dragStartRef.current.initTextY + deltaY));
        onUpdateDoc({
          textPosX: Math.round(newTextX),
          textPosY: Math.round(newTextY)
        });
      }
      return;
    }

    // 3. Resizing Frame Dimensions via 8 Handles
    if (activeResizeHandle && resizingTarget) {
      const deltaX = ((e.clientX - dragStartRef.current.startX) / rect.width) * 210;
      const deltaY = ((e.clientY - dragStartRef.current.startY) / rect.height) * 297;

      if (resizingTarget === 'border') {
        let newW = dragStartRef.current.initBorderW;
        let newH = dragStartRef.current.initBorderH;
        let newX = dragStartRef.current.initBorderX;
        let newY = dragStartRef.current.initBorderY;

        if (activeResizeHandle.includes('e')) {
          newW = Math.max(20, Math.min(210 - newX - 2, dragStartRef.current.initBorderW + deltaX));
        }
        if (activeResizeHandle.includes('s')) {
          newH = Math.max(20, Math.min(297 - newY - 2, dragStartRef.current.initBorderH + deltaY));
        }
        if (activeResizeHandle.includes('w')) {
          const potentialW = dragStartRef.current.initBorderW - deltaX;
          if (potentialW >= 20 && dragStartRef.current.initBorderX + deltaX >= 2) {
            newW = potentialW;
            newX = dragStartRef.current.initBorderX + deltaX;
          }
        }
        if (activeResizeHandle.includes('n')) {
          const potentialH = dragStartRef.current.initBorderH - deltaY;
          if (potentialH >= 20 && dragStartRef.current.initBorderY + deltaY >= 2) {
            newH = potentialH;
            newY = dragStartRef.current.initBorderY + deltaY;
          }
        }

        onUpdateDoc({
          frameWidth: Math.round(newW),
          frameHeight: Math.round(newH),
          posX: Math.round(newX),
          posY: Math.round(newY)
        });
      } else if (resizingTarget === 'text') {
        let newW = dragStartRef.current.initTextW;
        let newH = dragStartRef.current.initTextH;
        let newX = dragStartRef.current.initTextX;
        let newY = dragStartRef.current.initTextY;

        if (activeResizeHandle.includes('e')) {
          newW = Math.max(15, Math.min(210 - newX - 2, dragStartRef.current.initTextW + deltaX));
        }
        if (activeResizeHandle.includes('s')) {
          newH = Math.max(15, Math.min(297 - newY - 2, dragStartRef.current.initTextH + deltaY));
        }
        if (activeResizeHandle.includes('w')) {
          const potentialW = dragStartRef.current.initTextW - deltaX;
          if (potentialW >= 15 && dragStartRef.current.initTextX + deltaX >= 2) {
            newW = potentialW;
            newX = dragStartRef.current.initTextX + deltaX;
          }
        }
        if (activeResizeHandle.includes('n')) {
          const potentialH = dragStartRef.current.initTextH - deltaY;
          if (potentialH >= 15 && dragStartRef.current.initTextY + deltaY >= 2) {
            newH = potentialH;
            newY = dragStartRef.current.initTextY + deltaY;
          }
        }

        // Auto calculate columns based on text width
        let cols = doc.columns;
        if (newW < 45) cols = 1;
        else if (newW >= 45 && newW < 85) cols = 2;
        else if (newW >= 85 && newW < 120) cols = 3;
        else if (newW >= 120) cols = 4;

        onUpdateDoc({
          textWidth: Math.round(newW),
          textHeight: Math.round(newH),
          textPosX: Math.round(newX),
          textPosY: Math.round(newY),
          columns: cols
        });
      }
    }
  };

  // Start dragging
  const handleBoxMouseDown = (e: React.MouseEvent, target: BoxTarget) => {
    if (activeTool === 'hand') return;
    if (activeTool !== 'select' && activeTool !== 'direct') return;
    if (isPreview) return;

    e.stopPropagation();
    setSelectedBox(target);
    setIsDragging(true);
    setDraggingTarget(target);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initBorderX: borderX,
      initBorderY: borderY,
      initBorderW: borderWidth,
      initBorderH: borderHeight,
      initTextX: textX,
      initTextY: textY,
      initTextW: textW,
      initTextH: textH
    };
  };

  // Start resizing
  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle, target: BoxTarget) => {
    e.stopPropagation();
    setSelectedBox(target);
    setActiveResizeHandle(handle);
    setResizingTarget(target);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initBorderX: borderX,
      initBorderY: borderY,
      initBorderW: borderWidth,
      initBorderH: borderHeight,
      initTextX: textX,
      initTextY: textY,
      initTextW: textW,
      initTextH: textH
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'hand' || e.button === 1) {
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initPanX: panOffset.x,
        initPanY: panOffset.y
      };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingTarget(null);
    setActiveResizeHandle(null);
    setResizingTarget(null);
    setIsPanning(false);
  };

  // Center / Snap Text Box back inside Border Box
  const handleCenterTextInBorder = () => {
    const inset = 2; // 2mm inset
    onUpdateDoc({
      textPosX: borderX + inset,
      textPosY: borderY + inset,
      textWidth: Math.max(15, borderWidth - inset * 2),
      textHeight: Math.max(15, borderHeight - inset * 2)
    });
  };

  // Convert plain text to structured paragraphs with independent text alignment
  const buildDefaultHtml = (text: string, kicker?: string, title?: string, subHeader?: string, defaultAlign = 'justify') => {
    if (!text) {
      const parts: string[] = [];
      if (kicker) parts.push(`<p style="text-align: center; font-weight: bold; margin-bottom: 6px;">${kicker.replace(/\n/g, '<br/>')}</p>`);
      if (title) parts.push(`<p style="text-align: center; font-weight: bold; font-size: 1.15em; margin-bottom: 6px;">${title.replace(/\n/g, '<br/>')}</p>`);
      if (subHeader) parts.push(`<p style="text-align: center; font-style: italic; margin-bottom: 6px;">${subHeader.replace(/\n/g, '<br/>')}</p>`);
      return parts.join('') || '<p></p>';
    }
    const paras = text.split(/\n\n+/);
    return paras
      .map((p) => `<p style="text-align: ${defaultAlign}; margin-bottom: 6px; text-justify: inter-word;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  };

  // Keep editor content synchronized with doc state
  useEffect(() => {
    if (!editorRef.current) return;
    const initialHtml =
      doc.bodyHtml ||
      buildDefaultHtml(doc.bodyText, doc.kicker, doc.title, doc.subHeader, doc.alignment);
    if (editorRef.current.innerHTML !== initialHtml && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [doc.bodyHtml, doc.bodyText]);

  // Save current HTML and plain text back to doc state
  const saveContent = () => {
    if (!editorRef.current) return;
    onUpdateDoc({
      bodyHtml: editorRef.current.innerHTML,
      bodyText: editorRef.current.innerText
    });
  };

  // Detect selection inside editor to position floating formatting bar
  const updateSelectionToolbar = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) {
      setFloatingToolbar({ visible: false, x: 0, y: 0 });
      return;
    }
    if (editorRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const sheetEl = document.getElementById('a4-canvas-sheet');
      if (sheetEl) {
        const sheetRect = sheetEl.getBoundingClientRect();
        const x = rect.left - sheetRect.left + rect.width / 2;
        const y = rect.top - sheetRect.top - 46;
        setFloatingToolbar({ visible: true, x, y });
        return;
      }
    }
    setFloatingToolbar({ visible: false, x: 0, y: 0 });
  };

  // Apply format ONLY to the selected text range
  const applySelectionFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    saveContent();
  };

  // Apply alignment ONLY to the highlighted paragraph/block
  const applySelectionParagraphAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }
      let targetBlock: HTMLElement | null = null;
      while (node && node !== editorRef.current) {
        if (
          node instanceof HTMLElement &&
          (node.tagName === 'P' ||
            node.tagName === 'DIV' ||
            node.tagName === 'H1' ||
            node.tagName === 'H2' ||
            node.tagName === 'H3')
        ) {
          targetBlock = node;
          break;
        }
        node = node.parentNode;
      }
      if (targetBlock) {
        targetBlock.style.textAlign = align;
        targetBlock.style.textJustify = align === 'justify' ? 'inter-word' : '';
        saveContent();
        return;
      }
      const cmd =
        align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : align === 'right' ? 'justifyRight' : 'justifyFull';
      document.execCommand(cmd, false);
      saveContent();
    }
  };

  // Adjust font size ONLY for the selected text
  const adjustSelectionFontSize = (deltaPt: number) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    const currentSize = doc.fontSize || 5.2;
    const newSize = Math.max(4, Math.min(36, +(currentSize + deltaPt).toFixed(1)));
    span.style.fontSize = `${newSize}pt`;
    span.style.lineHeight = `${(newSize * 1.25).toFixed(1)}pt`;
    try {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
      saveContent();
    } catch (e) {
      console.error(e);
    }
  };

  const getFontFamilyCss = () => {
    if (doc.fontFamily === 'Minion Pro' || doc.fontFamily === 'Times New Roman') {
      return '"Newsreader", "Times New Roman", "Minion Pro", Georgia, serif';
    }
    if (doc.fontFamily === 'Garamond') return '"Adobe Garamond", "Garamond", "Georgia", serif';
    if (doc.fontFamily === 'Caslon') return '"Caslon Pro", "Caslon", Georgia, serif';
    if (doc.fontFamily === 'Cinzel') return '"Cinzel", "Times New Roman", serif';
    if (doc.fontFamily === 'Helvetica') return '"Inter", "Helvetica Neue", Arial, sans-serif';
    return '"Inter", Arial, sans-serif';
  };

  const xTicks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 210];
  const yTicks = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 297];

  return (
    <div
      className={`flex-1 relative overflow-auto flex flex-col items-center justify-start select-none transition-colors ${
        doc.themeMode === 'dark'
          ? 'bg-[#18181b]'
          : isNewsprint
          ? 'bg-[#e2ded5]'
          : 'bg-[#d8dbe2]'
      } ${activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleCanvasMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Top Horizontal Millimeter Ruler */}
      {!isPreview && (
        <div className="sticky top-0 left-0 w-full h-5 bg-[#e9ecf2] border-b border-slate-300 z-30 flex items-center shadow-2xs">
          <div className="w-6 h-full bg-[#dfe3eb] border-r border-slate-300 flex items-center justify-center font-mono text-[8px] text-slate-500">
            mm
          </div>
          <div className="relative flex-1 h-full overflow-hidden">
            {xTicks.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 flex flex-col items-center text-[9px] font-mono text-slate-500"
                style={{ left: `${(tick / 210) * 100}%` }}
              >
                <div className="h-2 w-[1px] bg-slate-400"></div>
                <span className="leading-none text-[8px] -ml-2">{tick}</span>
              </div>
            ))}
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-blue-600 pointer-events-none z-30"
              style={{ left: `${(cursorPos.xMm / 210) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Center Canvas Drafting Viewport */}
      <div className="flex w-full flex-1 relative">
        {/* Left Vertical Millimeter Ruler */}
        {!isPreview && (
          <div className="sticky left-0 top-0 w-6 bg-[#e9ecf2] border-r border-slate-300 z-20 flex flex-col">
            <div className="relative flex-1 w-full">
              {yTicks.map((tick) => (
                <div
                  key={tick}
                  className="absolute left-0 flex items-center text-[8px] font-mono text-slate-500"
                  style={{ top: `${(tick / 297) * 100}%` }}
                >
                  <div className="w-2 h-[1px] bg-slate-400"></div>
                  <span className="leading-none text-[8px] ml-0.5">{tick}</span>
                </div>
              ))}
              <div
                className="absolute left-0 right-0 h-[1px] bg-blue-600 pointer-events-none z-30"
                style={{ top: `${(cursorPos.yMm / 297) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* The White/Newsprint Drafting Sheet */}
        <div className="flex-1 p-6 md:p-10 flex items-center justify-center min-w-[720px]">
          <div
            id="a4-canvas-sheet"
            className={`shadow-2xl relative transition-transform duration-100 ${
              isNewsprint ? 'bg-[#fcfaf2]' : 'bg-white'
            }`}
            style={{
              width: '630px',
              height: '891px',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${doc.zoom / 100})`,
              transformOrigin: 'top center'
            }}
          >
            {/* Print Preview Crop Marks outside sheet */}
            {doc.viewportMode === 'print_preview' && (
              <div className="absolute -inset-4 pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-0.5 bg-slate-900"></div>
                <div className="absolute top-0 left-0 w-0.5 h-4 bg-slate-900"></div>
                <div className="absolute top-0 right-0 w-4 h-0.5 bg-slate-900"></div>
                <div className="absolute top-0 right-0 w-0.5 h-4 bg-slate-900"></div>
                <div className="absolute bottom-0 left-0 w-4 h-0.5 bg-slate-900"></div>
                <div className="absolute bottom-0 left-0 w-0.5 h-4 bg-slate-900"></div>
                <div className="absolute bottom-0 right-0 w-4 h-0.5 bg-slate-900"></div>
                <div className="absolute bottom-0 right-0 w-0.5 h-4 bg-slate-900"></div>
              </div>
            )}

            {/* Margin Bleed Guides */}
            {!isPreview && (
              <div
                className="absolute pointer-events-none border border-cyan-400/40"
                style={{
                  top: '18px',
                  left: '20px',
                  right: '20px',
                  bottom: '22px'
                }}
              />
            )}

            {/* Broadsheet 8-Column / Tabloid 6-Column Newspaper Grid Rails */}
            {!isPreview && doc.newspaperGrid !== 'none' && (
              <div
                className="absolute inset-0 pointer-events-none p-5 grid gap-2 opacity-30 z-0"
                style={{
                  gridTemplateColumns:
                    doc.newspaperGrid === 'broadsheet' ? 'repeat(8, 1fr)' : 'repeat(6, 1fr)'
                }}
              >
                {Array.from({ length: doc.newspaperGrid === 'broadsheet' ? 8 : 6 }).map((_, colIdx) => (
                  <div
                    key={colIdx}
                    className="h-full bg-blue-100/50 border-x border-blue-300/40 flex items-start justify-center pt-1"
                  >
                    <span className="font-mono text-[7px] text-blue-700 font-bold">Col {colIdx + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Baseline Grid lines */}
            {!isPreview && doc.snapBaselineGrid && (
              <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden z-0">
                {Array.from({ length: 55 }).map((_, i) => (
                  <div key={i} className="w-full border-b border-blue-200" style={{ height: '16px' }} />
                ))}
              </div>
            )}

            {/* ============================================================== */}
            {/* ELEMENT 1: BORDER BOX (GARISAN KOTAK BORDER IKLAN)             */}
            {/* ============================================================== */}
            <div
              id="indesign-active-border-box"
              onMouseDown={(e) => handleBoxMouseDown(e, 'border')}
              className={`absolute z-15 transition-shadow select-none ${
                selectedBox === 'border' && !isPreview
                  ? 'ring-2 ring-blue-500/90 shadow-lg'
                  : 'hover:ring-1 hover:ring-blue-300'
              } ${activeTool === 'select' && !isPreview ? 'cursor-move' : ''}`}
              style={{
                left: `${(borderX / 210) * 100}%`,
                top: `${(borderY / 297) * 100}%`,
                width: `${(borderWidth / 210) * 100}%`,
                height: `${(borderHeight / 297) * 100}%`,
                backgroundColor: isNewsprint ? '#fbf8ef' : '#ffffff',
                border:
                  doc.borderStyle === 'double'
                    ? '3px double #000000'
                    : doc.borderStyle === 'oxford'
                    ? '3px solid #000000'
                    : doc.borderStyle === 'dashed'
                    ? '1px dashed #000000'
                    : doc.borderStyle === 'dotted'
                    ? '1px dotted #000000'
                    : doc.borderStyle === 'none'
                    ? isPreview ? 'none' : '1px dashed #cbd5e1'
                    : `${doc.borderWidth || 0.5}px solid #000000`
              }}
            >
              {/* 8-Point Resize Handles for BORDER BOX */}
              {!isPreview && selectedBox === 'border' && (
                <>
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'nw', 'border')}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-600 border border-white cursor-nwse-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Border NW"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'ne', 'border')}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-600 border border-white cursor-nesw-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Border NE"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'se', 'border')}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-600 border border-white cursor-nwse-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Border SE"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'sw', 'border')}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-600 border border-white cursor-nesw-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Border SW"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'n', 'border')}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 border border-white cursor-ns-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Border Atas"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 's', 'border')}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 border border-white cursor-ns-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Border Bawah"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'w', 'border')}
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-600 border border-white cursor-ew-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Border Kiri"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'e', 'border')}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-blue-600 border border-white cursor-ew-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Border Kanan"
                  />
                </>
              )}
            </div>

            {/* ============================================================== */}
            {/* ELEMENT 2: TEXT BOX (KOTAK TEKS BERASINGAN)                   */}
            {/* ============================================================== */}
            <div
              id="indesign-active-text-box"
              onMouseDown={(e) => handleBoxMouseDown(e, 'text')}
              onDoubleClick={() => {
                setSelectedBox('text');
                if (onSelectTool) onSelectTool('type');
              }}
              className={`absolute z-20 flex flex-col justify-start transition-shadow ${
                isPreview
                  ? 'border-none shadow-none'
                  : selectedBox === 'text'
                  ? 'ring-2 ring-pink-500 shadow-xl'
                  : 'hover:ring-1 hover:ring-pink-300 ring-1 ring-blue-400/40 border border-dashed border-pink-400/60'
              } ${activeTool === 'select' && !isPreview ? 'cursor-move' : ''}`}
              style={{
                left: `${(textX / 210) * 100}%`,
                top: `${(textY / 297) * 100}%`,
                width: `${(textW / 210) * 100}%`,
                height: `${(textH / 297) * 100}%`,
                backgroundColor: 'transparent'
              }}
            >
              {/* 8-Point Resize Handles for TEXT BOX */}
              {!isPreview && selectedBox === 'text' && !isTypeTool && (
                <>
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'nw', 'text')}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-pink-600 border border-white cursor-nwse-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Kotak Teks NW"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'ne', 'text')}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-pink-600 border border-white cursor-nesw-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Kotak Teks NE"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'se', 'text')}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-pink-600 border border-white cursor-nwse-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Kotak Teks SE"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'sw', 'text')}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-pink-600 border border-white cursor-nesw-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Kotak Teks SW"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'n', 'text')}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-600 border border-white cursor-ns-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Kotak Teks Atas"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 's', 'text')}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-600 border border-white cursor-ns-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Kotak Teks Bawah"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'w', 'text')}
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-pink-600 border border-white cursor-ew-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Kotak Teks Kiri"
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'e', 'text')}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-pink-600 border border-white cursor-ew-resize shadow-xs hover:scale-125 z-30"
                    title="Ubah saiz Kotak Teks Kanan"
                  />
                </>
              )}

              {/* Overset Marker */}
              {!isPreview && (
                isOverset ? (
                  <div
                    title="Overset Text Marker [+]: Teks melimpah keluar! Klik Auto-Fit atau kecilkan fon."
                    className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-red-600 text-white font-mono text-[12px] font-bold flex items-center justify-center rounded shadow-lg animate-bounce border-2 border-white z-30"
                  >
                    +
                  </div>
                ) : (
                  <div
                    title="Teks Memuatkan Ruang Sepenuhnya"
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-600 text-white font-mono text-[9px] font-bold flex items-center justify-center rounded-xs shadow-xs border border-white z-30"
                  >
                    ✓
                  </div>
                )
              )}

              {/* Inner Editable Content with Independent Rich Text & Paragraph Alignment */}
              <div
                id="indesign-editable-content"
                ref={editorRef}
                contentEditable={isTypeTool}
                suppressContentEditableWarning
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    document.execCommand('insertText', false, '    ');
                  }
                }}
                onInput={saveContent}
                onBlur={saveContent}
                onMouseUp={updateSelectionToolbar}
                onKeyUp={updateSelectionToolbar}
                className={`w-full h-full overflow-auto text-black transition-colors ${
                  isTypeTool
                    ? 'select-text cursor-text outline-none ring-2 ring-blue-500 p-2 bg-white/90'
                    : 'select-none p-1.5'
                }`}
                style={{
                  fontFamily: getFontFamilyCss(),
                  fontSize: `${doc.fontSize || 5.2}pt`,
                  lineHeight: `${doc.lineHeight || 6.5}pt`,
                  fontWeight: doc.fontWeight === 'bold' ? 'bold' : 'normal',
                  fontStyle: doc.isItalic ? 'italic' : 'normal',
                  textDecoration: `${doc.isUnderline ? 'underline ' : ''}${doc.isStrikethrough ? 'line-through' : ''}`.trim() || 'none',
                  textTransform: doc.textTransform && doc.textTransform !== 'none' ? doc.textTransform : undefined,
                  color: doc.textColor || undefined,
                  backgroundColor: doc.textHighlight && doc.textHighlight !== 'none' ? doc.textHighlight : undefined,
                  textIndent: doc.firstLineIndentMm ? `${doc.firstLineIndentMm}mm` : undefined,
                  tabSize: 4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  columnCount: doc.columns > 1 ? doc.columns : undefined,
                  columnGap: doc.columns > 1 ? `${doc.gutter || 0.05}mm` : undefined
                }}
              />
            </div>

            {/* Floating Rich Text Selection Formatting Bar */}
            {!isPreview && floatingToolbar.visible && (
              <div
                className="absolute z-50 flex items-center gap-1 p-1 bg-slate-900/95 text-white rounded-lg shadow-2xl backdrop-blur-xs font-mono text-[10px] select-none border border-slate-700 animate-in fade-in zoom-in-95 duration-100"
                style={{
                  left: `${floatingToolbar.x}px`,
                  top: `${floatingToolbar.y}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <span className="text-[9px] text-pink-400 font-bold px-1 uppercase tracking-wider">
                  Teks Dipilih
                </span>

                <div className="w-px h-3 bg-slate-700 mx-0.5" />

                {/* Bold */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySelectionFormat('bold');
                  }}
                  title="Bold (Ctrl+B)"
                  className="w-5 h-5 rounded hover:bg-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                >
                  B
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySelectionFormat('italic');
                  }}
                  title="Italic (Ctrl+I)"
                  className="w-5 h-5 rounded hover:bg-slate-700 italic font-serif flex items-center justify-center cursor-pointer transition-colors"
                >
                  I
                </button>

                {/* Underline */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySelectionFormat('underline');
                  }}
                  title="Underline (Ctrl+U)"
                  className="w-5 h-5 rounded hover:bg-slate-700 underline flex items-center justify-center cursor-pointer transition-colors"
                >
                  U
                </button>

                <div className="w-px h-3 bg-slate-700 mx-0.5" />

                {/* Align Left */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySelectionParagraphAlignment('left');
                  }}
                  title="Align Left (Perenggan ini sahaja)"
                  className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px]">format_align_left</span>
                </button>

                {/* Align Center */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySelectionParagraphAlignment('center');
                  }}
                  title="Align Center (Perenggan ini sahaja)"
                  className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px]">format_align_center</span>
                </button>

                {/* Align Right */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySelectionParagraphAlignment('right');
                  }}
                  title="Align Right (Perenggan ini sahaja)"
                  className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px]">format_align_right</span>
                </button>

                {/* Justify */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySelectionParagraphAlignment('justify');
                  }}
                  title="Justify (Perenggan ini sahaja)"
                  className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px]">format_align_justify</span>
                </button>

                <div className="w-px h-3 bg-slate-700 mx-0.5" />

                {/* Font Size A- / A+ */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    adjustSelectionFontSize(-0.5);
                  }}
                  title="Kecilkan Saiz Teks (-0.5pt)"
                  className="px-1 h-5 rounded hover:bg-slate-700 text-[9px] font-bold flex items-center justify-center cursor-pointer transition-colors"
                >
                  A-
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    adjustSelectionFontSize(0.5);
                  }}
                  title="Besarkan Saiz Teks (+0.5pt)"
                  className="px-1 h-5 rounded hover:bg-slate-700 text-[9px] font-bold flex items-center justify-center cursor-pointer transition-colors"
                >
                  A+
                </button>
              </div>
            )}

            {/* Bottom Footer Review Sheet Line */}
            <div
              className="absolute left-6 right-6 bottom-4 flex items-center justify-between font-sans text-[11px] font-bold text-slate-700 uppercase tracking-wider"
              style={{ top: '855px' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400">§</span>
                <span>{doc.footerTag || 'DOKUMEN MAHKAMAH & NOTIS AWAM'}</span>
              </div>
              <div className="font-sans font-black text-slate-900">
                {doc.pageNumber || 'PAGE 1'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
