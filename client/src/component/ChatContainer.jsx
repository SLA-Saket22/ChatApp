import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

// ── Tick marks ────────────────────────────────────────────────────
const MessageTicks = ({ status, isOwn }) => {
    if (!isOwn) return null;
    if (status === "sending") return <span className="text-[10px] text-white/30 ml-1">🕐</span>;

    const tickPath = "M11.071.653a.75.75 0 0 1 .025 1.06L5.362 8.03a.75.75 0 0 1-1.085 0L1.654 5.229a.75.75 0 1 1 1.085-1.036l2.08 2.178L10.01.678a.75.75 0 0 1 1.06-.025z";
    const color = status === "seen" ? "text-blue-400" : "text-white/40";

    if (status === "sent") {
        return (
            <svg className={`inline w-3 h-3 ml-1 ${color}`} viewBox="0 0 16 11" fill="currentColor">
                <path d={tickPath} />
            </svg>
        );
    }
    return (
        <span className={`inline-flex ml-1 ${color}`}>
            <svg className="w-3 h-3" viewBox="0 0 16 11" fill="currentColor"><path d={tickPath} /></svg>
            <svg className="w-3 h-3 -ml-1.5" viewBox="0 0 16 11" fill="currentColor"><path d={tickPath} /></svg>
        </span>
    );
};

// ── File icon ─────────────────────────────────────────────────────
const FileMessage = ({ file }) => {
    const icons = { pdf: "📄", doc: "📝", docx: "📝", txt: "📃", zip: "🗜️", mp4: "🎬" };
    const icon = icons[file.type] || "📎";
    const sizeKB = file.size ? `${Math.round(file.size / 1024)} KB` : "";

    return (
        <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors min-w-[160px] max-w-[220px]"
        >
            <span className="text-xl">{icon}</span>
            <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium truncate">{file.name}</span>
                {sizeKB && <span className="text-[10px] text-white/40">{sizeKB}</span>}
            </div>
            <svg className="w-3 h-3 ml-auto shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        </a>
    );
};

