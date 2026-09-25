"use client";

import Image from "next/image";
import { useState } from "react";
import { WorkspaceTools } from "./webmcp";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { DateTime } from "luxon";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Image as ImageIcon,
  BarChart3,
  Activity,
  Layers3,
  Settings2,
  Plus,
  ChevronDown,
  ArrowUpRight,
  Play,
  Pause,
  Sparkles,
  Menu,
  X,
  Clock3,
  Check,
  CircleHelp,
  ArrowRight,
  Radio,
  Search,
} from "lucide-react";
import { useData } from "./data-provider";
import { Status, Empty, useFeedback } from "./ui";
import { Editor, GenerateModal } from "./editor";
import { CalendarView, MediaView, AnalyticsView } from "./views";
import { SettingsView, BrandsView } from "./settings";
import { interactions, latestMetrics } from "@/lib/analytics/aggregate";
import type { Post } from "@/lib/domain";

const navigation = [
  ["/", "Dashboard", LayoutDashboard],
  ["/content", "Content", FileText],
  ["/calendar", "Calendar", CalendarDays],
  ["/media", "Media", ImageIcon],
  ["/analytics", "Analytics", BarChart3],
  ["/activity", "AI Activity", Activity],
  ["/brands", "Brands", Layers3],
  ["/settings", "Settings", Settings2],
] as const;

