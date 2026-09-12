'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  Building2,
  Globe,
  Lock,
  History,
  ChevronRight,
  Search,
} from 'lucide-react';
import { ChatMessage, ChatUser, UserRole } from '@/lib/types';
import { fetchChatMessages, addChatMessage, fetchChatUsers } from '@/lib/api/supabase-service';

interface StudentContextualChatPanelProps {
  studentId: string;
  studentName?: string;
  currentRole: UserRole;
  currentUserId?: string;
  currentUserName?: string;
}

export const StudentContextualChatPanel: React.FC<StudentContextualChatPanelProps> = ({
  studentId,
  studentName,
  currentRole,
  currentUserId = 'user-current',
  currentUserName = 'Current User',
}) => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'HISTORY'>('CHAT');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, messagesData] = await Promise.all([
        fetch('/api/chat-messages?action=users', { credentials: 'include' })
          .then((r) => r.json())
          .then((d) => d.users || [])
          .catch(() => fetchChatUsers(currentRole)),
        fetchChatMessages({ student_id: studentId }),
      ]);
      setAvailableUsers(usersRes);
      setMessages(messagesData);
    } catch (err) {
      console.error('Failed to load candidate contextual chat', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId, currentRole]);

  useEffect(() => {
    if (activeTab === 'CHAT') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, selectedUserId]);

  const roleFilteredUsers = useMemo(() => {
    return availableUsers.filter((u) => u.role === selectedRole);
  }, [availableUsers, selectedRole]);

  useEffect(() => {
    if (selectedRole === 'REGISTRAR' && (selectedUserId === 'ALL' || !roleFilteredUsers.some((u) => u.id === selectedUserId))) {
      if (roleFilteredUsers.length > 0) {
        setSelectedUserId(roleFilteredUsers[0].id);
      }
    }
  }, [selectedRole, roleFilteredUsers, selectedUserId]);

  const displayMessages = useMemo(() => {
    return messages.filter((m) => {
      if (selectedUserId === 'ALL') {
        return m.recipient_role === selectedRole || m.sender_role === selectedRole || m.sender_role === currentRole;
      }
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
        student_id: studentId,
        message: inputText.trim(),
      });

      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
    } catch (err) {
      console.error('Failed to send comment', err);
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
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col h-[640px] overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-xs">Candidate Verification Notes</h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {studentName ? `Record: ${studentName}` : 'Dossier Remarks'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 p-1 gap-1">
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'CHAT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3 h-3 text-blue-600" />
          <span>Active Comments</span>
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3 h-3 text-emerald-600" />
          <span>User History</span>
        </button>
      </div>

      {activeTab === 'CHAT' && (
        <>
          {/* Recipient & User Selector */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 space-y-1.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Target Role Channel
              </label>
              {allowedRecipients.length === 1 ? (
                <div className="flex items-center justify-between px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700">
                  <span className="flex items-center gap-1.5 font-medium text-[11px]">
                    <Lock className="w-3 h-3 text-slate-400" />
                    {allowedRecipients[0].label}
                  </span>
                  <span className="text-[10px] text-slate-400 italic">Strict Matrix</span>
                </div>
              ) : (
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value as UserRole);
                    setSelectedUserId('ALL');
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                >
                  {allowedRecipients.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Recipient Person
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
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

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/40">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-xs">
                Loading notes...
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">No comments posted</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Add verification remarks for candidate.
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
                    <div className="flex items-center gap-1 mb-1 px-1">
                      <span className="text-[11px] font-medium text-slate-700">{msg.sender_name}</span>
                      {getRoleBadge(msg.sender_role)}
                    </div>
                    <div
                      className={`max-w-[90%] p-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
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

          {/* Input */}
          <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Add remark or message..."
                className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </>
      )}

      {activeTab === 'HISTORY' && (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          <div className="p-2.5 bg-white border-b border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search candidate contacts..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {availableUsers
              .filter((u) =>
                historySearch ? u.full_name.toLowerCase().includes(historySearch.toLowerCase()) : true
              )
              .map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedRole(user.role);
                    setSelectedUserId(user.id);
                    setActiveTab('CHAT');
                  }}
                  className="p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.full_name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">{user.full_name}</span>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {user.institution_name || user.email}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-all" />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
