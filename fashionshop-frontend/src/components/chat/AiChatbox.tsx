'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Send,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAddCartItemMutation } from '@/features/cart/hooks';
import { useAuthSession } from '@/features/auth/store';

interface RecommendedProduct {
  id: number;
  name: string;
  categoryName?: string;
  category?: string;
  price: number;
  stockQuantity?: number;
  imageUrl?: string;
  imageSrc?: string;
  description?: string;
  productDetailUrl?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string;
  recommendedProducts?: RecommendedProduct[];
  suggestedPrompts?: string[];
  isError?: boolean;
  retryPayload?: { text: string; file?: File | null };
}

const STORAGE_KEY = '18studio_stylist_chat_v2';
const LEGACY_STORAGE_KEY = '18studio_stylist_chat_v1';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PERSISTED_MESSAGES = 30;

const DEFAULT_STARTER_PROMPTS = [
  'Phối đồ công sở tối giản',
  'Outfit đi chơi dưới $100',
  'Gợi ý áo khoác dễ phối',
  'Casual weekend essentials',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'ai',
  text: 'Xin chào! Mình là **18 Studio AI Stylist**.\n\nBạn có thể mô tả phong cách, ngân sách (vd: *dưới $80*), hoặc gửi/dán ảnh trang phục để mình gợi ý sản phẩm phối hợp chuẩn gu nhất từ cửa hàng.',
  suggestedPrompts: DEFAULT_STARTER_PROMPTS,
};

/** Safe inline markdown parser (**bold**, *italic*, `code`) returning React nodes — zero dangerouslySetInnerHTML. */
function renderInlineTokens(text: string, keyPrefix: string): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} className="rounded bg-surface-container px-1 py-0.5 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function renderSafeMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={key} className="my-1.5 ml-4 list-disc space-y-1 text-sm leading-relaxed">
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  };

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushList(`ul-empty-${idx}`);
      return;
    }

    const bulletMatch = trimmed.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      listItems.push(<li key={`li-${idx}`}>{renderInlineTokens(bulletMatch[1], `li-${idx}`)}</li>);
      return;
    }

    flushList(`ul-before-p-${idx}`);
    blocks.push(
      <p key={`p-${idx}`} className="my-1 text-sm leading-relaxed first:mt-0 last:mb-0">
        {renderInlineTokens(trimmed, `p-${idx}`)}
      </p>,
    );
  });

  flushList('ul-end');
  return blocks;
}

function loadPersistedMessages(): ChatMessage[] | null {
  if (typeof window === 'undefined') return null;
  try {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedMessages(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    const serializable = messages
      .filter((m) => !m.isError)
      .slice(-MAX_PERSISTED_MESSAGES)
      .map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        recommendedProducts: m.recommendedProducts,
        suggestedPrompts: m.suggestedPrompts,
      }));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore storage quota errors
  }
}