// ── Reminder badge ────────────────────────────────────────────────
const ReminderBadge = ({ type }) => {
    const config = {
        exam:     { label: "Exam", color: "bg-red-500/20 text-red-300 border-red-500/30" },
        deadline: { label: "Deadline", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
        submission:{ label: "Submit", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
        meeting:  { label: "Meeting", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
        other:    { label: "Important", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
    };
    const { label, color } = config[type] || config.other;
    return (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${color} mb-1 inline-block`}>
            ⏰ {label}
        </span>
    );
};

// ── Main component ─────────────────────────────────────────────────
const ChatContainer = () => {
    const { messages, sendMessage, selectedUser, getMessages, setMessages } = useContext(ChatContext);
    const { authUser, onlineUsers, axios } = useContext(AuthContext);

    const [text, setText] = useState("");
    const [image, setImage] = useState(null);
    const [file, setFile] = useState(null);
    const [isSending, setIsSending] = useState(false);

    // Feature states
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [showImportantOnly, setShowImportantOnly] = useState(false);
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [reminders, setReminders] = useState([]);
    const [showReminders, setShowReminders] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!selectedUser) return;
        getMessages(selectedUser._id);
        setSummary(null);
        setSearchResults(null);
        setShowSearch(false);
        setShowImportantOnly(false);
        setTimeout(() => inputRef.current?.focus(), 100);
        fetchReminders();
    }, [selectedUser]);

    const fetchReminders = async () => {
        try {
            const { data } = await axios.get("/api/message/reminders");
            if (data.success) setReminders(data.reminders.filter(r => !r.isRead));
        } catch { /* silent */ }
    };

    // Search
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        try {
            const { data } = await axios.get(`/api/message/${selectedUser._id}/search?query=${encodeURIComponent(searchQuery)}`);
            if (data.success) setSearchResults(data.messages);
        } catch { /* silent */ }
    }, [searchQuery, selectedUser, axios]);

    useEffect(() => {
        if (!showSearch) { setSearchResults(null); setSearchQuery(""); return; }
        setTimeout(() => searchRef.current?.focus(), 100);
    }, [showSearch]);

    useEffect(() => {
        const t = setTimeout(handleSearch, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // AI Summary
    const handleSummary = async () => {
    setSummaryLoading(true);
    setSummary(null);
    try {
        const { data } = await axios.get(`/api/message/${selectedUser._id}/summary`);
        if (data.success) {
            setSummary(data.summary);
        } else {
            setSummary(`Error: ${data.message}`);
        }
    } catch (err) {
        setSummary(`Error: ${err.message}`);
    } finally {
        setSummaryLoading(false);
    }
};

    // File handling
    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 10 * 1024 * 1024) { alert("File too large (max 10MB)"); return; }
        setFile(f);
    };

    const handleImageChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result);
        reader.readAsDataURL(f);
    };

    const handleSend = useCallback(async () => {
        if (isSending || (!text.trim() && !image && !file)) return;
        setIsSending(true);
        try {
            if (file) {
                const formData = new FormData();
                if (text.trim()) formData.append("text", text.trim());
                formData.append("file", file);
                const { data } = await axios.post(
                    `/api/message/send/${selectedUser._id}`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                if (data.success) setMessages(prev => [...prev, { ...data.newMessage, status: "sent" }]);
            } else {
                await sendMessage({ text: text.trim(), image });
            }
            setText("");
            setImage(null);
            setFile(null);
            if (fileRef.current) fileRef.current.value = "";
        } finally {
            setIsSending(false);
        }
    }, [isSending, text, image, file, sendMessage, selectedUser, axios, setMessages]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const getStatus = (msg) => {
        if (msg.status) return msg.status;
        if (msg.seen) return "seen";
        return "sent";
    };

    const displayMessages = showImportantOnly
        ? (searchResults ?? messages).filter(m => m.isImportant)
        : (searchResults ?? messages);

    if (!selectedUser) {
        return (
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-white/20 gap-3">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-[13px]">Select a user to start chatting</p>
            </div>
        );
    }

    const isOnline = onlineUsers.includes(selectedUser._id);
    const unreadReminders = reminders.filter(r => !r.isRead).length;

    return (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <div className="relative">
                    <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-9 h-9 rounded-full object-cover" />
                    {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d0d14]" />}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-[13.5px] font-semibold text-white truncate">{selectedUser.fullName}</h3>
                    <span className={`text-[11px] ${isOnline ? "text-emerald-400" : "text-white/35"}`}>
                        {isOnline ? "● Online" : "Offline"}
                    </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    {/* Reminders bell */}
                    <button
                        onClick={() => setShowReminders(p => !p)}
                        title="Reminders"
                        className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showReminders ? "bg-violet-500/20 text-violet-400" : "text-white/40 hover:text-white/80 hover:bg-white/5"}`}
                    >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadReminders > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                                {unreadReminders}
                            </span>
                        )}
                    </button>

                    {/* Important filter */}
                    <button
                        onClick={() => setShowImportantOnly(p => !p)}
                        title="Show important only"
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showImportantOnly ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white/80 hover:bg-white/5"}`}
                    >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>

                    {/* Search */}
                    <button
                        onClick={() => setShowSearch(p => !p)}
                        title="Search messages"
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showSearch ? "bg-blue-500/20 text-blue-400" : "text-white/40 hover:text-white/80 hover:bg-white/5"}`}
                    >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
                        </svg>
                    </button>

                    {/* AI Summary */}
                    <button
                        onClick={handleSummary}
                        title="AI Summary"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                    >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Search bar ── */}
            {showSearch && (
                <div className="flex-shrink-0 px-4 py-2 border-b border-white/[0.06] flex items-center gap-2 bg-blue-500/5">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                        <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        ref={searchRef}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search in conversation..."
                        className="flex-1 bg-transparent outline-none text-white text-[12px] placeholder-white/25"
                    />
                    {searchResults && (
                        <span className="text-[10px] text-blue-400">{searchResults.length} found</span>
                    )}
                    <button onClick={() => { setShowSearch(false); setSearchResults(null); setSearchQuery(""); }} className="text-white/30 hover:text-white/60">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Reminders panel ── */}
            {showReminders && (
                <div className="flex-shrink-0 px-4 py-3 border-b border-white/[0.06] bg-violet-500/5 max-h-40 overflow-y-auto">
                    <p className="text-[10px] uppercase tracking-widest text-violet-400 mb-2">Reminders</p>
                    {reminders.length === 0 ? (
                        <p className="text-[11px] text-white/30">No active reminders</p>
                    ) : (
                        reminders.map(r => (
                            <div key={r._id} className="flex items-start gap-2 mb-2">
                                <div className="flex-1">
                                    <p className="text-[11.5px] text-white/80">{r.text}</p>
                                    {r.date && (
                                        <p className="text-[10px] text-violet-300">
                                            {new Date(r.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={async () => {
                                        await axios.put(`/api/message/reminder/${r._id}/read`);
                                        setReminders(prev => prev.filter(x => x._id !== r._id));
                                    }}
                                    className="text-white/20 hover:text-white/60 text-xs"
                                >✓</button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── AI Summary panel ── */}
            {(summary || summaryLoading) && (
                <div className="flex-shrink-0 mx-4 mt-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] uppercase tracking-widest text-violet-400">AI Summary</p>
                        <button onClick={() => setSummary(null)} className="text-white/20 hover:text-white/60 text-xs">✕</button>
                    </div>
                    {summaryLoading
                        ? <p className="text-[12px] text-white/40 animate-pulse">Generating summary...</p>
                        : <p className="text-[12px] text-white/75 leading-relaxed">{summary}</p>
                    }
                </div>
            )}

            {/* ── Important filter banner ── */}
            {showImportantOnly && (
                <div className="flex-shrink-0 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                    <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24" className="text-amber-400">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-[11px] text-amber-300">Showing important messages only — {displayMessages.length} found</p>
                </div>
            )}

            {/* ── Messages ── */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-1">
                {displayMessages.length === 0 && (showImportantOnly || searchResults) ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
                        <p className="text-[13px]">
                            {showImportantOnly ? "No important messages found" : "No messages match your search"}
                        </p>
                    </div>
                ) : (
                    displayMessages.map((msg, idx) => {
                        const isOwn = msg.senderId === authUser._id ||
                            (msg.senderId?._id && msg.senderId._id === authUser._id);
                        const arr = searchResults ?? messages;
                        const nextMsg = arr[idx + 1];
                        const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                        const status = getStatus(msg);

                        return (
                            <div key={msg._id} className={`flex items-end gap-2 w-full ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                                {!isOwn && (
                                    <div className="w-7 h-7 flex-shrink-0">
                                        {isLastInGroup && (
                                            <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-7 h-7 rounded-full object-cover" />
                                        )}
                                    </div>
                                )}
                                <div className={`flex flex-col max-w-[65%] ${isOwn ? "items-end" : "items-start"}`}>
                                    {/* Reminder badge */}
                                    {msg.isImportant && msg.reminder && (
                                        <ReminderBadge type={msg.reminder?.type || "other"} />
                                    )}
                                    {msg.isImportant && !msg.reminder && (
                                        <ReminderBadge type="other" />
                                    )}

                                    {/* Image */}
                                    {msg.image && (
                                        <img src={msg.image} alt="" onClick={() => window.open(msg.image)}
                                            className="max-w-[220px] rounded-xl mb-1 cursor-pointer object-cover" />
                                    )}

                                    {/* File */}
                                    {msg.file?.url && <FileMessage file={msg.file} />}

                                    {/* Text */}
                                    {msg.text && (
                                        <div className={`px-3.5 py-2 text-[12.5px] leading-relaxed break-words ${
                                            isOwn
                                                ? "bg-gradient-to-br from-violet-600 to-violet-400 text-white rounded-2xl rounded-br-[4px]"
                                                : "bg-white/[0.08] text-white/90 rounded-2xl rounded-bl-[4px]"
                                        }`}>
                                            {msg.text}
                                        </div>
                                    )}

                                    {/* Timestamp + ticks */}
                                    {isLastInGroup && (
                                        <div className="flex items-center gap-0.5 mt-1 px-1">
                                            <span className="text-[10px] text-white/25">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            <MessageTicks status={status} isOwn={isOwn} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Attachments preview ── */}
            {(image || file) && (
                <div className="flex-shrink-0 px-5 pb-2 flex items-center gap-2">
                    {image && (
                        <div className="relative">
                            <img src={image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                            <button onClick={() => setImage(null)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center">✕</button>
                        </div>
                    )}
                    {file && (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                            <span className="text-[11px] text-white/70 truncate max-w-[160px]">{file.name}</span>
                            <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                                className="text-white/30 hover:text-white/70 text-xs">✕</button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Input ── */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-white/[0.06] flex items-center gap-2">
                {/* Image picker */}
                <label className="cursor-pointer opacity-40 hover:opacity-80 transition-opacity flex-shrink-0" title="Send image">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <img src={assets.gallery_icon} alt="" className="w-5" />
                </label>

                {/* File picker */}
                <label className="cursor-pointer opacity-40 hover:opacity-80 transition-opacity flex-shrink-0" title="Attach file">
                    <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.zip,.mp4" className="hidden" onChange={handleFileChange} />
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </label>

                <input
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    type="text"
                    placeholder="Write a message..."
                    className="flex-1 min-w-0 bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-[12.5px] outline-none placeholder-white/25 focus:border-violet-500/40 transition-colors"
                />

                <button
                    onClick={handleSend}
                    disabled={isSending}
                    className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
                        isSending ? "bg-violet-500/40 cursor-not-allowed" : "bg-gradient-to-br from-violet-600 to-violet-400 hover:scale-105 active:scale-95"
                    }`}
                >
                    {isSending
                        ? <span className="text-sm">🕐</span>
                        : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                    }
                </button>
            </div>
        </div>
    );
};

export default ChatContainer;