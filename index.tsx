
import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as htmlToImage from 'html-to-image';
import { GoogleGenAI, Type } from "@google/genai";

// --- DATA ---
const CATEGORIES = [
    "기술 & 혁신", "라이프스타일 & 건강", "음식 & 레시피", "여행 & 모험",
    "비즈니스 & 금융", "예술 & 창의성", "교육 & 학습", "건강 & 피트니스", "자연 & 환경"
];

const CATEGORY_STYLES = {
    "기술 & 혁신": "linear-gradient(45deg, #37474F, #263238)",
    "라이프스타일 & 건강": "linear-gradient(45deg, #66BB6A, #43A047)",
    "음식 & 레시피": "linear-gradient(45deg, #F9A825, #FDD835)",
    "여행 & 모험": "linear-gradient(45deg, #29B6F6, #03A9F4)",
    "비즈니스 & 금융": "linear-gradient(45deg, #1E88E5, #1565C0)",
    "예술 & 창의성": 'linear-gradient(to right, #fa709a, #fee140)',
    "교육 & 학습": "linear-gradient(45deg, #8E44AD, #9B59B6)",
    "건강 & 피트니스": "linear-gradient(45deg, #2E7D32, #1B5E20)",
    "자연 & 환경": 'linear-gradient(to right, #134E5E, #71B280)',
};

const LIFESTYLE_DEFAULTS = {
    titleWeight: 600, titleSize: 3.8, titleColor: '#FFFFFF',
    subtitleWeight: 600, subtitleSize: 1.5, subtitleColor: '#E0E0E0', ratio: '1:1'
};

const CATEGORY_DEFAULT_SETTINGS = {
    "기술 & 혁신": LIFESTYLE_DEFAULTS,
    "라이프스타일 & 건강": LIFESTYLE_DEFAULTS,
    "음식 & 레시피": LIFESTYLE_DEFAULTS,
    "여행 & 모험": LIFESTYLE_DEFAULTS,
    "비즈니스 & 금융": LIFESTYLE_DEFAULTS,
    "예술 & 창의성": LIFESTYLE_DEFAULTS,
    "교육 & 학습": LIFESTYLE_DEFAULTS,
    "건강 & 피트니스": LIFESTYLE_DEFAULTS,
    "자연 & 환경": LIFESTYLE_DEFAULTS,
};


const OVERLAY_PATTERNS = [
    { name: '없음', value: '' },
    { name: '대각선', value: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' },
    { name: '점', value: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'5\' cy=\'5\' r=\'2\'/%3E%3Ccircle cx=\'15\' cy=\'15\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")' },
    { name: '격자', value: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 10h20M10 0v20\' stroke=\'%23000000\' stroke-opacity=\'0.2\' stroke-width=\'1\'/%3E%3C/svg%3E")' },
    { name: '체크', value: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 10 10\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.1\'%3E%3Crect width=\'5\' height=\'5\'/%3E%3Crect x=\'5\' y=\'5\' width=\'5\' height=\'5\'/%3E%3C/g%3E%3C/svg%3E")' },
    { name: '육각형', value: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'28\' height=\'49\' viewBox=\'0 0 28 49\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg id=\'hexagons\' fill=\'%23000000\' fill-opacity=\'0.1\' fill-rule=\'nonzero\'%3E%3Cpath d=\'M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.99-7.5L26 15v18.5L13 41 0 33.5V15z\'/%3E%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
    { name: '빗금', value: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 10 10\'%3E%3Cpath d=\'M-1 1l2-2M0 10l10-10M9 11l2-2\' stroke=\'%23000000\' stroke-opacity=\'0.1\' stroke-width=\'1\'/%3E%3C/svg%3E")' },
    { name: '십자', value: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'15\' height=\'15\' viewBox=\'0 0 15 15\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 6h15v3H0z\'/%3E%3Cpath d=\'M6 0h3v15H6z\'/%3E%3C/g%3E%3C/svg%3E")' },
    { name: '물결', value: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Cpath d=\'M0 40c20 0 20-40 40-40s20 40 40 40-20 40-40 40-20-40-40-40z\' stroke-width=\'2\' stroke=\'%23000000\' stroke-opacity=\'0.1\' fill=\'none\'/%3E%3C/svg%3E")' },
    { name: '지그재그', value: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Cpath d=\'M0 10l5-5 5 5-5 5z\' fill=\'%23000000\' fill-opacity=\'0.1\'/%3E%3Cpath d=\'M10 10l5-5 5 5-5 5z\' fill=\'%23000000\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")' },
    { name: '삼각형', value: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 0l10 10L0 20zM10 0l10 10-10 10z\'/%3E%3C/g%3E%3C/svg%3E")' },
    { name: '원', value: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'5\' cy=\'5\' r=\'5\'/%3E%3Ccircle cx=\'25\' cy=\'25\' r=\'5\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
];

const FONT_WEIGHTS = [
    { name: '보통', value: 400 },
    { name: '세미볼드', value: 600 },
    { name: '볼드', value: 700 },
    { name: '엑스트라볼드', value: 800 },
    { name: '블랙', value: 900 }
];

const TEXT_EFFECTS = [
    { id: 'soft-shadow', name: '기본' },
    { id: 'strong-shadow', name: '선명한' },
    { id: 'outline', name: '테두리' },
    { id: 'neon', name: '네온' },
];
type TextEffect = 'soft-shadow' | 'strong-shadow' | 'outline' | 'neon';

const RATIO_CONFIG: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1080, height: 1080 },
    '4:3': { width: 1200, height: 900 },
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 }
};