const number = (n: number) =>
  new Intl.NumberFormat("en", {
    notation: n > 9999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);

export function QuantiveApp() {
  const ctx = useData();
  const pathname = usePathname();

  const [mobile, setMobile] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [initialAsset, setInitialAsset] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);

  const workspace = ctx.data.workspaces.find((w) => w.id === ctx.workspaceId);
  const posts = ctx.data.posts.filter((p) => p.workspaceId === ctx.workspaceId);

  const { run, busy, feedback } = useFeedback();

  const title =
    navigation.find((n) => n[0] !== "/" && pathname.startsWith(n[0]))?.[1] ?? "Dashboard";
  const zone = workspace?.config.brain.timezone ?? "Asia/Jakarta";
  const editedPost = posts.find((p) => p.id === editId);

  const open = (id: string) => {
    setInitialAsset(undefined);
    setEditId(id);
  };
  const newPost = (asset?: string) => {
    setInitialAsset(asset);
    setEditId("new");
  };

  return (
    <div className="app-shell">
      <WorkspaceTools onOpen={open} />

      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <Link href="/" className="brand-lockup" onClick={() => setMobile(false)}>
          <Image
            src="/quantive-logo.png"
            alt="Logo Quantive"
            width={36}
            height={36}
            style={{ objectFit: "contain", flexShrink: 0 }}
            priority
          />
          <span className="wordmark">
            QUANTIVE
            <small>CONTENT AUTOPILOT</small>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setMobile(false)}
          aria-label="Tutup menu"
        >
          <X size={20} />
        </button>

        <div className="workspace-switch">
          <span className="workspace-icon">{workspace?.name.slice(0, 1) ?? "Q"}</span>
          <div>
            <small>WORKSPACE</small>
            <select
              aria-label="Pilih brand"
              value={ctx.workspaceId}
              onChange={(e) => ctx.selectWorkspace(e.target.value)}
            >
              {ctx.data.workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown size={14} />
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={
                (href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "active" : ""
              }
              onClick={() => setMobile(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {href === "/content" &&
                posts.filter((p) => p.status === "awaiting_approval").length > 0 && (
                  <span className="nav-count">
                    {posts.filter((p) => p.status === "awaiting_approval").length}
                  </span>
                )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-note">
            <Radio size={15} />
            <span>{ctx.mode === "demo" ? "Demo workspace" : "Convex connected"}</span>
          </div>
          <Link className="help-link" href="/settings/integrations">
            <CircleHelp size={17} />Setup & connections<ArrowUpRight size={14} />
          </Link>
          <div className="sidebar-user">
            {ctx.mode === "live" ? <UserButton /> : <span className="user-avatar">DS</span>}
            <div>
              <strong>{ctx.mode === "demo" ? "Dimas Seto" : "Your account"}</strong>
              <small>{ctx.mode === "demo" ? "Demo session" : "Workspace owner"}</small>
            </div>
            <span className="tiny-label">MVP</span>
          </div>
        </div>
      </aside>

      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Tutup menu"
          onClick={() => setMobile(false)}
        />
      )}

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Buka menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="muted">Workspace</span>
            <span className="slash">/</span>
            <b>{title}</b>
          </div>
          <div className="topbar-right">
            <span className="timezone">
              <Clock3 size={14} />
              {zone}
            </span>
            <span className={`mode-label ${ctx.mode}`}>
              {ctx.mode === "demo" ? "DEMO MODE" : "LIVE"}
            </span>
          </div>
        </header>

        {ctx.mode === "demo" && (
          <div className="demo-banner">
            <span>
              <b>Preview workspace.</b> Data contoh, teks lokal, dan simulasi posting. Tidak
              terhubung ke X atau provider AI.
            </span>
            <Link href="/settings/integrations">
              Set up live mode <ArrowUpRight size={13} />
            </Link>
          </div>
        )}

        <main className="main-content">
          {ctx.loading ? (
            <div className="loading-page">
              <div className="loading-bar" />
              <h2>Loading your workspace…</h2>
            </div>
          ) : !workspace ? (
            <BrandsView />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    {title === "Dashboard" ? "YOUR CONTENT OPERATIONS" : workspace.name}
                  </div>
                  <h1>
                    {title === "Dashboard"
                      ? "A clear view of what's next."
                      : title === "Content"
                      ? "From idea to published."
                      : title === "Calendar"
                      ? "Your content, in rhythm."
                      : title === "Media"
                      ? "Your visual library."
                      : title === "Analytics"
                      ? "Learn from what works."
                      : title === "AI Activity"
                      ? "Every step, in view."
                      : title === "Brands"
                      ? "One workspace. Every brand."
                      : "Make it yours."}
                  </h1>
                  {title === "Dashboard" && (
                    <p>
                      {DateTime.now().setZone(zone).toFormat("cccc, d LLLL yyyy")}{" "}
                      <span className="dot-separator">·</span> {workspace.name}
                    </p>
                  )}
                </div>
                {!["Settings", "Brands"].includes(title) && (
                  <div className="heading-actions">
                    <button className="button" onClick={() => newPost()}>
                      <Plus size={16} />
                      New post
                    </button>
                    <button className="button primary" onClick={() => setGenerating(true)}>
                      <Sparkles size={16} />
                      Create with AI
                    </button>
                  </div>
                )}
              </div>

              {pathname === "/" ? (
                <Dashboard onEdit={open} onGenerate={() => setGenerating(true)} />
              ) : pathname === "/content" ? (
                <ContentList onEdit={open} />
              ) : pathname === "/calendar" ? (
                <CalendarView onEdit={open} />
              ) : pathname === "/media" ? (
                <MediaView onCompose={newPost} />
              ) : pathname === "/analytics" ? (
                <AnalyticsView />
              ) : pathname === "/activity" ? (
                <ActivityView />
              ) : pathname === "/brands" ? (
                <BrandsView />
              ) : pathname.startsWith("/settings") ? (
                <SettingsView key={`${ctx.workspaceId}:${pathname}`} />
              ) : (
                <Empty
                  title="Halaman tidak ditemukan"
                  action={
                    <Link className="button" href="/">
                      Back to dashboard
                    </Link>
                  }
                />
              )}
            </>
          )}
          {feedback}
        </main>

        <footer className="app-footer">
          <span>
            QUANTIVE <span className="muted">/ Content Autopilot</span>
          </span>
          <span>
            {ctx.mode === "demo" ? "Local demo · no external publishing" : "Your brand. Your direction."}
          </span>
          {ctx.mode === "demo" && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const { demoStore } = await import("@/lib/demo-store");
                  if (window.confirm("Reset seluruh data demo di browser ini?")) demoStore.reset();
                })
              }
            >
              Reset demo
            </button>
          )}
        </footer>
      </div>

      {generating && workspace && (
        <GenerateModal
          onClose={() => setGenerating(false)}
          onGenerated={(id) => {
            setGenerating(false);
            open(id);
          }}
        />
      )}
      {editId && workspace && (
        <Editor
          key={`${ctx.workspaceId}:${editId}:${editedPost?.revision}:${editedPost?.status}`}
          post={editedPost}
          initialAssetId={initialAsset}
          onClose={() => setEditId(null)}
          onSaved={setEditId}
        />
      )}
    </div>
  );
}

