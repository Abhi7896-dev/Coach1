import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HelpCircle,
  LogOut,
  Search,
  RefreshCw,
  Building2,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Wallet,
  Activity,
  MessageCircle,
  Send,
  UserX,
  CalendarDays,
  Settings,
  ShieldAlert,
  Bell,
  UploadCloud,
  Receipt,
  Command,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  CheckCheck,
  Check,
} from 'lucide-react';
import { AdminUser } from '@/lib/supabase';
export type AdminTabId =
  | 'overview'
  | 'coaches'
  | 'academies'
  | 'parents'
  | 'growth'
  | 'finance'
  | 'activity'
  | 'whatsapp'
  | 'pushtemplates'
  | 'bulkimport'
  | 'paymentnotifications'
  | 'whatsappinbox'
  | 'messagelogs'
  | 'deletionrequests'
  | 'admissions'
  | 'tickets'
  | 'events'
  | 'settings'
  | 'authregistry';

export type DomainCategoryId = 'directory' | 'messaging' | 'operations' | 'platform';

export interface AdminSidebarProps {
  activeTab: AdminTabId;
  setActiveTab: (tab: AdminTabId) => void;
  coachesCount: number;
  pendingCoachesCount: number;
  academiesCount: number;
  parentsCount: number;
  selfRegisteredParentsCount?: number;
  admissionsCount: number;
  newAdmissionsCount?: number;
  ticketsCount: number;
  openTicketsCount: number;
  communityEventsCount: number;
  upcomingEventsCount?: number;
  deletionRequestsCount?: number;
  messagesSent7dCount?: number;
  whatsappTemplateCount?: number;
  pendingFinanceCount?: number;
  adminUser: AdminUser | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSignOutClick: () => void;
  onResetSearch?: () => void;
  children: React.ReactNode;
}

interface TabItemConfig {
  id: AdminTabId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  count?: number;
  badge?: number | string;
  badgeColor?: 'orange' | 'rose' | 'emerald' | 'blue' | 'purple';
  description: string;
  keywords: string[];
}