// --- HELPERS ---
const getTextEffectStyle = (effect: TextEffect, color: string): React.CSSProperties => {
    switch (effect) {
        case 'soft-shadow':
            return { textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' };
        case 'strong-shadow':
            return { textShadow: '1px 1px 1px rgba(0,0,0,0.2), 2px 2px 4px rgba(0,0,0,0.5)' };
        case 'outline':
            return {
                textShadow: 'none',
                WebkitTextStroke: '1.5px black',
                paintOrder: 'stroke fill'
            };
        case 'neon':
            return {
                textShadow: `0 0 4px #fff, 0 0 8px #fff, 0 0 12px ${color}, 0 0 16px ${color}`
            };
        default:
            return { textShadow: 'none' };
    }
};


// --- ICONS ---
const AIIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.75 4.75L11.69 6.94L9.25 7.3L11 9.01L10.58 11.44L12.75 10.29L14.92 11.44L14.5 9.01L16.25 7.3L13.81 6.94L12.75 4.75ZM5.5 8.75L4.44 10.94L2 11.3L3.75 13.01L3.33 15.44L5.5 14.29L7.67 15.44L7.25 13.01L9 11.3L6.56 10.94L5.5 8.75ZM20 8.75L18.94 10.94L16.5 11.3L18.25 13.01L17.83 15.44L20 14.29L22.17 15.44L21.75 13.01L23.5 11.3L21.06 10.94L20 8.75Z"></path></svg>;
const CategoryIcon = () => <svg viewBox="0 0 24 24"><path d="M10 3H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V5c0 -1.1-.9-2-2-2zm0 13H4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2zm10-2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2zm0-11h-6c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></svg>;
const ContentIcon = () => <svg viewBox="0 0 24 24"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"></path></svg>;
const StyleIcon = () => <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5s-2.24-5-5-5H7.5c-.83 0-1.5.67-1.5 1.5S6.67 8 7.5 8H12c1.66 0 3 1.34 3 3s-1.34 3-3 3H7.5c-.83 0-1.5.67-1.5 1.5S6.67 17 7.5 17H12c2.76 0 5-2.24 5-5 0-2.05-1.23-3.81-3-4.58V3z"></path></svg>;
const ImageIcon = () => <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg>;
const PreviewIcon = () => <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>;
const ZoomIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>;
const SlidersIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 21v-7h2v7H4zM4 10V3h2v7H4zm4 11v-9h2v9H8zm4-11V3h2v17h-2zm4 11v-5h2v5h-2zm0-9V3h2v9h-2z"></path></svg>;
const ChevronDownIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"></path></svg>;
const BlogIcon = () => <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8 17.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm2.5-4H6v-2h4.5v2zm5 4h-5v-2h5v2zm0-4h-5v-2h5v2z"></path></svg>;
const YouTubeIcon = () => <svg viewBox="0 0 24 24"><path d="M21.58 7.19c-.23-.86-.9-1.52-1.76-1.75C18.25 5 12 5 12 5s-6.25 0-7.82.44c-.86.23-1.52.89-1.75 1.75C2 8.75 2 12 2 12s0 3.25.43 4.81c.23.86.89 1.52 1.75 1.75C5.75 19 12 19 12 19s6.25 0 7.82-.44c.86-.23-1.52.89-1.75-1.75C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"></path></svg>;
const SNSIcon = () => <svg viewBox="0 0 24 24"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2zm-.2 2A3.6 3.6 0 004 7.6v8.8A3.6 3.6 0 007.6 20h8.8A3.6 3.6 0 0020 16.4V7.6A3.6 3.6 0 0016.4 4H7.6zm9.65 1.5a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"></path></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>;

const PLATFORM_PRESETS = [
    {
        id: 'blog',
        title: '블로그',
        icon: <BlogIcon />,
        settings: {
            title: "시선을 사로잡는 블로그 제목",
            subtitle: "핵심 내용을 요약하는 부제목",
            category: "비즈니스 & 금융",
            ratio: '1:1',
        }
    },
    {
        id: 'sns',
        title: 'SNS',
        icon: <SNSIcon />,
        settings: {
            title: "트렌디한 SNS 콘텐츠",
            subtitle: "#해시태그 #인기",
            category: "예술 & 창의성",
            ratio: '9:16',
            titleSize: 4.2
        }
    },
    {
        id: 'youtube',
        title: 'YouTube',
        icon: <YouTubeIcon />,
        settings: {
            title: "충격! 모두가 놀란 영상 제목",
            subtitle: "클릭을 유도하는 한 문장",
            category: "여행 & 모험",
            ratio: '16:9',
            titleWeight: 800,
            textEffect: 'strong-shadow',
        }
    }
];

type DraggableElementState = {
    element: 'title' | 'subtitle';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
};

const settingsPanelsConfig = [
    { id: 'image', title: '이미지 설정', icon: <ImageIcon />, defaultSize: { width: 360, height: 720 } },
    { id: 'ai', title: 'AI 자동 생성', icon: <AIIcon />, defaultSize: { width: 380, height: 580 } },
    { id: 'content', title: '콘텐츠 설정', icon: <ContentIcon />, defaultSize: { width: 380, height: 380 } },
    { id: 'adjustment', title: '수동 조절', icon: <SlidersIcon />, defaultSize: { width: 580, height: 420 } },
    { id: 'background', title: '배경 패턴', icon: <StyleIcon />, defaultSize: { width: 420, height: 340 } },
    { id: 'category', title: '카테고리 선택', icon: <CategoryIcon />, defaultSize: { width: 420, height: 400 } },
];

interface FloatingPanelProps {
    id: string;
    title: string;
    children: React.ReactNode;
    initialPosition: { x: number; y: number };
    size: { width: number, height: number };
    zIndex: number;
    onClose: () => void;
    onFocus: () => void;
    onMove: (position: { x: number; y: number }) => void;
    onResize: (size: { width: number, height: number }) => void;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({ title, children, initialPosition, size, zIndex, onClose, onFocus, onMove, onResize }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragStartOffset = useRef({ x: 0, y: 0 });
    const resizeStartInfo = useRef({ width: 0, height: 0, x: 0, y: 0 });
    const MIN_WIDTH = 320;
    const MIN_HEIGHT = 150;


    const handleMouseDown = (e: React.MouseEvent) => {
        if (!panelRef.current) return;
        onFocus();
        const panelRect = panelRef.current.getBoundingClientRect();
        dragStartOffset.current = {
            x: e.clientX - panelRect.left,
            y: e.clientY - panelRect.top
        };
        setIsDragging(true);
        document.body.classList.add('is-dragging-panel');
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            onMove({
                x: e.clientX - dragStartOffset.current.x,
                y: e.clientY - dragStartOffset.current.y
            });
        };
        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.classList.remove('is-dragging-panel');
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onMove]);
    
    const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        onFocus();
        setIsResizing(direction);
        resizeStartInfo.current = {
            width: panelRef.current!.offsetWidth,
            height: panelRef.current!.offsetHeight,
            x: e.clientX,
            y: e.clientY,
        };
        document.body.classList.add(`is-resizing-${direction}`);
    };

    useEffect(() => {
        const handleResizeMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const dx = e.clientX - resizeStartInfo.current.x;
            const dy = e.clientY - resizeStartInfo.current.y;

            let newWidth = resizeStartInfo.current.width;
            let newHeight = resizeStartInfo.current.height;

            if (isResizing.includes('r')) {
                newWidth = resizeStartInfo.current.width + dx;
            }
            if (isResizing.includes('b')) {
                newHeight = resizeStartInfo.current.height + dy;
            }

            onResize({
                width: Math.max(MIN_WIDTH, newWidth),
                height: Math.max(MIN_HEIGHT, newHeight),
            });
        };

        const handleResizeMouseUp = () => {
            if (isResizing) {
                document.body.classList.remove(`is-resizing-${isResizing}`);
                setIsResizing(null);
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMouseMove);
            window.addEventListener('mouseup', handleResizeMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMouseMove);
            window.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [isResizing, onResize]);


    return (
        <div 
            ref={panelRef}
            className="floating-panel"
            style={{ 
                left: `${initialPosition.x}px`, 
                top: `${initialPosition.y}px`, 
                zIndex,
                width: `${size.width}px`,
                height: `${size.height}px`,
            }}
            onMouseDown={onFocus}
        >
            <div className="floating-panel-header" onMouseDown={handleMouseDown}>
                <span className="floating-panel-title">{title}</span>
                <button className="floating-panel-close" onClick={onClose} aria-label="Close">×</button>
            </div>
            <div className="floating-panel-body">
                {children}
            </div>
            <div className="resize-handle resize-handle-r" onMouseDown={(e) => handleResizeMouseDown(e, 'r')}></div>
            <div className="resize-handle resize-handle-b" onMouseDown={(e) => handleResizeMouseDown(e, 'b')}></div>
            <div className="resize-handle resize-handle-br" onMouseDown={(e) => handleResizeMouseDown(e, 'br')}></div>
        </div>
    );
};

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>×</button>
                {children}
            </div>
        </div>
    );
};

