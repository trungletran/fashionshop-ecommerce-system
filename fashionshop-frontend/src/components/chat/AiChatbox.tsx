'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  MessageSquare, 
  Paperclip, 
  Image as ImageIcon,
  Loader2,
  Trash2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';

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
    const timer = setTimeout(() => {
      setShowAttentionBubble(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

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

    } catch (err: any) {
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
          <div className="mb-3 max-w-[240px] rounded-2xl bg-brand-600 text-white p-3.5 text-xs shadow-xl animate-bounce relative border border-brand-500/20">
            <button 
              onClick={() => setShowAttentionBubble(false)}
              className="absolute top-1 right-1 text-white/70 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="font-medium pr-3">🙋‍♂️ Upload a picture! Let me help you style or find matching garments!</p>
            <div className="absolute right-6 -bottom-1.5 w-3.5 h-3.5 bg-brand-600 rotate-45" />
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowAttentionBubble(false);
          }}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen 
              ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rotate-90' 
              : 'bg-gradient-to-tr from-brand-600 to-indigo-600 hover:shadow-brand-600/30'
          }`}
          aria-label="Toggle AI Stylist"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <Sparkles className="h-6 w-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 2. Floating Glassmorphism Chat Drawer */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 z-50 flex h-[550px] w-[390px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl transition-all duration-300 dark:border-zinc-800/80 animate-in slide-in-from-bottom-5 fade-in-20"
        >
          {/* Header Panel */}
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-wide">AI Stylist</h2>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] text-white/80">Style Scan Active</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30 dark:bg-zinc-900/10">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                {/* Image message part */}
                {msg.imageUrl && (
                  <div className="relative mb-1.5 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 aspect-[4/5] w-48 shadow-sm">
                    <img 
                      src={msg.imageUrl} 
                      alt="Uploaded outfit" 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                )}

                {/* Text bubble */}
                <div 
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white shadow-md rounded-tr-none'
                      : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-tl-none'
                  }`}
                >
                  {formatMarkdown(msg.text)}
                </div>

                {/* Nested Recommended Product Cards */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="mt-3 w-full grid grid-cols-1 gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                      Matching Items ({msg.recommendedProducts.length})
                    </p>
                    <div className="flex flex-col gap-2 max-w-[340px]">
                      {msg.recommendedProducts.map((prod) => {
                        const productUrl = `/products/${prod.id}`;
                        const displayImg = prod.imageUrl || prod.imageSrc || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200';
                        return (
                          <div 
                            key={prod.id}
                            className="flex items-center gap-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-2 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="h-14 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                              <img 
                                src={displayImg} 
                                alt={prod.name} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="inline-block text-[9px] font-medium text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                                {prod.categoryName || prod.category || 'Clothing'}
                              </span>
                              <h4 className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                {prod.name}
                              </h4>
                              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
                                ${prod.price.toFixed(2)}
                              </p>
                            </div>
                            <Link 
                              href={productUrl}
                              className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 hover:bg-brand-600 hover:text-white dark:bg-zinc-800 transition text-zinc-500 dark:text-zinc-400"
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

            {/* AI Typing / Scanning Loader */}
            {isLoading && (
              <div className="mr-auto max-w-[85%] flex flex-col items-start space-y-1.5">
                {previewUrl && (
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 aspect-[4/5] w-48 shadow-sm">
                    <img 
                      src={previewUrl} 
                      alt="Uploading outfit" 
                      className="h-full w-full object-cover brightness-75" 
                    />
                    {/* Glowing scanner beam */}
                    <div className="absolute left-0 top-0 w-full h-[6px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-[scan_2s_ease-in-out_infinite]" />
                    {/* Overlay text */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                        Scanning Vibe...
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 rounded-2xl px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  <span>Drafting recommendation...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* User Input Form */}
          <form 
            onSubmit={handleSend}
            className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2"
          >
            {/* Attachment Preview bar */}
            {previewUrl && (
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1.5 pr-2.5 animate-in fade-in duration-200">
                <div className="h-10 w-9 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <img src={previewUrl} className="h-full w-full object-cover" alt="attachment thumbnail" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] truncate font-medium text-zinc-800 dark:text-zinc-200">
                    {selectedFile?.name}
                  </p>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500">
                    Ready to scan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="rounded-lg p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-danger transition"
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
              
              {/* Attachment trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  selectedFile 
                    ? 'border-brand-500/20 bg-brand-50/20 text-brand-600' 
                    : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400'
                }`}
                title="Attach Picture"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedFile ? "Add details or send photo..." : "Ask your AI Stylist..."}
                className="flex-1 min-w-0 h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-600 text-zinc-900 dark:text-zinc-100"
              />

              <button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm hover:bg-brand-700 transition disabled:opacity-50 disabled:pointer-events-none"
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
