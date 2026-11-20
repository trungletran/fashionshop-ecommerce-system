'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Paperclip, 
  Loader2, 
  Trash2, 
  ExternalLink, 
  ChevronDown 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  categoryName?: string;
  category?: string;
  price: number;
  imageUrl?: string;
  imageSrc?: string;
  description?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string;
  recommendedProducts?: Product[];
}

export function AiChatbox() {
  const pathname = usePathname();
  const isAdminOrStaff = pathname?.startsWith('/admin') || pathname?.startsWith('/staff');

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your personal **AI Fashion Stylist**. 🌟\n\nUpload a picture of a garment, an outfit you love, or describe the look you want, and I will find matching items from our store catalog!'
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAttentionBubble, setShowAttentionBubble] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show a little prompt bubble above the floating action button on initial load
  useEffect(() => {
    if (isAdminOrStaff) return;
    const timer = setTimeout(() => {
      setShowAttentionBubble(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [isAdminOrStaff]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isAdminOrStaff) return;
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isAdminOrStaff]);

  if (isAdminOrStaff) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowAttentionBubble(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMarkdown = (text: string) => {
    // Basic bold and list parser
    return text.split('\n').map((line, i) => {
      let content = line;
      // Bold **text**
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullets
      if (content.startsWith('* ') || content.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 list-disc text-sm leading-relaxed my-1" 
              dangerouslySetInnerHTML={{ __html: content.substring(2) }} />
        );
      }
      return (
        <p key={i} className="text-sm leading-relaxed min-h-[1.2rem] my-1" 
           dangerouslySetInnerHTML={{ __html: content }} />
      );
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    const userMessageId = `msg-${Date.now()}`;
    const userText = input;
    const userFile = selectedFile;
    const userImgUrl = previewUrl || undefined;

    // Reset input states
    setInput('');
    setSelectedFile(null);
    setPreviewUrl(null);

    // Add user message to thread
    setMessages(prev => [...prev, {
      id: userMessageId,
      sender: 'user',
      text: userText || 'Analyzed style image...',
      imageUrl: userImgUrl
    }]);

    setIsLoading(true);

    try {
      const formData = new FormData();
      if (userText) formData.append('message', userText);
      if (userFile) formData.append('file', userFile);

      // Build lightweight chat history from existing messages for multi-turn context
      const history = messages
        .filter(m => m.id !== 'welcome' && !m.id.startsWith('ai-err-'))
        .map(m => ({ sender: m.sender === 'ai' ? 'model' : 'user', text: m.text }));
      formData.append('history', JSON.stringify(history));

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('API server returned an error');
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        const { stylistComment, recommendedProducts } = resData.data;
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: stylistComment,
          recommendedProducts: recommendedProducts
        }]);
      } else {
        throw new Error(resData.message || 'Failed to match clothing items.');
      }

    } catch (err: unknown) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Oops! I encountered an error connecting to the style core. Please verify that the server is active or try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. Floating Action Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Hover/Attention Bubble */}
        {showAttentionBubble && !isOpen && (
          <div className="relative mb-3 max-w-[240px] rounded-lg border border-outline-variant/40 bg-primary p-3.5 text-xs text-on-primary shadow-xl animate-bounce">
            <button
              type="button"
              onClick={() => setShowAttentionBubble(false)}
              className="absolute right-1.5 top-1.5 text-on-primary/70 transition hover:text-on-primary"
              aria-label="Dismiss stylist prompt"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="pr-3 font-medium leading-relaxed">
              Upload a look or ask for styling advice to discover matching pieces.
            </p>
            <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-primary" />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setShowAttentionBubble(false);
          }}
          className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-outline-variant/30 bg-primary text-on-primary shadow-2xl transition-all duration-300 hover:bg-primary-container hover:scale-105 active:scale-95 ${
            isOpen ? 'rotate-90' : ''
          }`}
          aria-label="Toggle AI Stylist"
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
        <div className="fixed bottom-24 right-6 z-50 flex h-[550px] max-h-[calc(100vh-120px)] w-[390px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest font-body text-on-surface shadow-2xl transition-all duration-300">
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
                    Style Concierge Active
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer rounded-md p-1.5 text-on-primary/70 transition hover:bg-white/10 hover:text-on-primary"
              aria-label="Minimize AI Stylist"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-surface p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex max-w-[85%] flex-col ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                {msg.imageUrl && (
                  <div className="relative mb-1.5 aspect-[4/5] w-48 overflow-hidden rounded-lg border border-outline-variant/60 shadow-xs">
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded outfit"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'rounded-tr-none bg-primary text-on-primary shadow-xs'
                      : 'rounded-tl-none border border-outline-variant/60 bg-surface-container-lowest text-on-surface shadow-xs'
                  }`}
                >
                  {formatMarkdown(msg.text)}
                </div>

                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="mt-3 grid w-full grid-cols-1 gap-2.5">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      Matching Items ({msg.recommendedProducts.length})
                    </p>
                    <div className="flex max-w-[340px] flex-col gap-2">
                      {msg.recommendedProducts.map((prod) => {
                        const productUrl = `/products/${prod.id}`;
                        const displayImg = prod.imageUrl || prod.imageSrc || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200';
                        return (
                          <div
                            key={prod.id}
                            className="flex items-center gap-3 overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-2 shadow-xs transition hover:border-primary"
                          >
                            <div className="h-14 w-12 flex-shrink-0 overflow-hidden rounded-md bg-surface-container">
                              <img
                                src={displayImg}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="inline-block font-label text-[9px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                                {prod.categoryName || prod.category || 'Clothing'}
                              </span>
                              <h4 className="truncate text-xs font-bold text-primary">
                                {prod.name}
                              </h4>
                              <p className="mt-0.5 text-xs font-bold text-on-surface">
                                ${prod.price.toFixed(2)}
                              </p>
                            </div>
                            <Link
                              href={productUrl}
                              className="mr-1 flex h-8 w-8 items-center justify-center rounded-md bg-surface-container text-on-surface-variant transition hover:bg-primary hover:text-on-primary"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="mr-auto flex max-w-[85%] flex-col items-start space-y-1.5">
                {previewUrl && (
                  <div className="relative aspect-[4/5] w-48 overflow-hidden rounded-lg border border-outline-variant/60 shadow-xs">
                    <img
                      src={previewUrl}
                      alt="Uploading outfit"
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

                <div className="flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant shadow-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Drafting recommendation…</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* User Input Form */}
          <form
            onSubmit={handleSend}
            className="space-y-2 border-t border-outline-variant/60 bg-surface-container-lowest p-3"
          >
            {previewUrl && (
              <div className="flex items-center gap-2 rounded-md border border-outline-variant/60 bg-surface-container-low p-1.5 pr-2.5">
                <div className="h-10 w-9 overflow-hidden rounded-md bg-surface-container">
                  <img src={previewUrl} className="h-full w-full object-cover" alt="attachment thumbnail" />
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
                accept="image/*"
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
                title="Attach Picture"
                aria-label="Attach picture"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedFile ? 'Add details or send photo…' : 'Ask your AI Stylist…'}
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