const App = () => {
    const initialCategory = "라이프스타일 & 건강";
    const getDefaults = (cat) => CATEGORY_DEFAULT_SETTINGS[cat] || CATEGORY_DEFAULT_SETTINGS[initialCategory];
    
    // App Layout State
    const [activePlatform, setActivePlatform] = useState<string | null>(null);
    const [isContentLoaded, setIsContentLoaded] = useState(false);

    // Floating Panels State
    type OpenPanelState = {
        id: string;
        title: string;
        position: { x: number; y: number };
        zIndex: number;
        size: { width: number; height: number };
    };
    const [openPanels, setOpenPanels] = useState<OpenPanelState[]>([]);
    const [nextZIndex, setNextZIndex] = useState(101);

    // Content State
    const [title, setTitle] = useState("미니멀 라이프 시작하기");
    const [subtitle, setSubtitle] = useState("일상 속 작은 변화의 시작");
    const [category, setCategory] = useState(initialCategory);
    
    // Style State
    const [backgroundStyle, setBackgroundStyle] = useState(CATEGORY_STYLES[initialCategory]);
    const [overlayPattern, setOverlayPattern] = useState(OVERLAY_PATTERNS[0].value);
    
    // Image State
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [imageFilters, setImageFilters] = useState({ brightness: 100, contrast: 100, blur: 0 });
    const [backgroundPosition, setBackgroundPosition] = useState({ x: 50, y: 50 });
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [titlePosition, setTitlePosition] = useState({ x: 0, y: 0 });
    const [subtitlePosition, setSubtitlePosition] = useState({ x: 0, y: 0 });
    const [draggedElement, setDraggedElement] = useState<DraggableElementState | null>(null);
    const [textEffect, setTextEffect] = useState<TextEffect>('soft-shadow');
    const [vignetteEnabled, setVignetteEnabled] = useState(false);

    // Manual Adjustment State
    const [ratio, setRatio] = useState(getDefaults(initialCategory).ratio);
    const titleFont = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', 'Segoe UI', Roboto, sans-serif";
    const [titleWeight, setTitleWeight] = useState(getDefaults(initialCategory).titleWeight);
    const [titleSize, setTitleSize] = useState(getDefaults(initialCategory).titleSize);
    const [titleColor, setTitleColor] = useState(getDefaults(initialCategory).titleColor);
    const subtitleFont = "'Noto Sans KR', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', 'Segoe UI', Roboto, sans-serif";
    const [subtitleWeight, setSubtitleWeight] = useState(getDefaults(initialCategory).subtitleWeight);
    const [subtitleSize, setSubtitleSize] = useState(getDefaults(initialCategory).subtitleSize);
    const [subtitleColor, setSubtitleColor] = useState(getDefaults(initialCategory).subtitleColor);
    const [subtitleHex, setSubtitleHex] = useState(getDefaults(initialCategory).subtitleColor);

    // AI State
    const [blogTitle, setBlogTitle] = useState("");
    const [blogDescription, setBlogDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // UI State
    const [copyStatus, setCopyStatus] = useState<{ type: 'title' | 'subtitle', status: 'success' | 'fail' } | null>(null);

    // Export State
    const [fitScale, setFitScale] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Ref
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activePlatform) {
            handlePlatformSelect(PLATFORM_PRESETS.find(p => p.id === 'blog'));
        }
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                // This logic is now handled by the Modal component
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const container = previewContainerRef.current;
        if (!container) return;

        const updateScale = () => {
            const currentRatioConfig = RATIO_CONFIG[ratio] || RATIO_CONFIG['16:9'];
            const canvasWidth = currentRatioConfig.width;
            const canvasHeight = currentRatioConfig.height;

            const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
            
            const padding = 32; // Corresponds to 2rem padding in css for main-container
            const availableWidth = containerWidth - padding;
            const availableHeight = containerHeight - padding;

            const scaleX = availableWidth / canvasWidth;
            const scaleY = availableHeight / canvasHeight;
            
            const newScale = Math.min(scaleX, scaleY);
            
            setFitScale(newScale > 1 ? 1 : newScale);
        };

        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(container);
        updateScale(); // Initial calculation
        return () => resizeObserver.disconnect();
    }, [ratio]);

    useEffect(() => {
        setOpenPanels(currentPanels => {
            const adjustmentPanel = currentPanels.find(p => p.id === 'adjustment');
            if (adjustmentPanel) {
                const targetHeight = activePlatform === 'blog' ? 420 : 330;
                if (adjustmentPanel.size.height !== targetHeight) {
                    return currentPanels.map(p =>
                        p.id === 'adjustment'
                            ? { ...p, size: { ...p.size, height: targetHeight } }
                            : p
                    );
                }
            }
            return currentPanels;
        });
    }, [activePlatform]);

    const togglePanel = (panelId: string) => {
        const panelExists = openPanels.find(p => p.id === panelId);

        if (panelExists) {
            setOpenPanels(panels => panels.filter(p => p.id !== panelId));
        } else {
            const panelConfig = settingsPanelsConfig.find(p => p.id === panelId);
            if (panelConfig) {
                let panelSize = panelConfig.defaultSize;
                if (panelId === 'adjustment') {
                    const targetHeight = activePlatform === 'blog' ? 420 : 330;
                    panelSize = { ...panelSize, height: targetHeight };
                }
                const newZIndex = nextZIndex;
                setNextZIndex(z => z + 1);
                const newPosition = {
                    x: 350 + (openPanels.length % 5) * 30,
                    y: 100 + (openPanels.length % 5) * 30
                };
                setOpenPanels(panels => [...panels, { 
                    id: panelId, 
                    title: panelConfig.title, 
                    position: newPosition,
                    zIndex: newZIndex,
                    size: panelSize
                }]);
            }
        }
    };

    const bringPanelToFront = (panelId: string) => {
        const panel = openPanels.find(p => p.id === panelId);
        if (panel && panel.zIndex < nextZIndex - 1) {
            const newZIndex = nextZIndex;
            setNextZIndex(z => z + 1);
            setOpenPanels(panels => panels.map(p => 
                p.id === panelId ? { ...p, zIndex: newZIndex } : p
            ));
        }
    };

    const updatePanelPosition = (panelId: string, newPosition: { x: number, y: number }) => {
        setOpenPanels(panels => panels.map(p => 
            p.id === panelId ? { ...p, position: newPosition } : p
        ));
    };
    
    const updatePanelSize = (panelId: string, newSize: { width: number, height: number }) => {
        setOpenPanels(panels => panels.map(p => 
            p.id === panelId ? { ...p, size: newSize } : p
        ));
    };

    const resetTextPositions = () => {
        setTitlePosition({ x: 0, y: 0 });
        setSubtitlePosition({ x: 0, y: 0 });
    };
    
    const applyPlatformSettings = (platformSettings) => {
        const newCategory = platformSettings.category;
        const defaults = getDefaults(newCategory);

        if (!isContentLoaded) {
            setTitle(platformSettings.title);
            setSubtitle(platformSettings.subtitle);
        }
        setCategory(newCategory);
        setRatio(platformSettings.ratio);

        setTitleWeight(platformSettings.titleWeight || defaults.titleWeight);
        setTitleSize(platformSettings.titleSize || defaults.titleSize);
        setTitleColor(defaults.titleColor);
        setSubtitleWeight(defaults.subtitleWeight);
        setSubtitleSize(defaults.subtitleSize);
        setSubtitleColor(defaults.subtitleColor);
        setSubtitleHex(defaults.subtitleColor);
        
        setBackgroundStyle(CATEGORY_STYLES[newCategory]);
        setTextEffect((platformSettings.textEffect as TextEffect) || 'soft-shadow');

        if (!backgroundImage) {
            setImageFilters({ brightness: 100, contrast: 100, blur: 0 });
            setVignetteEnabled(false);
        }
        setOverlayPattern('');
        resetTextPositions();
    };

    const handlePlatformSelect = (platform) => {
        if (!platform) return;
        setActivePlatform(platform.id);
        applyPlatformSettings(platform.settings);
    };

    const handleCategorySelect = (selectedCategory) => {
        const defaults = getDefaults(selectedCategory);

        setCategory(selectedCategory);
        setBackgroundStyle(CATEGORY_STYLES[selectedCategory]);
        
        setRatio(defaults.ratio);
        
        setTitleWeight(defaults.titleWeight);
        setTitleSize(defaults.titleSize);
        setTitleColor(defaults.titleColor);
        setSubtitleWeight(defaults.subtitleWeight);
        setSubtitleSize(defaults.subtitleSize);
        setSubtitleColor(defaults.subtitleColor);
        setSubtitleHex(defaults.subtitleColor);
        
        if (!backgroundImage) {
            setImageFilters({ brightness: 100, contrast: 100, blur: 0 });
            setVignetteEnabled(false);
        }
        setOverlayPattern('');
        resetTextPositions();
        setTextEffect('soft-shadow');
    };

    const processImageFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setBackgroundImage(e.target?.result as string);
                setImageFilters({ brightness: 90, contrast: 90, blur: 0.5 });
                setBackgroundPosition({ x: 50, y: 50 });
                resetTextPositions();
                setTextEffect('soft-shadow');
                setVignetteEnabled(false);
            };
            reader.readAsDataURL(file);
        } else {
            alert('이미지 파일(jpg, png, gif 등)을 선택해주세요.');
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processImageFile(e.target.files[0]);
        }
    };

    const handleDragEvents = (e: DragEvent<HTMLDivElement>, type: 'enter' | 'leave' | 'over' | 'drop') => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'enter' || type === 'over') {
            setIsDraggingOver(true);
        } else if (type === 'leave' || type === 'drop') {
            setIsDraggingOver(false);
        }
        if (type === 'drop' && e.dataTransfer.files && e.dataTransfer.files[0]) {
            processImageFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveImage = () => {
        setBackgroundImage(null);
        setImageFilters({ brightness: 100, contrast: 100, blur: 0 });
        setBackgroundPosition({ x: 50, y: 50 });
        resetTextPositions();
        setTextEffect('soft-shadow');
        setVignetteEnabled(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggedElement) return;
            
            const currentScaleMatch = previewRef.current?.style.transform.match(/scale\(([^)]+)\)/);
            const scaleValue = currentScaleMatch ? parseFloat(currentScaleMatch[1]) : 1;

            const deltaX = (e.clientX - draggedElement.startX) / scaleValue;
            const deltaY = (e.clientY - draggedElement.startY) / scaleValue;

            if (draggedElement.element === 'title') {
                setTitlePosition({
                    x: draggedElement.initialX + deltaX,
                    y: draggedElement.initialY + deltaY,
                });
            } else {
                setSubtitlePosition({
                    x: draggedElement.initialX + deltaX,
                    y: draggedElement.initialY + deltaY,
                });
            }
        };

        const handleMouseUp = () => {
            document.body.classList.remove('is-dragging');
            setDraggedElement(null);
        };

        if (draggedElement) {
            document.body.classList.add('is-dragging');
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('is-dragging');
        };
    }, [draggedElement]);

    const handleTextMouseDown = (e: React.MouseEvent, element: 'title' | 'subtitle') => {
        if (!backgroundImage) return;
        e.preventDefault();
        setDraggedElement({
            element,
            startX: e.clientX,
            startY: e.clientY,
            initialX: element === 'title' ? titlePosition.x : subtitlePosition.x,
            initialY: element === 'title' ? titlePosition.y : subtitlePosition.y,
        });
    };
    
    const handleAiGeneration = async () => {
        if (!blogTitle.trim() || !blogDescription.trim()) {
            alert("블로그 제목과 내용을 모두 입력해주세요.");
            return;
        }

        if (!process.env.API_KEY) {
            alert("API 키가 설정되지 않았습니다. AI 기능을 사용하려면 환경 변수에 API_KEY를 설정해야 합니다.");
            return;
        }

        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                다음 블로그 포스트 내용을 기반으로, 사람들의 시선을 사로잡을 만한 매력적인 썸네일 제목과 부제목을 만들어줘. 그리고 주어진 카테고리 목록 중에서 가장 적합한 카테고리 하나를 추천해줘.

                - 블로그 제목: "${blogTitle}"
                - 블로그 내용: "${blogDescription}"

                카테고리 목록: [${CATEGORIES.join(', ')}]

                결과는 반드시 JSON 형식으로만 응답해야 해. 제목은 짧고 간결하게, 부제목은 제목을 보충하는 내용으로 만들어줘.
            `;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    thumbnailTitle: {
                        type: Type.STRING,
                        description: '썸네일을 위한 짧고 시선을 끄는 제목'
                    },
                    thumbnailSubtitle: {
                        type: Type.STRING,
                        description: '제목을 보충 설명하는 더 짧은 부제목'
                    },
                    category: {
                        type: Type.STRING,
                        description: `제공된 카테고리 목록 중 하나: ${CATEGORIES.join(', ')}`
                    }
                },
                required: ['thumbnailTitle', 'thumbnailSubtitle', 'category']
            };

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            });
            
            let result;
            try {
                const cleanedText = response.text.replace(/```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(cleanedText);
            } catch (e) {
                console.error("AI 응답이 유효한 JSON이 아닙니다:", response.text);
                throw new Error("AI로부터 받은 응답의 형식이 올바르지 않습니다.");
            }

            setTitle(result.thumbnailTitle);
            setSubtitle(result.thumbnailSubtitle);
            setIsContentLoaded(true);

            const newCategory = result.category;
            if (CATEGORIES.includes(newCategory)) {
                handleCategorySelect(newCategory);
            } else {
                console.warn(`AI가 추천한 카테고리 '${newCategory}'가 목록에 없습니다. 기본 카테고리를 사용합니다.`);
                handleCategorySelect(CATEGORIES[0]);
            }

        } catch (error) {
            console.error('AI 썸네일 생성에 실패했습니다.', error);
            alert(`AI 썸네일 생성 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const generateImageData = async (format: 'png' | 'jpeg' | 'webp'): Promise<string> => {
        const element = previewRef.current;
        if (!element) {
            throw new Error("미리보기 요소를 찾을 수 없습니다.");
        }
    
        const targetConfig = RATIO_CONFIG[ratio] || RATIO_CONFIG['16:9'];
        const targetWidth = targetConfig.width;
        const targetHeight = targetConfig.height;

        const originalTransform = element.style.transform;
        element.style.transform = 'none';
    
        await new Promise(resolve => setTimeout(resolve, 0)); // Allow browser to re-render
    
        let dataUrl: string;
        try {
            const options = {
                quality: 1,
                backgroundColor: null,
                width: targetWidth,
                height: targetHeight,
                pixelRatio: 1,
            };

            if (format === 'jpeg') {
                dataUrl = await htmlToImage.toJpeg(element, { ...options, quality: 0.9 });
            // FIX: The 'html-to-image' library does not have a 'toWebp' method.
            // This fix generates a canvas first using 'toCanvas' and then converts it to a WebP data URL.
            } else if (format === 'webp') {
                const canvas = await htmlToImage.toCanvas(element, options);
                dataUrl = canvas.toDataURL('image/webp', 0.95);
            } else {
                dataUrl = await htmlToImage.toPng(element, options);
            }
        } catch (error) {
            console.error('이미지 생성 실패:', error);
            throw new Error('이미지 생성 중 오류가 발생했습니다.');
        } finally {
            element.style.transform = originalTransform;
        }
        
        return dataUrl;
    };

    const handleExport = async (format: 'png' | 'jpeg' | 'webp') => {
        if (isSaving) return;
        setIsSaving(true);
        setIsExportModalOpen(false);
    
        await new Promise(resolve => setTimeout(resolve, 100));
    
        try {
            const dataUrl = await generateImageData(format);
            const link = document.createElement('a');
    
            const safeTitle = (title || '제목없음').replace(/[\\/:*?"<>|]/g, '_');
            const safeRatio = ratio.replace(':', 'x');
            const extension = format;
            link.download = `썸네일_${safeTitle}_${safeRatio}.${extension}`;
            
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('이미지 저장에 실패했습니다.', error);
            alert(`이미지 저장 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCopyColor = (color: string, type: 'title' | 'subtitle') => {
        if (!navigator.clipboard) {
            setCopyStatus({ type, status: 'fail' });
            setTimeout(() => setCopyStatus(null), 1500);
            return;
        }

        navigator.clipboard.writeText(color).then(() => {
            setCopyStatus({ type, status: 'success' });
            setTimeout(() => setCopyStatus(null), 1500);
        }).catch(err => {
            console.error('Failed to copy color: ', err);
            setCopyStatus({ type, status: 'fail' });
            setTimeout(() => setCopyStatus(null), 1500);
        });
    };
    
    const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>, setColor: (c: string) => void, setHex: (h: string) => void) => {
        const newColor = e.target.value.toLowerCase();
        setColor(newColor);
        setHex(newColor);
    };

    const handleHexTextChange = (e: React.ChangeEvent<HTMLInputElement>, setColor: (c: string) => void, setHex: (h: string) => void) => {
        const newHexValue = e.target.value;
        setHex(newHexValue);

        let sanitized = newHexValue.startsWith('#') ? newHexValue : `#${newHexValue}`;
        if (/^#[0-9a-f]{6}$/i.test(sanitized)) {
            setColor(sanitized.toLowerCase());
        }
    };

    const finalBackground = backgroundImage ? 'transparent' : backgroundStyle;
    const finalBackgroundImage = overlayPattern ? `${overlayPattern}, ${finalBackground}` : finalBackground;
    
    const currentRatioConfig = RATIO_CONFIG[ratio] || RATIO_CONFIG['16:9'];
    
    const renderImageSettingsPanel = () => (
        <div className="settings-panel-content image-settings-panel">
             {!backgroundImage ? (
                <div 
                    className="image-upload-zone-compact"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImageIcon />
                    <span>이미지 업로드</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                </div>
            ) : (
                <>
                    <div className="uploaded-image-thumb" style={{backgroundImage: `url(${backgroundImage})`}}>
                        <button className="remove-image-button" onClick={handleRemoveImage} title="이미지 제거">×</button>
                    </div>
                    
                    <div className="slider-group-vertical">
                        <label>밝기</label>
                        <input type="range" min="0" max="200" value={imageFilters.brightness} onChange={(e) => setImageFilters(f => ({...f, brightness: Number(e.target.value)}))} />
                        <span>{imageFilters.brightness}%</span>
                    </div>
                    <div className="slider-group-vertical">
                        <label>대비</label>
                        <input type="range" min="0" max="200" value={imageFilters.contrast} onChange={(e) => setImageFilters(f => ({...f, contrast: Number(e.target.value)}))} />
                        <span>{imageFilters.contrast}%</span>
                    </div>
                    <div className="slider-group-vertical">
                        <label>흐림</label>
                        <input type="range" min="0" max="10" step="0.1" value={imageFilters.blur} onChange={(e) => setImageFilters(f => ({...f, blur: Number(e.target.value)}))} />
                        <span>{imageFilters.blur}px</span>
                    </div>
    
                    <hr className="settings-divider" />
    
                    <div className="slider-group-vertical">
                        <label>가로 위치</label>
                        <input type="range" min="0" max="100" value={backgroundPosition.x} onChange={(e) => setBackgroundPosition(p => ({ ...p, x: Number(e.target.value) }))} />
                        <span>{backgroundPosition.x}%</span>
                    </div>
                    <div className="slider-group-vertical">
                        <label>세로 위치</label>
                        <input type="range" min="0" max="100" value={backgroundPosition.y} onChange={(e) => setBackgroundPosition(p => ({ ...p, y: Number(e.target.value) }))} />
                        <span>{backgroundPosition.y}%</span>
                    </div>
                    
                    <hr className="settings-divider" />
    
                    <div className="form-group text-effect-group">
                        <label>텍스트 효과</label>
                        <div className="button-group button-group-effects">
                            {TEXT_EFFECTS.map(effect => (
                                <button 
                                    key={effect.id}
                                    className={textEffect === effect.id ? 'active' : ''}
                                    onClick={() => setTextEffect(effect.id as TextEffect)}
                                    title={effect.name}
                                >
                                    {effect.name}
                                </button>
                            ))}
                        </div>
                    </div>
    
                    <div className="image-settings-bottom-controls">
                        <div className="vignette-group">
                            <label htmlFor="vignette-toggle">비네팅</label>
                            <div className="toggle-switch">
                                <input type="checkbox" id="vignette-toggle" checked={vignetteEnabled} onChange={(e) => setVignetteEnabled(e.target.checked)} />
                                <label htmlFor="vignette-toggle"></label>
                            </div>
                        </div>
                        <button className="btn btn-tertiary" onClick={resetTextPositions}>위치 초기화</button>
                    </div>
                </>
            )}
        </div>
    );
    
    const renderAiPanel = () => (
        <div className="settings-panel-content">
            <p className="card-description">블로그 글의 제목과 내용을 입력하면 AI가 썸네일에 어울리는 제목, 카테고리, 스타일을 자동으로 추천해줍니다.</p>
            <div className="form-group">
                <label htmlFor="blog-title-input">블로그 제목:</label>
                <textarea id="blog-title-input" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} placeholder="예: 효율적인 재택 근무를 위한 5가지 팁" rows={2}/>
            </div>
            <div className="form-group">
                <label htmlFor="blog-desc-input">블로그 내용 (요약):</label>
                <textarea id="blog-desc-input" value={blogDescription} onChange={e => setBlogDescription(e.target.value)} placeholder="예: 재택 근무의 생산성을 높이고 워라밸을 지키는 구체적인 방법을 알아봅니다." rows={4}/>
            </div>
            <button className="btn btn-ai" onClick={handleAiGeneration} disabled={isLoading}>
                {isLoading ? (
                    <>
                        <div className="spinner"></div>
                        <span>생성 중...</span>
                    </>
                ) : (
                    'AI로 생성하기'
                )}
            </button>
        </div>
    );
    
    const renderContentPanel = () => (
        <div className="settings-panel-content">
            <div className="form-group">
                <label htmlFor="title-input">썸네일 제목:</label>
                <textarea id="title-input" value={title} onChange={e => { setTitle(e.target.value); setIsContentLoaded(true); }} />
            </div>
            <div className="form-group">
                <label htmlFor="subtitle-input">썸네일 부제목:</label>
                <textarea id="subtitle-input" value={subtitle} onChange={e => { setSubtitle(e.target.value); setIsContentLoaded(true); }} />
            </div>
        </div>
    );

    const renderAdjustmentPanel = () => (
        <div className="settings-panel-content wide-panel">
            <div className="adjustment-controls">
                {activePlatform === 'blog' && (
                    <div className="adjustment-card">
                        <label className="adjustment-label">비율</label>
                        <div className="adjustment-control">
                            <div className="button-group">
                                <button className={ratio === '1:1' ? 'active' : ''} onClick={() => setRatio('1:1')}>정사각형 (1:1)</button>
                                <button className={ratio === '4:3' ? 'active' : ''} onClick={() => setRatio('4:3')}>표준 (4:3)</button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="adjustment-card">
                    <p className="adjustment-description">썸네일 제목 (굵기, 색상, 크기 조절이 가능합니다)</p>
                    <div className="adjustment-control adjustment-grid-compact">
                        <select aria-label="썸네일 제목 굵기" value={titleWeight} onChange={e => setTitleWeight(Number(e.target.value))}>
                            {FONT_WEIGHTS.map(w => <option key={w.name} value={w.value}>{w.name}</option>)}
                        </select>
                        <div className="color-input-wrapper">
                            <input 
                                type="color" 
                                aria-label="썸네일 제목 색상 선택"
                                value={titleColor} 
                                onChange={(e) => setTitleColor(e.target.value.toLowerCase())} 
                            />
                            <span 
                                className="color-hex-display" 
                                onClick={() => handleCopyColor(titleColor, 'title')}
                                title="클릭하여 복사"
                            >
                                {copyStatus?.type === 'title' && copyStatus.status === 'success' 
                                    ? '복사됨!' 
                                    : titleColor.toUpperCase()}
                            </span>
                        </div>
                        <div className="slider-group">
                            <input type="range" aria-label="썸네일 제목 크기" min="1" max="8" step="0.1" value={titleSize} onChange={e => setTitleSize(Number(e.target.value))} />
                            <span>{titleSize}rem</span>
                        </div>
                    </div>
                </div>

                <div className="adjustment-card">
                    <p className="adjustment-description">썸네일 부제목 (굵기, 색상, 크기 조절이 가능합니다)</p>
                    <div className="adjustment-control adjustment-grid-compact">
                        <select aria-label="썸네일 부제목 굵기" value={subtitleWeight} onChange={e => setSubtitleWeight(Number(e.target.value))}>
                            {FONT_WEIGHTS.map(w => <option key={w.name} value={w.value}>{w.name}</option>)}
                        </select>
                        <div className="color-input-wrapper">
                            <input 
                                type="color" 
                                aria-label="썸네일 부제목 색상 선택"
                                value={subtitleColor} 
                                onChange={(e) => handleColorPickerChange(e, setSubtitleColor, setSubtitleHex)} 
                            />
                            <input
                                type="text"
                                aria-label="썸네일 부제목 색상 헥사코드"
                                className="color-hex-input"
                                value={subtitleHex}
                                onChange={(e) => handleHexTextChange(e, setSubtitleColor, setSubtitleHex)}
                                maxLength={7}
                                spellCheck="false"
                            />
                        </div>
                        <div className="slider-group">
                            <input type="range" aria-label="썸네일 부제목 크기" min="0.5" max="8" step="0.1" value={subtitleSize} onChange={e => setSubtitleSize(Number(e.target.value))} />
                            <span>{subtitleSize}rem</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    
    const renderBackgroundPanel = () => (
        <div className="settings-panel-content">
             <div className="form-group">
                <div className="pattern-grid">
                    {OVERLAY_PATTERNS.map((p) => (
                        <div
                            key={p.name}
                            title={p.name}
                            className={`pattern-card ${overlayPattern === p.value ? 'selected' : ''}`}
                            style={{ backgroundImage: p.value }}
                            onClick={() => setOverlayPattern(p.value)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
    
    const renderCategoryPanel = () => (
        <div className="settings-panel-content wide-panel">
            <div className="category-grid">
                {CATEGORIES.map(cat => (
                    <div
                        key={cat}
                        className={`category-card ${category === cat ? 'selected' : ''}`}
                        style={{ background: CATEGORY_STYLES[cat] }}
                        onClick={() => handleCategorySelect(cat)}
                    >
                        <div className="overlay"></div>
                        <span>{cat}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPanelContent = (panelId: string) => {
        switch (panelId) {
            case 'image': return renderImageSettingsPanel();
            case 'ai': return renderAiPanel();
            case 'content': return renderContentPanel();
            case 'adjustment': return renderAdjustmentPanel();
            case 'background': return renderBackgroundPanel();
            case 'category': return renderCategoryPanel();
            default: return null;
        }
    };
    
    const isPanelOpen = (panelId: string) => !!openPanels.find(p => p.id === panelId);

    return (
        <div className="app-wrapper">
            <header className="main-header">
                <div className="header-platform-controls">
                    {PLATFORM_PRESETS.map(platform => (
                        <button 
                            key={platform.id} 
                            className={`platform-card platform-card-${platform.id} ${activePlatform === platform.id ? 'active' : ''}`}
                            onClick={() => handlePlatformSelect(platform)}
                        >
                            {platform.icon}
                            <span>{platform.title}</span>
                        </button>
                    ))}
                </div>
                
                <div className="header-separator"></div>
                
                <div className="header-settings-controls">
                    {settingsPanelsConfig.map(panel => (
                        <button 
                            key={panel.id}
                            className={`settings-toggle ${isPanelOpen(panel.id) ? 'active' : ''}`}
                            onClick={() => togglePanel(panel.id)}
                            title={panel.title}
                        >
                            {panel.icon}
                            <span>{panel.title}</span>
                        </button>
                    ))}
                </div>
                
                <div className="header-export-controls">
                    <button className="btn btn-save" onClick={() => setIsExportModalOpen(true)} disabled={isSaving}>
                        <DownloadIcon />
                        <span>{isSaving ? '저장 중...' : '저장'}</span>
                    </button>
                </div>
            </header>
            
            {activePlatform && (
                <div className="main-container">
                    <div 
                        className="preview-container" 
                        ref={previewContainerRef}
                    >
                        <div 
                            ref={previewRef} 
                            className="preview-box"
                            style={{ 
                                background: finalBackgroundImage,
                                width: `${currentRatioConfig.width}px`,
                                height: `${currentRatioConfig.height}px`,
                                transform: `scale(${fitScale * zoom})`
                            }}
                        >
                            {backgroundImage && (
                                <>
                                    <div className="preview-image-layer" style={{
                                        backgroundImage: `url(${backgroundImage})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
                                        filter: `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) blur(${imageFilters.blur}px)`
                                    }}/>
                                    {vignetteEnabled && <div className="vignette-layer" />}
                                </>
                            )}
                            <div className="preview-content">
                                <h1 
                                    className={`preview-title ${backgroundImage ? 'is-draggable' : ''}`}
                                    style={{
                                        fontFamily: titleFont,
                                        fontWeight: titleWeight,
                                        fontSize: `${titleSize * 4}cqw`,
                                        color: titleColor,
                                        transform: `translate(${titlePosition.x}px, ${titlePosition.y}px)`,
                                        ...backgroundImage ? getTextEffectStyle(textEffect, titleColor) : {}
                                    }}
                                    onMouseDown={(e) => handleTextMouseDown(e, 'title')}
                                >{title}</h1>
                                <p 
                                    className={`preview-subtitle ${backgroundImage ? 'is-draggable' : ''}`}
                                    style={{
                                        fontFamily: subtitleFont,
                                        fontWeight: subtitleWeight,
                                        fontSize: `${subtitleSize * 4}cqw`,
                                        marginTop: `${0.75 * 4}cqw`,
                                        color: subtitleColor,
                                        transform: `translate(${subtitlePosition.x}px, ${subtitlePosition.y}px)`,
                                        ...backgroundImage ? getTextEffectStyle(textEffect, subtitleColor) : {}
                                    }}
                                    onMouseDown={(e) => handleTextMouseDown(e, 'subtitle')}
                                >{subtitle}</p>
                            </div>
                        </div>
                        {isSaving && (
                            <div className="saving-overlay">
                                <div className="spinner"></div>
                                <span>이미지 생성 중...</span>
                            </div>
                        )}
                    </div>
                     <div className="zoom-controls">
                        <ZoomIcon />
                        <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.05"
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            aria-label="미리보기 확대/축소"
                        />
                        <span>{Math.round(zoom * 100)}%</span>
                        <button className="btn-reset-zoom" onClick={() => setZoom(1)} title="줌 초기화">초기화</button>
                    </div>
                </div>
            )}

            {openPanels.map(panel => {
                const panelConfig = settingsPanelsConfig.find(p => p.id === panel.id);
                return (
                    <FloatingPanel
                        key={panel.id}
                        id={panel.id}
                        title={panelConfig?.title || 'Settings'}
                        initialPosition={panel.position}
                        size={panel.size}
                        zIndex={panel.zIndex}
                        onClose={() => togglePanel(panel.id)}
                        onFocus={() => bringPanelToFront(panel.id)}
                        onMove={(pos) => updatePanelPosition(panel.id, pos)}
                        onResize={(newSize) => updatePanelSize(panel.id, newSize)}
                    >
                        {renderPanelContent(panel.id)}
                    </FloatingPanel>
                )
             })}
             
             <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)}>
                <div className="export-modal-content">
                    <h3>저장 옵션 선택</h3>
                    <p>원하는 파일 형식을 선택하여 썸네일을 저장하세요.</p>
                    <div className="export-options-buttons">
                        <button className="export-option-button" onClick={() => handleExport('webp')} disabled={isSaving}>
                            <div className="export-option-title">추천 (WebP)</div>
                            <div className="export-option-desc">품질은 유지하며 용량을 최적화</div>
                        </button>
                        <button className="export-option-button" onClick={() => handleExport('png')} disabled={isSaving}>
                            <div className="export-option-title">고화질 (PNG)</div>
                            <div className="export-option-desc">로고/아이콘 등 그래픽에 적합</div>
                        </button>
                        <button className="export-option-button" onClick={() => handleExport('jpeg')} disabled={isSaving}>
                            <div className="export-option-title">웹 최적화 (JPG)</div>
                            <div className="export-option-desc">사진/풍경 등 이미지를 압축</div>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);