'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  X,
  Send,
  User,
  ShieldCheck,
  Building2,
  Globe,
  Lock,
  History,
  ChevronRight,
  UserCheck,
  Users,
  Search,
} from 'lucide-react';
import { ChatMessage, ChatUser, UserRole } from '@/lib/types';
import { fetchChatMessages, addChatMessage, fetchChatUsers } from '@/lib/api/supabase-service';

interface GlobalStudentsChatDrawerProps {
  currentRole: UserRole;
  currentUserId?: string;
  currentUserName?: string;
}

export const GlobalStudentsChatDrawer: React.FC<GlobalStudentsChatDrawerProps> = ({
  currentRole,
  currentUserId = 'user-current',
  currentUserName = 'Current User',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'HISTORY'>('CHAT');

  // Messages & Users State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL'); // 'ALL' or specific userId
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Allowed Role Channels based on Guardrails Matrix
  const getAllowedRecipients = (role: UserRole): Array<{ value: UserRole; label: string }> => {
    switch (role) {
      case 'REGISTRAR':
        return [{ value: 'ADMINISTRATOR', label: 'Administrator' }];
      case 'ADMINISTRATOR':
        return [
          { value: 'REGISTRAR', label: 'Institutional Registrars' },
          { value: 'UNIVERSAL', label: 'Universal Oversight' },
        ];
      case 'UNIVERSAL':
        return [
          { value: 'REGISTRAR', label: 'Institutional Registrars' },
          { value: 'ADMINISTRATOR', label: 'Administrators' },
        ];
      default:
        return [];
    }
  };

  const allowedRecipients = getAllowedRecipients(currentRole);
  const [selectedRole, setSelectedRole] = useState<UserRole>(allowedRecipients[0]?.value || 'ADMINISTRATOR');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadUsersAndMessages = async () => {
    setLoading(true);
    try {
      const [usersRes, messagesData] = await Promise.all([
        fetch('/api/chat-messages?action=users', { credentials: 'include' })
          .then((r) => r.json())
          .then((d) => d.users || [])
          .catch(() => fetchChatUsers(currentRole)),
        fetchChatMessages(),
      ]);
      setAvailableUsers(usersRes);
      setMessages(messagesData);
    } catch (err) {
      console.error('Failed to load chat data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsersAndMessages();
    }
  }, [isOpen, currentRole]);

  useEffect(() => {
    if (isOpen && activeTab === 'CHAT') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab, selectedUserId]);

  // Filter available users for current selected recipient role
  const roleFilteredUsers = useMemo(() => {
    return availableUsers.filter((u) => u.role === selectedRole);
  }, [availableUsers, selectedRole]);

  // Ensure Registrar role target defaults to a specific user (no ALL broadcast for Registrars)
  useEffect(() => {
    if (selectedRole === 'REGISTRAR' && (selectedUserId === 'ALL' || !roleFilteredUsers.some((u) => u.id === selectedUserId))) {
      if (roleFilteredUsers.length > 0) {
        setSelectedUserId(roleFilteredUsers[0].id);
      }
    }
  }, [selectedRole, roleFilteredUsers, selectedUserId]);

  // Filter messages for active chat feed (direct user messages or broadcast role messages)
  const displayMessages = useMemo(() => {
    return messages.filter((m) => {
      // Exclude candidate-specific timeline comments from global drawer feed
      if (m.student_id) return false;

      if (selectedUserId === 'ALL') {
        // Show role broadcast messages or all role messages
        return m.recipient_role === selectedRole || m.sender_role === selectedRole || m.sender_role === currentRole;
      }

      // Specific User Thread: messages between current user/role and target user
      return (
        (m.sender_id === selectedUserId && (m.recipient_id === currentUserId || !m.recipient_id)) ||
        (m.sender_id === currentUserId && (m.recipient_id === selectedUserId || !m.recipient_id)) ||
        (m.recipient_id === selectedUserId)
      );
    });
  }, [messages, selectedUserId, selectedRole, currentUserId, currentRole]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const targetUser = availableUsers.find((u) => u.id === selectedUserId);
      const newMsg = await addChatMessage({
        sender_id: currentUserId,
        sender_name: currentUserName,
        sender_role: currentRole,
        recipient_role: targetUser ? targetUser.role : selectedRole,
        recipient_id: selectedUserId !== 'ALL' ? selectedUserId : undefined,
        message: inputText.trim(),
      });

      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'UNIVERSAL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Globe className="w-3 h-3" /> Universal
          </span>
        );
      case 'ADMINISTRATOR':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3" /> Admin
          </span>
        );
      case 'REGISTRAR':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Building2 className="w-3 h-3" /> Registrar
          </span>
        );
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center justify-center p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-400"
          aria-label="Open Role Dispatch Chat"
          title="Role Dispatch & Direct User Chat"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-slate-100 transition-transform transform rotate-90" />
          ) : (
            <MessageSquare className="w-6 h-6 text-slate-100" />
          )}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-white"></span>
          </span>
        </button>
      </div>

      {/* Drawer Overlay & Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">Role Dispatch &amp; Chat</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">Authorized:</span>
                    {getRoleBadge(currentRole)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs (Active Chat vs Chat History) */}
            <div className="flex border-b border-slate-200 bg-slate-100/80 p-1 gap-1">
              <button
                onClick={() => setActiveTab('CHAT')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'CHAT'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Active Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('HISTORY')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'HISTORY'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chat History ({availableUsers.length})</span>
              </button>
            </div>

            {/* TAB 1: ACTIVE CHAT FEED */}
            {activeTab === 'CHAT' && (
              <>
                {/* Target Role & Specific User Selectors */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
                  {/* Target Role Selector */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Target Role Channel
                    </label>
                    {allowedRecipients.length === 1 ? (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          {allowedRecipients[0].label}
                        </span>
                        <span className="text-[10px] text-slate-400 italic">Role Matrix</span>
                      </div>
                    ) : (
                      <select
                        value={selectedRole}
                        onChange={(e) => {
                          setSelectedRole(e.target.value as UserRole);
                          setSelectedUserId('ALL');
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {allowedRecipients.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Specific User Recipient Dropdown */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Recipient Person / User
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {selectedRole !== 'REGISTRAR' && (
                        <option value="ALL">📢 All {selectedRole}s (Broadcast Channel)</option>
                      )}
                      {roleFilteredUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          👤 {u.full_name} ({u.institution_name || u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
                  {loading ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
                      Loading communications...
                    </div>
                  ) : displayMessages.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">No direct messages yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Send a message to{' '}
                        {selectedUserId === 'ALL'
                          ? `all ${selectedRole}s`
                          : availableUsers.find((u) => u.id === selectedUserId)?.full_name || 'selected user'}
                        .
                      </p>
                    </div>
                  ) : (
                    displayMessages.map((msg) => {
                      const isSelf = msg.sender_id === currentUserId || msg.sender_role === currentRole;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[11px] font-medium text-slate-700">{msg.sender_name}</span>
                            {getRoleBadge(msg.sender_role)}
                          </div>
                          <div
                            className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isSelf
                                ? 'bg-slate-900 text-slate-100 rounded-tr-none'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Message ${
                        selectedUserId === 'ALL'
                          ? `${selectedRole}s`
                          : availableUsers.find((u) => u.id === selectedUserId)?.full_name || 'user'
                      }...`}
                      className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || sending}
                      className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* TAB 2: CHAT HISTORY & USER DIRECTORY */}
            {activeTab === 'HISTORY' && (
              <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                {/* Search Bar */}
                <div className="p-3 bg-white border-b border-slate-200">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search contacts by name or role..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Permitted Role Contacts ({availableUsers.length})
                  </div>

                  {availableUsers
                    .filter((u) =>
                      historySearch
                        ? u.full_name.toLowerCase().includes(historySearch.toLowerCase()) ||
                          u.role.toLowerCase().includes(historySearch.toLowerCase())
                        : true
                    )
                    .map((user) => {
                      const lastMsg = messages
                        .filter((m) => m.sender_id === user.id || m.recipient_id === user.id)
                        .pop();

                      return (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedRole(user.role);
                            setSelectedUserId(user.id);
                            setActiveTab('CHAT');
                          }}
                          className="p-3 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {user.full_name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {user.full_name}
                                </span>
                                {getRoleBadge(user.role)}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {lastMsg ? lastMsg.message : user.institution_name || user.email}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