interface CategoryGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: 'orange' | 'rose' | 'emerald' | 'blue' | 'purple';
  tabs: TabItemConfig[];
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  coachesCount,
  pendingCoachesCount,
  academiesCount,
  parentsCount,
  selfRegisteredParentsCount = 0,
  admissionsCount,
  newAdmissionsCount = 0,
  ticketsCount,
  openTicketsCount,
  communityEventsCount,
  upcomingEventsCount = 0,
  deletionRequestsCount = 0,
  messagesSent7dCount = 0,
  whatsappTemplateCount = 0,
  pendingFinanceCount = 0,
  adminUser,
  isRefreshing,
  onRefresh,
  onSignOutClick,
  onResetSearch,
  children,
}: AdminSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const paletteInputRef = useRef<HTMLInputElement>(null);

  const SEEN_STORAGE_KEY = 'trucoach_admin_seen_badges';
  const VISITED_TABS_KEY = 'trucoach_admin_visited_tabs';

  // Read stored seen badge counts from localStorage
  const [seenCounts, setSeenCounts] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  });

  // Track tabs visited during this browser session
  const [visitedTabs, setVisitedTabs] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(VISITED_TABS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  });

  // Track raw actionable notification counts per tab
  const rawBadges: Record<AdminTabId, number> = useMemo(
    () => ({
      overview: 0,
      coaches: pendingCoachesCount || 0,
      academies: 0,
      parents: 0,
      growth: selfRegisteredParentsCount || 0,
      finance: pendingFinanceCount || 0,
      activity: 0,
      whatsappinbox: 0,
      whatsapp: 0,
      pushtemplates: 0,
      messagelogs: messagesSent7dCount || 0,
      paymentnotifications: 0,
      bulkimport: 0,
      admissions: newAdmissionsCount || 0,
      tickets: openTicketsCount || 0,
      events: upcomingEventsCount || 0,
      deletionrequests: deletionRequestsCount || 0,
      settings: 0,
      authregistry: 0,
    }),
    [
      pendingCoachesCount,
      selfRegisteredParentsCount,
      pendingFinanceCount,
      messagesSent7dCount,
      newAdmissionsCount,
      openTicketsCount,
      upcomingEventsCount,
      deletionRequestsCount,
    ]
  );

  // Automatically mark the currently active tab as visited/seen!
  useEffect(() => {
    if (!activeTab) return;

    // Track tab visit history in this browser
    setVisitedTabs((prev) => {
      if (prev[activeTab]) return prev;
      const next = { ...prev, [activeTab]: Date.now() };
      try {
        localStorage.setItem(VISITED_TABS_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    const currentRaw = rawBadges[activeTab] || 0;
    if (currentRaw > 0) {
      setSeenCounts((prev) => {
        if (prev[activeTab] === currentRaw) return prev;
        const next = { ...prev, [activeTab]: currentRaw };
        try {
          localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next));
        } catch (_) {}
        return next;
      });
    }
  }, [activeTab, rawBadges]);

  // Helper to compute unread badge for a tab.
  // When the user has visited the tab, the unread count clears!
  const getUnreadBadge = (tabId: AdminTabId): number | undefined => {
    const raw = rawBadges[tabId] || 0;
    if (raw <= 0) return undefined;
    // If the admin is actively on this tab right now, badge is cleared!
    if (activeTab === tabId) return undefined;
    const seen = seenCounts[tabId] || 0;
    const unread = Math.max(0, raw - seen);
    return unread > 0 ? unread : undefined;
  };

  // Clear all badges (Mark all as visited)
  const handleClearAllBadges = () => {
    const next: Record<string, number> = {};
    (Object.keys(rawBadges) as AdminTabId[]).forEach((tabId) => {
      next[tabId] = rawBadges[tabId];
    });
    setSeenCounts(next);
    try {
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
  };

  // Group definitions with rich category badges and per-tab notification counts
  const categoryGroups: CategoryGroup[] = useMemo(() => {
    // 1. Directory unread totals
    const unreadCoaches = getUnreadBadge('coaches') || 0;
    const unreadGrowth = getUnreadBadge('growth') || 0;
    const unreadFinance = getUnreadBadge('finance') || 0;
    const dirUnreadTotal = unreadCoaches + unreadGrowth + unreadFinance;

    // 2. Messaging unread totals
    const unreadMessages = getUnreadBadge('messagelogs') || 0;

    // 3. Operations unread totals
    const unreadAdmissions = getUnreadBadge('admissions') || 0;
    const unreadTickets = getUnreadBadge('tickets') || 0;
    const unreadEvents = getUnreadBadge('events') || 0;
    const unreadDeletions = getUnreadBadge('deletionrequests') || 0;
    const opsUnreadTotal = unreadAdmissions + unreadTickets + unreadDeletions + unreadEvents;

    return [
      {
        id: 'directory',
        label: 'Core Directory',
        icon: Building2,
        badge: dirUnreadTotal > 0 ? dirUnreadTotal : undefined,
        badgeColor: unreadCoaches > 0 ? 'orange' : 'emerald',
        tabs: [
          {
            id: 'overview',
            label: 'Overview',
            shortLabel: 'Overview',
            icon: LayoutDashboard,
            description: 'Platform KPIs, financial overview & live activity',
            keywords: ['dashboard', 'kpi', 'stats', 'analytics', 'summary', 'home'],
          },
          {
            id: 'coaches',
            label: 'Coaches',
            shortLabel: 'Coaches',
            icon: GraduationCap,
            count: coachesCount,
            badge: getUnreadBadge('coaches'),
            badgeColor: 'orange',
            description: 'Coach registry, onboarding approvals & pricing tiers',
            keywords: ['tutor', 'trainer', 'verification', 'pending', 'instructor'],
          },
          {
            id: 'academies',
            label: 'Academies',
            shortLabel: 'Academies',
            icon: Building2,
            count: academiesCount,
            description: 'Registered centers, head coaches & sports facilities',
            keywords: ['clubs', 'centers', 'institutes', 'venues'],
          },
          {
            id: 'parents',
            label: 'Parents & Athletes',
            shortLabel: 'Parents',
            icon: Users,
            count: parentsCount,
            description: 'Guardians, student rosters & attendance links',
            keywords: ['students', 'children', 'guardians', 'kids', 'athletes'],
          },
          {
            id: 'growth',
            label: 'New Registrations',
            shortLabel: 'Growth',
            icon: TrendingUp,
            badge: getUnreadBadge('growth'),
            badgeColor: 'emerald',
            description: 'Athlete acquisition cohorts & monthly growth analytics',
            keywords: ['trends', 'cohorts', 'onboarding', 'metrics'],
          },
          {
            id: 'finance',
            label: 'Fee Transactions',
            shortLabel: 'Finance',
            icon: Wallet,
            badge: getUnreadBadge('finance'),
            badgeColor: 'rose',
            description: 'Easebuzz payment splits, fee receipts & settlements',
            keywords: ['money', 'payments', 'revenue', 'easebuzz', 'upi', 'receipts'],
          },
          {
            id: 'activity',
            label: 'Active & Passive Users',
            shortLabel: 'Activity',
            icon: Activity,
            description: 'Live attendance sessions & user engagement tracking',
            keywords: ['logs', 'engagement', 'sessions', 'active'],
          },
        ],
      },
      {
        id: 'messaging',
        label: 'Messaging & Comms',
        icon: MessageCircle,
        badge: unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : unreadMessages) : undefined,
        badgeColor: 'purple',
        tabs: [
          {
            id: 'whatsappinbox',
            label: 'WhatsApp Inbox',
            shortLabel: 'Inbox',
            icon: MessageCircle,
            description: '2-way live parent communication & Meta 24h care window',
            keywords: ['chat', 'conversations', 'reply', 'meta', 'customer care'],
          },
          {
            id: 'whatsapp',
            label: 'WhatsApp Templates',
            shortLabel: 'WA Templates',
            icon: MessageCircle,
            count: whatsappTemplateCount > 0 ? whatsappTemplateCount : undefined,
            description: 'Meta-approved broadcast templates & automated bot rules',
            keywords: ['canned', 'bot', 'meta templates', 'headers', 'footers'],
          },
          {
            id: 'pushtemplates',
            label: 'Push Templates',
            shortLabel: 'Push Alerts',
            icon: Bell,
            description: 'Mobile push notification templates & campaign presets',
            keywords: ['notifications', 'fcm', 'mobile alerts'],
          },
          {
            id: 'messagelogs',
            label: 'Message Logs',
            shortLabel: 'Logs',
            icon: Send,
            badge: getUnreadBadge('messagelogs'),
            badgeColor: 'purple',
            description: 'Platform delivery audit trail & broadcast history (7d volume)',
            keywords: ['delivery', 'audit', 'sent messages', 'broadcast logs'],
          },
          {
            id: 'paymentnotifications',
            label: 'Payment Alerts',
            shortLabel: 'Payment Alerts',
            icon: Receipt,
            description: 'Automated fee due reminders & WhatsApp payment links',
            keywords: ['reminders', 'fee collection', 'invoices'],
          },
          {
            id: 'bulkimport',
            label: 'Bulk Import Students',
            shortLabel: 'Bulk Import',
            icon: UploadCloud,
            description: 'Batch upload students from Excel/CSV directly into batches',
            keywords: ['csv', 'excel', 'roster', 'batch upload', 'spreadsheet'],
          },
        ],
      },
      {
        id: 'operations',
        label: 'Operations & Desk',
        icon: CalendarDays,
        badge: opsUnreadTotal > 0 ? opsUnreadTotal : undefined,
        badgeColor: unreadTickets > 0 || unreadDeletions > 0 ? 'rose' : 'orange',
        tabs: [
          {
            id: 'admissions',
            label: 'Admissions & Trials',
            shortLabel: 'Admissions',
            icon: MessageSquare,
            count: admissionsCount,
            badge: getUnreadBadge('admissions'),
            badgeColor: 'orange',
            description: 'Inbound trial requests from website & mobile apps',
            keywords: ['trials', 'leads', 'inquiries', 'prospects', 'demos'],
          },
          {
            id: 'tickets',
            label: 'Support Desk',
            shortLabel: 'Support',
            icon: HelpCircle,
            count: ticketsCount,
            badge: getUnreadBadge('tickets'),
            badgeColor: 'rose',
            description: 'Helpdesk requests & tutor ecosystem applications',
            keywords: ['help', 'issues', 'bugs', 'tutor applications', 'support'],
          },
          {
            id: 'events',
            label: 'Community Events',
            shortLabel: 'Events',
            icon: CalendarDays,
            count: communityEventsCount,
            badge: getUnreadBadge('events'),
            badgeColor: 'blue',
            description: 'Public tournaments, summer camps & private grading',
            keywords: ['tournaments', 'camps', 'competitions', 'grading', 'matches'],
          },
          {
            id: 'deletionrequests',
            label: 'Deletion Requests',
            shortLabel: 'Deletions',
            icon: UserX,
            badge: getUnreadBadge('deletionrequests'),
            badgeColor: 'rose',
            description: 'App Store / Play Store user account deletion queue',
            keywords: ['privacy', 'gdpr', 'remove account', 'compliance'],
          },
        ],
      },
      {
        id: 'platform',
        label: 'Platform & Security',
        icon: ShieldAlert,
        tabs: [
          {
            id: 'settings',
            label: 'Platform Settings',
            shortLabel: 'Settings',
            icon: Settings,
            description: 'Global system variables, maintenance mode & feature flags',
            keywords: ['configuration', 'flags', 'controls', 'options'],
          },
          {
            id: 'authregistry',
            label: 'Auth Registry',
            shortLabel: 'Auth Registry',
            icon: ShieldAlert,
            description: 'Admin accounts, RBAC roles & 2FA authentication registry',
            keywords: ['superadmin', 'admins', 'security', '2fa', 'permissions'],
          },
        ],
      },
    ];
  }, [
    rawBadges,
    seenCounts,
    activeTab,
    coachesCount,
    academiesCount,
    parentsCount,
    admissionsCount,
    ticketsCount,
    communityEventsCount,
    whatsappTemplateCount,
  ]);

  // Total unread notifications across all categories
  const totalUnreadBadges = useMemo(() => {
    let sum = 0;
    (Object.keys(rawBadges) as AdminTabId[]).forEach((tabId) => {
      const unread = getUnreadBadge(tabId);
      if (unread) sum += typeof unread === 'number' ? unread : 1;
    });
    return sum;
  }, [rawBadges, seenCounts, activeTab]);

  // Keyboard shortcut for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => paletteInputRef.current?.focus(), 50);
    } else {
      setPaletteSearch('');
    }
  }, [isCommandPaletteOpen]);

  const handleSelectTab = (tabId: AdminTabId) => {
    setActiveTab(tabId);
    // Instantly mark tab as seen
    const currentRaw = rawBadges[tabId] || 0;
    if (currentRaw > 0) {
      setSeenCounts((prev) => {
        const next = { ...prev, [tabId]: currentRaw };
        try {
          localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next));
        } catch (_) {}
        return next;
      });
    }
    // Record visited timestamp
    setVisitedTabs((prev) => {
      const next = { ...prev, [tabId]: Date.now() };
      try {
        localStorage.setItem(VISITED_TABS_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    if (onResetSearch) onResetSearch();
    setIsMobileOpen(false);
    setIsCommandPaletteOpen(false);
  };

  // Find active item metadata for top breadcrumb
  const currentItemInfo = useMemo(() => {
    for (const group of categoryGroups) {
      const found = group.tabs.find((t) => t.id === activeTab);
      if (found) {
        return { group, tab: found };
      }
    }
    return { group: categoryGroups[0], tab: categoryGroups[0].tabs[0] };
  }, [activeTab, categoryGroups]);

  // Filtered list for ⌘K
  const filteredPaletteTabs = useMemo(() => {
    const q = paletteSearch.trim().toLowerCase();
    const allTabs: { tab: TabItemConfig; category: CategoryGroup }[] = [];
    categoryGroups.forEach((cat) => {
      cat.tabs.forEach((tab) => {
        allTabs.push({ tab, category: cat });
      });
    });

    if (!q) return allTabs;

    return allTabs.filter(
      ({ tab, category }) =>
        tab.label.toLowerCase().includes(q) ||
        tab.description.toLowerCase().includes(q) ||
        category.label.toLowerCase().includes(q) ||
        tab.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [categoryGroups, paletteSearch]);

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0a0d17] text-white">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/[0.08]">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <img src="/logo.png" alt="TruCoach Logo" className="h-9 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold leading-none tracking-tight">
                <span className="text-blue-500">Tru</span>
                <span className="text-orange-500">Coach</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                Admin Console
              </span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400">
            <Sparkles className="h-2.5 w-2.5 animate-pulse" />
            Live DB
          </span>
        </div>

        {/* Quick Search Button */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="mt-3.5 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ink-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-ink-400" />
            <span>Search 19 sections...</span>
          </span>
          <kbd className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-ink-300">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Navigation Header with "Mark all seen" action */}
        <div className="flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-wider text-ink-500">
          <span>Sections</span>
          {totalUnreadBadges > 0 ? (
            <button
              onClick={handleClearAllBadges}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-orange-300 transition"
              title="Acknowledge and clear all notification badges"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Mark all seen ({totalUnreadBadges})</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400/80">
              <Check className="h-2.5 w-2.5" />
              <span>All caught up</span>
            </span>
          )}
        </div>
        {categoryGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.id} className="space-y-1">
              {/* Category Section Header */}
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                <span className="flex items-center gap-1.5">
                  <GroupIcon className="h-3 w-3 text-orange-400/80" />
                  <span>{group.label}</span>
                </span>
                {group.badge !== undefined && (
                  <span
                    className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1.5 text-[9px] font-black text-white shadow-sm ${
                      group.badgeColor === 'emerald'
                        ? 'bg-emerald-500 shadow-emerald-500/30'
                        : group.badgeColor === 'purple'
                        ? 'bg-indigo-500 shadow-indigo-500/30'
                        : group.badgeColor === 'blue'
                        ? 'bg-blue-500 shadow-blue-500/30'
                        : 'bg-orange-500 shadow-orange-500/30'
                    }`}
                  >
                    {group.badge}
                  </span>
                )}
              </div>

              {/* Navigation Items in Category */}
              <div className="space-y-0.5 pt-1">
                {group.tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const TabIcon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSelectTab(tab.id)}
                      className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 font-bold text-white shadow-md shadow-orange-500/25 ring-1 ring-white/20'
                          : 'text-ink-300 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TabIcon
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            isActive ? 'scale-110 text-white' : 'text-ink-400 group-hover:scale-110 group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{tab.label}</span>
                      </div>

                      {/* Badges / Counts / Visited Status */}
                      {tab.badge !== undefined ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-black shrink-0 ${
                            isActive
                              ? 'bg-white text-orange-600'
                              : tab.badgeColor === 'emerald'
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                              : tab.badgeColor === 'blue'
                              ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                              : tab.badgeColor === 'purple'
                              ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                              : tab.badgeColor === 'rose'
                              ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                              : 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      ) : (rawBadges[tab.id] || 0) > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold shrink-0 transition ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          }`}
                          title="Visited — notifications acknowledged"
                        >
                          <Check className="h-2.5 w-2.5" />
                          {tab.count !== undefined && tab.count > 0 ? (
                            <span>{tab.count}</span>
                          ) : (
                            <span>Seen</span>
                          )}
                        </span>
                      ) : tab.count !== undefined && tab.count > 0 ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-ink-400'
                          }`}
                        >
                          {tab.count}
                        </span>
                      ) : visitedTabs[tab.id] ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-emerald-400/40 shrink-0"
                          title="Visited in this session"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Profile & Actions */}
      <div className="border-t border-white/[0.08] p-3 space-y-2 bg-[#080b13]">
        {/* Admin Profile */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <div
            className={`grid h-8 w-8 place-items-center rounded-xl font-display text-xs font-bold text-white shadow-md shrink-0 ${
              adminUser?.isSuperAdmin
                ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 ring-2 ring-amber-400/40'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}
          >
            {adminUser?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold leading-none text-white truncate">
                {adminUser?.fullName}
              </p>
              {adminUser?.isSuperAdmin && (
                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-1 py-0.2 text-[8px] font-black uppercase text-amber-300 border border-amber-500/40">
                  👑
                </span>
              )}
            </div>
            <p className="text-[10px] text-ink-400 truncate mt-0.5">
              {adminUser?.email || adminUser?.phone}
            </p>
          </div>
        </div>

        {/* Sync Data & Logout Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-semibold text-ink-200 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={onSignOutClick}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#090c13] text-white">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col border-r border-white/[0.08] shadow-2xl">
        {SidebarContent}
      </aside>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="relative z-10 w-72 max-w-[85vw] border-r border-white/10 shadow-2xl"
            >
              {SidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Layout (Offset on Desktop by Sidebar Width) */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Floating App Bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#090c13]/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2 text-ink-300 hover:text-white"
              aria-label="Open sidebar navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Breadcrumb indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-ink-400 hidden sm:inline">{currentItemInfo.group.label}</span>
              <span className="text-ink-500 hidden sm:inline">/</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <currentItemInfo.tab.icon className="h-3.5 w-3.5 text-orange-400" />
                <span>{currentItemInfo.tab.label}</span>
              </span>
              {(rawBadges[activeTab] || 0) > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ml-2">
                  <Check className="h-3 w-3" />
                  <span>Up to date</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Right Utilities in Top Bar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-ink-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              <Search className="h-3.5 w-3.5 text-ink-400" />
              <span className="hidden sm:inline text-ink-400">Quick Jump</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.2 font-mono text-[9px] text-ink-300">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-ink-200 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
              <span className="hidden md:inline">Sync Data</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">{children}</div>
      </div>

      {/* Command Palette Modal (⌘K) */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-16 sm:pt-24 backdrop-blur-md"
            onClick={() => setIsCommandPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#0e121d] shadow-2xl"
            >
              <div className="relative flex items-center border-b border-white/10 px-5 py-4">
                <Search className="h-5 w-5 text-orange-400 mr-3 shrink-0" />
                <input
                  ref={paletteInputRef}
                  type="text"
                  value={paletteSearch}
                  onChange={(e) => setPaletteSearch(e.target.value)}
                  placeholder="Jump to any section... (coaches, fees, whatsapp, tickets, admissions)"
                  className="w-full bg-transparent text-sm text-white placeholder-ink-400 outline-none"
                />
                {paletteSearch && (
                  <button onClick={() => setPaletteSearch('')} className="p-1 text-ink-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="ml-3 hidden sm:inline-block rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-ink-400">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
                {filteredPaletteTabs.length === 0 ? (
                  <div className="py-12 text-center text-ink-400">
                    <Search className="mx-auto h-8 w-8 text-ink-500 mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-white">No matching admin sections</p>
                    <p className="text-xs text-ink-400 mt-1">Try searching "coaches", "fees", or "tickets".</p>
                  </div>
                ) : (
                  categoryGroups.map((group) => {
                    const matching = filteredPaletteTabs.filter((m) => m.category.id === group.id);
                    if (matching.length === 0) return null;

                    return (
                      <div key={group.id} className="space-y-1">
                        <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
                          <group.icon className="h-3 w-3 text-orange-400" />
                          <span>{group.label}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {matching.map(({ tab }) => {
                            const isCurrent = activeTab === tab.id;
                            const TabIcon = tab.icon;

                            return (
                              <button
                                key={tab.id}
                                onClick={() => handleSelectTab(tab.id)}
                                className={`flex items-start gap-3 rounded-2xl p-3 text-left transition-all ${
                                  isCurrent
                                    ? 'border border-orange-500/40 bg-orange-500/15 text-white ring-1 ring-orange-500/20'
                                    : 'border border-white/5 bg-white/[0.02] text-ink-200 hover:border-white/15 hover:bg-white/[0.06] hover:text-white'
                                }`}
                              >
                                <div
                                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                                    isCurrent ? 'bg-orange-500 text-white' : 'bg-white/[0.06] text-ink-300'
                                  }`}
                                >
                                  <TabIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold truncate">{tab.label}</span>
                                    {tab.badge !== undefined ? (
                                      <span
                                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-black text-white ${
                                          tab.badgeColor === 'emerald'
                                            ? 'bg-emerald-500'
                                            : tab.badgeColor === 'blue'
                                            ? 'bg-blue-500'
                                            : tab.badgeColor === 'purple'
                                            ? 'bg-indigo-500'
                                            : tab.badgeColor === 'rose'
                                            ? 'bg-rose-500'
                                            : 'bg-orange-500'
                                        }`}
                                      >
                                        {tab.badge}
                                      </span>
                                    ) : (rawBadges[tab.id] || 0) > 0 ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                                        <Check className="h-2.5 w-2.5" />
                                        Seen
                                      </span>
                                    ) : tab.count !== undefined && tab.count > 0 ? (
                                      <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-medium text-ink-300">
                                        {tab.count}
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-[11px] text-ink-400 truncate mt-0.5">
                                    {tab.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