export function AiChatbox() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const addCartMutation = useAddCartItemMutation();

  const isAdminOrStaff = pathname?.startsWith('/admin') || pathname?.startsWith('/staff');
  const isViewingProduct = Boolean(pathname && /^\/products\/[^/]+/.test(pathname));

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanningPreviewUrl, setScanningPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAttentionBubble, setShowAttentionBubble] = useState(false);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [addedProductIds, setAddedProductIds] = useState<Record<number, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<string[]>([]);

  const trackBlobUrl = useCallback((url: string) => {
    blobUrlsRef.current.push(url);
    return url;
  }, []);

  const revokeAllBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
  }, []);

  useEffect(() => () => revokeAllBlobUrls(), [revokeAllBlobUrls]);

  // Show a gentle prompt bubble above the floating launcher once
  useEffect(() => {
    if (isAdminOrStaff) return;
    const timer = setTimeout(() => {
      setShowAttentionBubble(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, [isAdminOrStaff]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isAdminOrStaff || !isOpen) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen, isAdminOrStaff]);

  // Close drawer with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (isAdminOrStaff) {
    return null;
  }

  const openDrawer = () => {
    if (!hasHydratedStorage) {
      const saved = loadPersistedMessages();
      if (saved && saved.length > 0) {
        setMessages(saved);
      }
      setHasHydratedStorage(true);
    }
    setIsOpen(true);
    setShowAttentionBubble(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const toggleDrawer = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      openDrawer();
    }
  };

  const attachFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      const msg = 'Please attach a JPEG, PNG, or WEBP image.';
      setFileError(msg);
      toast.error(msg);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      const msg = 'Image must be 5 MiB or smaller.';
      setFileError(msg);
      toast.error(msg);
      return;
    }

    setFileError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const nextUrl = trackBlobUrl(URL.createObjectURL(file));
    setSelectedFile(file);
    setPreviewUrl(nextUrl);
    setShowAttentionBubble(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    attachFile(e.target.files?.[0]);
    if (e.target) e.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetChat = () => {
    revokeAllBlobUrls();
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanningPreviewUrl(null);
    setFileError(null);
    setMessages([WELCOME_MESSAGE]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    toast.success('Started a fresh styling session');
  };

  const handleAddToCart = (prod: RecommendedProduct) => {
    if (!session.token) {
      toast.info('Please sign in to add items to your bag.');
      router.push('/auth');
      return;
    }

    setAddingProductId(prod.id);
    addCartMutation.mutate(
      { productId: prod.id, quantity: 1 },
      {
        onSuccess: () => {
          setAddingProductId(null);
          setAddedProductIds((prev) => ({ ...prev, [prod.id]: true }));
          toast.success(`Added "${prod.name}" to your bag`);
          setTimeout(() => {
            setAddedProductIds((prev) => ({ ...prev, [prod.id]: false }));
          }, 2200);
        },
        onError: (error: { message?: string }) => {
          setAddingProductId(null);
          toast.error(error?.message || 'Unable to add item to bag');
        },
      },
    );
  };

  const sendMessage = async (textOverride?: string, fileOverride?: File | null) => {
    if (isLoading) return;

    const userText = (textOverride !== undefined ? textOverride : input).trim();
    const userFile = fileOverride !== undefined ? fileOverride : selectedFile;
    if (!userText && !userFile) return;

    const userImgUrl =
      fileOverride !== undefined
        ? fileOverride
          ? trackBlobUrl(URL.createObjectURL(fileOverride))
          : undefined
        : previewUrl || undefined;

    if (textOverride === undefined) setInput('');
    if (fileOverride === undefined) {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    setFileError(null);
    setScanningPreviewUrl(userImgUrl ?? null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText || 'Analyze this outfit and suggest matching items.',
      imageUrl: userImgUrl,
    };

    const nextMessages = [...messages.filter((m) => !m.isError), userMessage];
    setMessages(nextMessages);
    savePersistedMessages(nextMessages);
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (userText) formData.append('message', userText);
      if (userFile) formData.append('file', userFile);
      if (pathname) formData.append('currentPath', pathname);

      const history = nextMessages
        .slice(0, -1)
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .slice(-10)
        .map((m) => ({ sender: m.sender === 'ai' ? 'model' : 'user', text: m.text }));
      formData.append('history', JSON.stringify(history));

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      const resData = await response.json();

      if (!response.ok || !resData.success || !resData.data) {
        throw new Error(resData?.message || 'Could not reach the styling assistant.');
      }

      const { stylistComment, recommendedProducts, suggestedPrompts } = resData.data;
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: stylistComment,
        recommendedProducts: Array.isArray(recommendedProducts) ? recommendedProducts : [],
        suggestedPrompts: Array.isArray(suggestedPrompts) ? suggestedPrompts : [],
      };

      setMessages((prev) => {
        const updated = [...prev, aiMessage];
        savePersistedMessages(updated);
        return updated;
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Unable to connect to the styling assistant. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: errorMsg,
          isError: true,
          retryPayload: { text: userText, file: userFile },
        },
      ]);
    } finally {
      setIsLoading(false);
      setScanningPreviewUrl(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      attachFile(droppedFile);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const pastedFile = item.getAsFile();
        if (pastedFile) {
          e.preventDefault();
          attachFile(pastedFile);
          return;
        }
      }
    }
  };

  const contextualPrompts = isViewingProduct
    ? ['Phối sản phẩm đang xem với gì đẹp?', ...DEFAULT_STARTER_PROMPTS.slice(0, 3)]
    : DEFAULT_STARTER_PROMPTS;

  return (
    <>
      {/* 1. Floating Action Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {showAttentionBubble && !isOpen && (
          <div className="relative mb-3 max-w-[250px] rounded-lg border border-outline-variant/40 bg-primary p-3.5 text-xs text-on-primary shadow-xl">
            <button
              type="button"
              onClick={() => setShowAttentionBubble(false)}
              className="absolute right-1.5 top-1.5 cursor-pointer text-on-primary/70 transition hover:text-on-primary"
              aria-label="Dismiss stylist prompt"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="pr-4 font-medium leading-relaxed">
              {isViewingProduct
                ? 'Cần gợi ý phối đồ với sản phẩm bạn đang xem?'
                : 'Gửi ảnh trang phục hoặc mô tả phong cách để 18 Studio Stylist tư vấn ngay.'}
            </p>
            <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-primary" />
          </div>
        )}

        <button
          type="button"
          onClick={toggleDrawer}
          className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-outline-variant/30 bg-primary text-on-primary shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-primary-container active:scale-95 ${
            isOpen ? 'rotate-90' : ''
          }`}
          aria-label="Toggle AI Stylist"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <Sparkles className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 2. Floating Editorial Chat Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="18 Studio AI Stylist"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          className={`fixed bottom-24 right-6 z-50 flex max-h-[calc(100vh-120px)] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest font-body text-on-surface shadow-2xl transition-all duration-200 ${
            isExpanded ? 'h-[660px] w-[480px]' : 'h-[560px] w-[395px]'
          }`}
        >
          {/* Drag-and-drop overlay */}
          {isDragging && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary bg-surface-container-lowest/95 backdrop-blur-xs">
              <Paperclip className="h-7 w-7 text-primary" />
              <p className="font-headline text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Drop photo to scan
              </p>
              <p className="text-xs text-on-surface-variant">JPEG · PNG · WEBP up to 5 MiB</p>
            </div>
          )}

          {/* Header Panel */}
          <div className="flex items-center justify-between bg-primary px-4 py-3.5 text-on-primary">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
                <Sparkles className="h-4 w-4 text-on-primary" />
              </div>
              <div>
                <h2 className="font-headline text-xs font-extrabold uppercase tracking-[0.18em]">
                  18 Studio Stylist
                </h2>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <p className="text-[10px] uppercase tracking-[0.14em] text-on-primary/70">
                    {isViewingProduct ? 'Product Context Active' : 'Style Concierge Active'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="cursor-pointer rounded-md p-1.5 text-on-primary/70 transition hover:bg-white/10 hover:text-on-primary"
                title="New conversation"
                aria-label="New conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="hidden cursor-pointer rounded-md p-1.5 text-on-primary/70 transition hover:bg-white/10 hover:text-on-primary sm:inline-flex"
                title={isExpanded ? 'Compact view' : 'Expand view'}
                aria-label={isExpanded ? 'Compact view' : 'Expand view'}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="cursor-pointer rounded-md p-1.5 text-on-primary/70 transition hover:bg-white/10 hover:text-on-primary"
                aria-label="Minimize AI Stylist"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-surface p-4">
            {messages.map((msg, msgIndex) => {
              const isLatestMessage = msgIndex === messages.length - 1;
              const promptsToShow =
                msg.id === 'welcome' && messages.length === 1
                  ? contextualPrompts
                  : isLatestMessage && msg.sender === 'ai' && !msg.isError
                    ? msg.suggestedPrompts ?? []
                    : [];

              return (
                <div
                  key={msg.id}
                  className={`flex max-w-[90%] flex-col ${
                    msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  {msg.imageUrl && (
                    <div className="relative mb-1.5 aspect-[4/5] w-44 overflow-hidden rounded-lg border border-outline-variant/60 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.imageUrl} alt="Uploaded outfit" className="h-full w-full object-cover" />
                    </div>
                  )}

                  <div
                    className={`rounded-lg px-4 py-2.5 text-sm ${
                      msg.sender === 'user'
                        ? 'rounded-tr-none bg-primary text-on-primary shadow-xs'
                        : msg.isError
                          ? 'rounded-tl-none border border-error/40 bg-error-container/30 text-error'
                          : 'rounded-tl-none border border-outline-variant/60 bg-surface-container-lowest text-on-surface shadow-xs'
                    }`}
                  >
                    {renderSafeMarkdown(msg.text)}

                    {msg.isError && msg.retryPayload && (
                      <button
                        type="button"
                        onClick={() => void sendMessage(msg.retryPayload?.text, msg.retryPayload?.file ?? null)}
                        className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-error/40 bg-surface-container-lowest px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.16em] text-error transition hover:bg-error hover:text-on-error"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </button>
                    )}
                  </div>

                  {/* Recommended Product Cards */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-2.5 w-full space-y-2">
                      <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        Curated Matches ({msg.recommendedProducts.length})
                      </p>
                      <div className="flex flex-col gap-2">
                        {msg.recommendedProducts.map((prod) => {
                          const productUrl = prod.productDetailUrl || `/products/${prod.id}`;
                          const displayImg = prod.imageUrl || prod.imageSrc;
                          const isAdding = addingProductId === prod.id;
                          const isAdded = Boolean(addedProductIds[prod.id]);

                          return (
                            <div
                              key={prod.id}
                              className="flex items-center gap-3 overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-2 shadow-xs transition hover:border-primary"
                            >
                              <Link
                                href={productUrl}
                                className="h-14 w-12 flex-shrink-0 overflow-hidden rounded-md bg-surface-container"
                              >
                                {displayImg ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={displayImg}
                                    alt={prod.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center font-headline text-xs font-bold uppercase text-on-surface-variant">
                                    {prod.name.charAt(0)}
                                  </div>
                                )}
                              </Link>

                              <div className="min-w-0 flex-1">
                                <span className="inline-block font-label text-[9px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                                  {prod.categoryName || prod.category || 'Collection'}
                                </span>
                                <Link href={productUrl} className="block truncate text-xs font-bold text-primary hover:underline">
                                  {prod.name}
                                </Link>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <p className="font-headline text-xs font-bold text-on-surface">
                                    ${Number(prod.price ?? 0).toFixed(2)}
                                  </p>
                                  {typeof prod.stockQuantity === 'number' && prod.stockQuantity > 0 && (
                                    <span className="font-label text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                                      {prod.stockQuantity <= 5 ? `Only ${prod.stockQuantity} left` : 'In stock'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 pr-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(prod)}
                                  disabled={isAdding}
                                  title="Add to bag"
                                  aria-label={`Add ${prod.name} to bag`}
                                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition ${
                                    isAdded
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-primary text-on-primary hover:bg-primary-container'
                                  } disabled:opacity-50`}
                                >
                                  {isAdding ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : isAdded ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <ShoppingBag className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <Link
                                  href={productUrl}
                                  title="View product"
                                  aria-label={`View ${prod.name}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition hover:border-primary hover:text-primary"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Prompt Chips */}
                  {promptsToShow.length > 0 && !isLoading && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {promptsToShow.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendMessage(prompt, null)}
                          className="cursor-pointer rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-left text-[11px] font-medium text-on-surface transition hover:border-primary hover:bg-primary hover:text-on-primary"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Typing / Scanning Loader */}
            {isLoading && (
              <div className="mr-auto flex max-w-[85%] flex-col items-start space-y-2">
                {scanningPreviewUrl && (
                  <div className="relative aspect-[4/5] w-44 overflow-hidden rounded-lg border border-outline-variant/60 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={scanningPreviewUrl}
                      alt="Scanning outfit"
                      className="h-full w-full object-cover brightness-75"
                    />
                    <div className="absolute left-0 top-0 h-[4px] w-full animate-[scan_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <p className="flex animate-pulse items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Scanning look…
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-4 py-2.5 text-xs font-medium text-on-surface-variant shadow-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Curating recommendations…</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* User Input Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-2 border-t border-outline-variant/60 bg-surface-container-lowest p-3"
          >
            {fileError && (
              <p role="alert" className="text-xs font-medium text-error">
                {fileError}
              </p>
            )}

            {previewUrl && (
              <div className="flex items-center gap-2 rounded-md border border-outline-variant/60 bg-surface-container-low p-1.5 pr-2.5">
                <div className="h-10 w-9 overflow-hidden rounded-md bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} className="h-full w-full object-cover" alt="Attachment thumbnail" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-on-surface">
                    {selectedFile?.name}
                  </p>
                  <p className="font-label text-[9px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                    Ready to scan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="cursor-pointer rounded-md p-1.5 text-on-surface-variant transition hover:bg-surface-container hover:text-error"
                  aria-label="Remove attachment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                aria-label="Upload outfit photo"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border transition-colors ${
                  selectedFile
                    ? 'border-primary bg-surface-container text-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
                title="Attach outfit photo (JPEG, PNG, WEBP up to 5MB)"
                aria-label="Attach outfit photo"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                maxLength={1000}
                placeholder={selectedFile ? 'Add notes or send photo…' : 'Ask stylist or paste image…'}
                className="h-10 min-w-0 flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 text-sm text-on-surface placeholder:text-outline/70 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />

              <button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || isLoading}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-primary text-on-primary shadow-xs transition hover:bg-primary-container disabled:pointer-events-none disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