function Dashboard({
  onEdit,
  onGenerate,
}: {
  onEdit(id: string): void;
  onGenerate(): void;
}) {
  const ctx = useData();
  const workspace = ctx.data.workspaces.find((w) => w.id === ctx.workspaceId)!;
  const posts = ctx.data.posts.filter(
    (p) => p.workspaceId === ctx.workspaceId && p.status !== "rejected"
  );
  const metrics = latestMetrics(
    ctx.data.metrics.filter((m) => m.workspaceId === ctx.workspaceId)
  );

  const awaiting = posts.filter((p) => p.status === "awaiting_approval");
  const next = posts
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0))[0];

  const config = workspace.config;
  const { busy, run, feedback } = useFeedback();

  const today = DateTime.now().setZone(config.brain.timezone).toISODate();
  const todayPosts = posts.filter(
    (p) =>
      DateTime.fromMillis(p.publishedAt ?? p.scheduledAt ?? p.createdAt, {
        zone: config.brain.timezone,
      }).toISODate() === today
  );

  const published = posts.filter((p) => p.status === "published");
  const totalImpressions = metrics.reduce((n, m) => n + (m.impressions ?? 0), 0);
  const totalInteractions = metrics.reduce((n, m) => n + interactions(m), 0);
  const completeImpressions =
    metrics.length > 0 && metrics.every((m) => m.impressions !== undefined);
  const completedPublishAttempts =
    published.length +
    posts.filter(
      (p) => ["failed", "uncertain"].includes(p.status) && p.lastRetry !== undefined
    ).length;

  const activity = ctx.data.activity.filter((a) => a.workspaceId === ctx.workspaceId);

  return (
    <>
      <section className="overview-grid">
        <div className="autopilot-panel">
          <div className="autopilot-top">
            <span className="eyebrow">AI CONTENT MANAGER</span>
            <span className={`pilot-state ${config.autopilot.active ? "active" : ""}`}>
              <i />
              {config.autopilot.active
                ? ctx.mode === "demo"
                  ? "DEMO ACTIVE"
                  : "ACTIVE"
                : "PAUSED"}
            </span>
          </div>
          <h2>
            Your brand.
            <br />
            Always moving forward.
          </h2>
          <p>
            {config.autopilot.mode === "draft"
              ? "Draft Only. Konten berhenti di draft."
              : config.autopilot.mode === "approval"
              ? "Approval Required. Kamu tetap memegang keputusan akhir."
              : "Full Autopilot. Konten yang lolos review dipublikasikan sesuai jadwal."}
          </p>
          <div className="pipeline">
            {["Plan", "Write", "Review", "Publish"].map((step, i) => (
              <span key={step}>
                <i>{i + 1}</i>
                {step}
                {i < 3 && <span className="pipeline-line" />}
              </span>
            ))}
          </div>
          <div className="pilot-bottom">
            <button
              className="button gold-button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => ctx.toggle(!config.autopilot.active),
                  config.autopilot.active
                    ? "Autopilot dijeda."
                    : ctx.mode === "demo"
                    ? "Status demo diaktifkan. Tidak ada pekerjaan eksternal dijalankan."
                    : "Autopilot aktif. Server menyiapkan kalender."
                )
              }
            >
              {config.autopilot.active ? (
                <Pause size={15} />
              ) : (
                <Play size={15} fill="currentColor" />
              )}
              {config.autopilot.active ? "Pause autopilot" : "Start autopilot"}
            </button>
            <Link href="/settings/autopilot">
              Configure <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div className="today-panel panel">
          <div className="section-title">
            <h3>On the agenda</h3>
            <span className="muted small">TODAY</span>
          </div>
          <div className="today-count">
            <b>{todayPosts.length.toString().padStart(2, "0")}</b>
            <span>
              posts planned
              <br />
              <small>
                {todayPosts.filter((p) => p.status === "published").length} published ·{" "}
                {todayPosts.filter((p) => p.status === "scheduled").length} scheduled
              </small>
            </span>
          </div>
          <div className="next-post">
            <span className="eyebrow">NEXT IN LINE</span>
            {next ? (
              <button onClick={() => onEdit(next.id)}>
                <strong>
                  {DateTime.fromMillis(next.scheduledAt!, {
                    zone: config.brain.timezone,
                  }).toFormat("HH:mm")}
                  <small>
                    {DateTime.fromMillis(next.scheduledAt!, {
                      zone: config.brain.timezone,
                    }).toFormat("dd LLL")}
                  </small>
                </strong>
                <span>{next.topic}</span>
                <ArrowUpRight size={18} />
              </button>
            ) : (
              <p className="muted">Belum ada posting terjadwal.</p>
            )}
          </div>
          <Link href="/calendar" className="text-button">
            Open calendar <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {feedback}

      <section className="metric-strip">
        {[
          {
            label: "Posts published",
            value: number(published.length),
            detail: `${posts.filter((p) => p.status === "scheduled").length} in the queue`,
            icon: FileText,
          },
          {
            label: "Impressions",
            value: completeImpressions ? number(totalImpressions) : "—",
            detail: ctx.mode === "demo" ? "Illustrative demo data" : "Latest available X metrics",
            icon: BarChart3,
          },
          {
            label: "Engagement rate",
            value:
              completeImpressions && totalImpressions
                ? `${(totalInteractions / totalImpressions * 100).toFixed(2)}%`
                : "—",
            detail: "Interactions / impressions",
            icon: Activity,
          },
          {
            label: "Publishing success",
            value: completedPublishAttempts
              ? `${Math.round(published.length / completedPublishAttempts * 100)}%`
              : "—",
            detail: ctx.mode === "demo" ? "Simulated post status" : "Published / attempted posts",
            icon: Check,
          },
        ].map((m) => (
          <div className="metric" key={m.label}>
            <div>
              <span>{m.label}</span>
              <m.icon size={17} />
            </div>
            <strong>{m.value}</strong>
            <small>{m.detail}</small>
          </div>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="panel performance-panel">
          <div className="section-title">
            <div>
              <h3>Content performance</h3>
              <p className="muted small">
                Impressions by publishing day · latest totals
                {ctx.mode === "demo" ? " · demo" : ""}
              </p>
            </div>
            <Link href="/analytics" className="icon-button" aria-label="Lihat analytics">
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <TrendChart posts={posts} metrics={metrics} zone={config.brain.timezone} />
          <div className="chart-footer">
            <span>
              <i />
              Impressions
            </span>
            <span>Last 7 days</span>
          </div>
        </div>

        <div className="panel approval-panel">
          <div className="section-title">
            <h3>Needs your approval</h3>
            <span className="count-chip">{awaiting.length}</span>
          </div>
          {awaiting.length ? (
            <div className="approval-list">
              {awaiting.slice(0, 3).map((post) => (
                <button key={post.id} onClick={() => onEdit(post.id)}>
                  <div>
                    <span className="category">{post.category}</span>
                    <span className="quality-label">{post.review?.score ?? "—"}/10</span>
                  </div>
                  <h4>{post.topic}</h4>
                  <p>{post.parts[0]}</p>
                  <span className="review-link">
                    Review content <ArrowRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title="All caught up"
              action={
                <button className="text-button" onClick={onGenerate}>
                  Create your next post <ArrowRight size={14} />
                </button>
              }
            />
          )}
        </div>
      </section>

      <section className="dashboard-grid bottom-grid">
        <div className="panel">
          <div className="section-title">
            <h3>Content mix</h3>
            <Link href="/settings/content-mix" className="text-button">
              Adjust <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="mix-bar">
            {config.categories.map((c, i) => (
              <div
                key={c.name}
                style={{
                  width: `${c.percent}%`,
                  background: ["#204d88", "#5882ad", "#8da8c3", "#d0b57e", "#dddfe3"][i % 5],
                }}
                title={`${c.name} ${c.percent}%`}
              />
            ))}
          </div>
          <div className="mix-legend">
            {config.categories.map((c, i) => (
              <div key={c.name}>
                <i
                  style={{
                    background: ["#204d88", "#5882ad", "#8da8c3", "#d0b57e", "#dddfe3"][i % 5],
                  }}
                />
                <span>{c.name}</span>
                <b>{c.percent}%</b>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title">
            <h3>Recent activity</h3>
            <Link href="/activity" className="text-button">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="activity-mini">
            {activity.slice(0, 4).map((a) => (
              <div key={a.id}>
                <span className={`log-indicator ${a.level}`} />
                <p>
                  {a.message}
                  <small>
                    {DateTime.fromMillis(a.at, { zone: config.brain.timezone }).toFormat("HH:mm")}{" "}
                    · {a.stage}
                  </small>
                </p>
              </div>
            ))}
            {!activity.length && (
              <p className="muted">Aktivitas akan muncul setelah kamu mulai bekerja.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export function TrendChart({
  posts,
  metrics,
  zone,
}: {
  posts: Post[];
  metrics: ReturnType<typeof latestMetrics>;
  zone: string;
}) {
  const dates = Array.from({ length: 7 }, (_, i) =>
    DateTime.now().setZone(zone).minus({ days: 6 - i })
  );

  if (!metrics.length || metrics.some((m) => m.impressions === undefined)) {
    return (
      <Empty title="Impressions belum lengkap">
        Grafik tersedia setelah X mengembalikan impressions untuk semua konten yang dilacak.
      </Empty>
    );
  }

  const values = dates.map((date) =>
    posts
      .filter(
        (p) =>
          p.publishedAt &&
          DateTime.fromMillis(p.publishedAt, { zone }).toISODate() === date.toISODate()
      )
      .reduce((sum, p) => sum + (metrics.find((m) => m.postId === p.id)?.impressions ?? 0), 0)
  );

  const max = Math.max(100, ...values);
  const height = 158;
  const points = values.map((value, i) => `${48 + i * 79},${height - value / max * 125}`);

  return (
    <div className="trend">
      <svg
        viewBox="0 0 560 205"
        role="img"
        aria-label={`Impressions 7 hari: ${dates
          .map((d, i) => `${d.toFormat("dd LLL")} ${values[i]}`)
          .join(", ")}`}
      >
        {[0, 0.5, 1].map((x) => (
          <g key={x}>
            <line
              x1="48"
              y1={height - x * 125}
              x2="525"
              y2={height - x * 125}
              stroke="#e8edf1"
              strokeDasharray="4 5"
            />
            <text x="1" y={height - x * 125 + 4} fill="#87919e" fontSize="12">
              {number(Math.round(max * x))}
            </text>
          </g>
        ))}
        <path d={`M48,${height} L${points.join(" L")} L522,${height} Z`} fill="#eff4fa" />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#2a5e9b"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {values.map((_, i) => (
          <circle
            key={i}
            cx={48 + i * 79}
            cy={height - values[i] / max * 125}
            r="3.2"
            fill="#2a5e9b"
            stroke="white"
            strokeWidth="2"
          />
        ))}
        {dates.map((d, i) => (
          <text key={i} x={48 + i * 79} y="193" textAnchor="middle" fill="#87919e" fontSize="12">
            {d.toFormat("dd LLL")}
          </text>
        ))}
      </svg>
    </div>
  );
}

function ContentList({ onEdit }: { onEdit(id: string): void }) {
  const ctx = useData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const posts = ctx.data.posts.filter(
    (p) =>
      p.workspaceId === ctx.workspaceId &&
      (filter === "all" ? p.status !== "rejected" : p.status === filter) &&
      `${p.topic} ${p.parts.join(" ")}`.toLowerCase().includes(query.toLowerCase())
  );
  const zone = ctx.data.workspaces.find((w) => w.id === ctx.workspaceId)!.config.brain.timezone;

  return (
    <section className="panel content-panel">
      <div className="table-toolbar">
        <div className="filter-tabs">
          {[
            ["all", "All content"],
            ["awaiting_approval", "To approve"],
            ["draft", "Drafts"],
            ["scheduled", "Scheduled"],
            ["published", "Published"],
            ["failed", "Failed"],
            ["uncertain", "Check on X"],
            ["rejected", "Archived"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-input">
          <Search size={15} />
          <input
            aria-label="Cari konten"
            placeholder="Search content…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {posts.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Content</th>
                <th>Category</th>
                <th>Status</th>
                <th>Scheduled for</th>
                <th>Review</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <button className="content-title" onClick={() => onEdit(p.id)}>
                      <span>{p.format === "thread" ? "THREAD" : "POST"}</span>
                      <b>{p.topic}</b>
                      <small>{p.parts[0] || "Konten sedang diproses…"}</small>
                    </button>
                  </td>
                  <td>
                    <span className="category">{p.category}</span>
                  </td>
                  <td>
                    <Status status={p.status} />
                  </td>
                  <td>
                    {p.scheduledAt ? (
                      <>
                        <span>
                          {DateTime.fromMillis(p.scheduledAt, { zone }).toFormat("dd LLL yyyy")}
                        </span>
                        <small className="table-meta">
                          {DateTime.fromMillis(p.scheduledAt, { zone }).toFormat("HH:mm")}
                        </small>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {p.review ? (
                      <span className={p.review.approved ? "good" : "danger"}>
                        {p.review.score}/10
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={() => onEdit(p.id)}
                      aria-label={`Edit ${p.topic}`}
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No content here yet">Coba filter lain atau buat posting baru.</Empty>
      )}
    </section>
  );
}

function ActivityView() {
  const ctx = useData();
  const [level, setLevel] = useState("all");

  const activity = ctx.data.activity.filter(
    (a) => a.workspaceId === ctx.workspaceId && (level === "all" || a.level === level)
  );
  const zone = ctx.data.workspaces.find((w) => w.id === ctx.workspaceId)!.config.brain.timezone;

  return (
    <section className="panel">
      <div className="section-title">
        <h3>Activity log</h3>
        <select
          aria-label="Filter log"
          className="compact-select"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="all">All activity</option>
          <option value="error">Errors</option>
          <option value="success">Completed</option>
          <option value="info">In progress</option>
        </select>
      </div>
      {activity.length ? (
        <div className="log-list">
          {activity.map((a) => (
            <div key={a.id}>
              <time>{DateTime.fromMillis(a.at, { zone }).toFormat("dd LLL · HH:mm:ss")}</time>
              <span className={`log-indicator ${a.level}`} />
              <div>
                <span className="eyebrow">{a.stage}</span>
                <p>{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="No activity to show">
          Log akan mencatat aktivitas dan error yang benar-benar terjadi.
        </Empty>
      )}
    </section>
  );
}
