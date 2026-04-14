"use client";

import { useState, useEffect } from "react";
import {
  PHASES,
  DKEYS,
  PLAN_START,
  curWeekNum,
  raceDays,
  getWeekDates,
  fmtDate,
  fmtPace,
  fmtDur,
  toMi,
  actForDate,
  DayKey,
  WeekData,
  StravaAthlete,
  StravaActivity,
  ManualRun,
  RunEntry,
} from "../data/plan";

type TabType = "dashboard" | "plan" | "strava" | "log";

export default function MarathonPlan() {
  const [tab, setTab] = useState<TabType>("dashboard");
  const [phIdx, setPhIdx] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  
  // Strava state
  const [token, setToken] = useState("");
  const [tInput, setTInput] = useState("");
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [acts, setActs] = useState<StravaActivity[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [serr, setSErr] = useState("");
  const [showI, setShowI] = useState(false);
  
  // Manual run state
  const [manual, setManual] = useState<ManualRun[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: fmtDate(new Date()), dist: "", dur: "", notes: "" });

  // Load state from localStorage
  useEffect(() => {
    const savedChecked = localStorage.getItem("marathon-checked");
    const savedToken = localStorage.getItem("marathon-token");
    const savedAthlete = localStorage.getItem("marathon-athlete");
    const savedActs = localStorage.getItem("marathon-acts");
    const savedManual = localStorage.getItem("marathon-manual");
    
    if (savedChecked) {
      try {
        const parsed = JSON.parse(savedChecked);
        setTimeout(() => setChecked(parsed), 0);
      } catch { /* ignore */ }
    }
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedAthlete) {
      try {
        setAthlete(JSON.parse(savedAthlete));
      } catch { /* ignore */ }
    }
    if (savedActs) {
      try {
        setActs(JSON.parse(savedActs));
      } catch { /* ignore */ }
    }
    if (savedManual) {
      try {
        setManual(JSON.parse(savedManual));
      } catch { /* ignore */ }
    }
  }, []);

  // Save checked state
  useEffect(() => {
    localStorage.setItem("marathon-checked", JSON.stringify(checked));
  }, [checked]);

  // Auto-mark workouts complete based on Strava runs
  useEffect(() => {
    if (!acts.length) return;
    setChecked((prev) => {
      const next = { ...prev };
      PHASES.forEach((ph) =>
        ph.weeks.forEach((w) => {
          DKEYS.forEach((d) => {
            const dt = getWeekDates(w.n);
            const ds = dt[d] ? fmtDate(dt[d]) : null;
            if (!ds) return;
            const found = acts.find(
              (a) =>
                (a.type === "Run" || a.sport_type === "Run") &&
                a.start_date_local?.startsWith(ds)
            );
            if (found) next[`${w.n}-${d}`] = true;
          });
        })
      );
      return next;
    });
  }, [acts]);

  const toggle = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Strava functions
  const connectStrava = async () => {
    if (!tInput.trim()) return;
    setSyncing(true);
    setSErr("");
    const tk = tInput.trim();
    try {
      const ar = await fetch("https://www.strava.com/api/v3/athlete", {
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (!ar.ok) throw new Error(`Strava error ${ar.status} — check your token`);
      const ath = await ar.json();
      const since = Math.floor(PLAN_START.getTime() / 1000);
      const acr = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=200&after=${since}`,
        { headers: { Authorization: `Bearer ${tk}` } }
      );
      const raw = await acr.json();
      const runs = Array.isArray(raw) ? raw : [];
      setToken(tk);
      setAthlete(ath);
      setActs(runs);
      setTInput("");
      localStorage.setItem("marathon-token", tk);
      localStorage.setItem("marathon-athlete", JSON.stringify(ath));
      localStorage.setItem("marathon-acts", JSON.stringify(runs));
    } catch (e: unknown) {
      setSErr(e instanceof Error ? e.message : "Unknown error");
    }
    setSyncing(false);
  };

  const syncStrava = async () => {
    if (!token) return;
    setSyncing(true);
    setSErr("");
    try {
      const since = Math.floor(PLAN_START.getTime() / 1000);
      const r = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=200&after=${since}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const raw = await r.json();
      const runs = Array.isArray(raw) ? raw : [];
      setActs(runs);
      localStorage.setItem("marathon-acts", JSON.stringify(runs));
    } catch {
      setSErr("Sync failed — token may have expired");
    }
    setSyncing(false);
  };

  const disconnect = () => {
    setToken("");
    setAthlete(null);
    setActs([]);
    localStorage.removeItem("marathon-token");
    localStorage.removeItem("marathon-athlete");
    localStorage.removeItem("marathon-acts");
  };

  // Manual run functions
  const addRun = () => {
    if (!form.date || !form.dist) return;
    const run: ManualRun = {
      ...form,
      id: Date.now(),
      source: "manual",
      dist: parseFloat(form.dist),
    };
    const next = [run, ...manual];
    setManual(next);
    setForm({ date: fmtDate(new Date()), dist: "", dur: "", notes: "" });
    setShowForm(false);
    localStorage.setItem("marathon-manual", JSON.stringify(next));
  };

  const delManual = (id: number) => {
    const next = manual.filter((r) => r.id !== id);
    setManual(next);
    localStorage.setItem("marathon-manual", JSON.stringify(next));
  };

  // Computed values
  const CW = curWeekNum();
  const RD = raceDays();
  const cPhase = PHASES.find((p) => p.weeks.some((w) => w.n === CW)) || PHASES[0];
  const cWkData = PHASES.flatMap((p) => p.weeks).find((w) => w.n === CW);
  const cwDates = getWeekDates(CW);
  const phase = PHASES[phIdx];
  const allKeys = PHASES.flatMap((p) =>
    p.weeks.flatMap((w) => DKEYS.map((d) => `${w.n}-${d}`))
  );
  const done = allKeys.filter((k) => checked[k]).length;
  const pct = Math.round((done / allKeys.length) * 100);
  const cwDays = cWkData?.race ? ["sat" as DayKey] : [...DKEYS];
  const cwDone = cwDays.filter((d) => checked[`${CW}-${d}`]).length;

  // Strava stats
  const sRuns = acts.filter((a) => a.type === "Run" || a.sport_type === "Run");
  const sMiles = sRuns.reduce((s, a) => s + toMi(a.distance || 0), 0);

  // Run log
  const sLog: RunEntry[] = sRuns
    .map((a) => ({
      id: a.id,
      source: "strava" as const,
      date: a.start_date_local?.split("T")[0] || "",
      dist: toMi(a.distance || 0),
      dur: fmtDur(a.moving_time),
      pace: fmtPace(a.average_speed),
      name: a.name,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
  
  const allRuns: RunEntry[] = [
    ...sLog,
    ...manual.map((r) => ({ ...r, pace: "—", name: r.notes })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Helper functions
  const wc = (w: string) => {
    if (!w) return "text-gray-600";
    if (w.includes("🏁")) return "text-blue-400";
    if (w.includes("tempo")) return "text-yellow-400";
    if (w === "Rest") return "text-gray-700";
    return "text-gray-500";
  };

  const dayLabel = (d: DayKey) => d.toUpperCase();

  const navTabs = [
    { id: "dashboard" as TabType, lb: "DASHBOARD" },
    { id: "plan" as TabType, lb: "PLAN" },
    { id: "strava" as TabType, lb: athlete ? "✓ STRAVA" : "STRAVA", sp: athlete ? "#4ade80" : undefined },
    { id: "log" as TabType, lb: `LOG${allRuns.length ? ` (${allRuns.length})` : ""}` },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans">
      {/* Navigation */}
      <nav className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-wide text-white">ROAD TO 26.2</span>
          {athlete && (
            <span className="text-xs text-green-400 flex items-center gap-2">
              {athlete.profile_medium && (
                <img
                  src={athlete.profile_medium}
                  alt=""
                  className="w-5 h-5 rounded-full border border-green-400"
                />
              )}
              {athlete.firstname} {athlete.lastname}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {navTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 text-xs font-bold tracking-widest rounded transition-colors ${
                tab === t.id
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "bg-transparent hover:text-zinc-300"
              }`}
              style={tab !== t.id && t.sp ? { color: t.sp } : undefined}
            >
              {t.lb}
            </button>
          ))}
        </div>
        <div className="text-right">
          <div className="text-xs tracking-widest text-zinc-500 uppercase">Nov 7 Race</div>
          <div className="text-2xl font-black text-orange-500">{RD}d</div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-6 pb-16">
        {/* Dashboard Tab */}
        {tab === "dashboard" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { lb: "DAYS TO RACE", v: RD, sub: "Nov 7, 2026", c: "text-orange-500" },
                { lb: "CURRENT WEEK", v: `WK ${CW}`, sub: cPhase.label, c: "text-green-400" },
                { lb: "PLAN PROGRESS", v: `${pct}%`, sub: `${done}/${allKeys.length} workouts`, c: "text-purple-400" },
                athlete
                  ? { lb: "STRAVA MILES", v: `${sMiles.toFixed(0)} mi`, sub: `${sRuns.length} runs`, c: "text-orange-400" }
                  : { lb: "STRAVA", v: "Not linked", sub: "Connect in Strava tab", c: "text-zinc-500" },
              ].map((s, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
                  <div className="text-xs tracking-widest text-zinc-500 uppercase mb-2">{s.lb}</div>
                  <div className={`text-3xl font-black ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-zinc-600 mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs tracking-widest text-zinc-500 uppercase">Overall Plan Completion</span>
                <span className="text-lg font-bold text-purple-400">{pct}%</span>
              </div>
              <div className="bg-zinc-800 rounded-full h-2">
                <div
                  className="h-full bg-linear-to-r from-purple-700 to-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex mt-2">
                {PHASES.map((p) => (
                  <div
                    key={p.id}
                    className="text-center text-xs tracking-wide"
                    style={{ flex: p.weeks.length }}
                  >
                    <span style={{ color: p.id === cPhase.id ? p.accent : "#27272a" }}>
                      {p.label.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* This Week */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs tracking-widest uppercase mb-1" style={{ color: cPhase.accent }}>
                    {cPhase.label} · {cPhase.range}
                  </div>
                  <h2 className="text-2xl font-black text-white">THIS WEEK — WK {CW}</h2>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: cPhase.accent }}>
                    {cwDone}/{cwDays.length}
                  </div>
                  <div className="text-xs text-zinc-500">completed</div>
                </div>
              </div>

              {cWkData && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {DKEYS.map((d) => {
                    const key = `${CW}-${d}`;
                    const wo = cWkData[d as keyof WeekData] as string;
                    const dn = !!checked[key];
                    const sa = actForDate(acts, cwDates[d]);
                    const isR = wo === "Rest";

                    return (
                      <div
                        key={d}
                        onClick={() => !isR && toggle(key)}
                        className={`p-3 rounded-lg border transition-all ${
                          isR
                            ? "bg-zinc-950 border-zinc-800 cursor-default"
                            : dn
                            ? "bg-green-950/30 border-green-800 cursor-pointer"
                            : "bg-zinc-950 border-zinc-800 cursor-pointer hover:bg-zinc-900 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs tracking-widest ${dn ? "text-green-400" : "text-zinc-500"}`}>
                            {dayLabel(d)}
                          </span>
                          <span className={`text-sm ${dn ? "text-green-400" : isR ? "text-zinc-600" : "text-zinc-700"}`}>
                            {dn ? "✓" : isR ? "—" : "○"}
                          </span>
                        </div>
                        <div className={`text-sm ${wc(wo)} mb-1`}>{wo}</div>
                        {sa && (
                          <div className="pt-2 border-t border-zinc-800">
                            <span className="text-xs text-orange-400">
                              🟠 {toMi(sa.distance)} mi · {fmtDur(sa.moving_time)} · {fmtPace(sa.average_speed)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {!athlete && (
                <div className="mt-4 p-3 bg-zinc-950 rounded border border-dashed border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-sm text-zinc-500">
                    Connect Strava to auto-sync runs and see real pace data on each workout.
                  </span>
                  <button
                    onClick={() => setTab("strava")}
                    className="px-4 py-2 bg-orange-500 text-black text-xs font-bold rounded hover:opacity-80"
                  >
                    CONNECT STRAVA
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plan Tab */}
        {tab === "plan" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Phase Tabs */}
            <div className="flex flex-wrap gap-2">
              {PHASES.map((p) => {
                const active = phIdx === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPhIdx(p.id)}
                    className={`px-4 py-2 text-xs font-bold tracking-widest rounded transition-colors ${
                      active
                        ? "text-black"
                        : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
                    }`}
                    style={active ? { backgroundColor: p.accent, borderColor: p.accent } : undefined}
                  >
                    PH.{p.phase} {p.label}
                  </button>
                );
              })}
            </div>

            {/* Phase Header */}
            <div className="flex flex-wrap gap-6 items-start justify-between">
              <div>
                <div className="text-xs tracking-widest uppercase mb-1" style={{ color: phase.accent }}>
                  {phase.range} · {phase.dates}
                </div>
                <h2 className="text-3xl font-black text-white">{phase.label}</h2>
              </div>
              <div
                className="max-w-sm text-sm text-zinc-500 leading-relaxed border-l-2 pl-4"
                style={{ borderColor: phase.accent }}
              >
                {phase.tip}
              </div>
            </div>

            {/* Weeks Table */}
            <div className="overflow-x-auto border border-zinc-800 rounded-lg">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-zinc-900">
                    {["", "WK", "DATE", "MON", "TUE", "WED", "FRI", "SAT", "MI"].map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-xs font-bold tracking-widest text-zinc-600 py-2 px-3 border-b border-zinc-800"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {phase.weeks.map((week) => {
                    const isCur = week.n === CW;
                    const wDone = DKEYS.filter((d) => checked[`${week.n}-${d}`]).length;

                    return (
                      <tr
                        key={week.n}
                        className={`border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors ${
                          isCur ? "bg-zinc-900/30" : ""
                        }`}
                      >
                        <td className="py-2 px-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: isCur
                                ? phase.accent
                                : wDone === DKEYS.length
                                ? "#4ade80"
                                : wDone > 0
                                ? "#facc15"
                                : "#18181b",
                            }}
                          />
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="font-bold text-sm" style={{ color: isCur ? phase.accent : "#a1a1aa" }}>
                            {String(week.n).padStart(2, "0")}
                          </span>
                          {week.recovery && (
                            <span className="ml-2 text-[10px] tracking-wide text-green-400 border border-green-800 rounded px-1">
                              REST
                            </span>
                          )}
                          {isCur && (
                            <span
                              className="ml-2 text-[10px] tracking-wide rounded px-1 border"
                              style={{ color: phase.accent, borderColor: `${phase.accent}40` }}
                            >
                              NOW
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-xs text-zinc-600 whitespace-nowrap">{week.date}</td>
                        {DKEYS.map((d) => {
                          const w = week[d as keyof WeekData] as string;
                          const key = `${week.n}-${d}`;
                          const dn = !!checked[key];
                          const isR = w === "Rest";

                          return (
                            <td key={d} className="py-2 px-3 whitespace-nowrap">
                              <div
                                onClick={() => !isR && toggle(key)}
                                className={`flex items-center gap-2 ${isR ? "cursor-default" : "cursor-pointer"}`}
                                title={w}
                              >
                                {!isR && (
                                  <div
                                    className={`w-3 h-3 rounded flex items-center justify-center text-[8px] font-bold transition-all ${
                                      dn ? "text-black" : "border-2 border-zinc-700"
                                    }`}
                                    style={{ background: dn ? "#4ade80" : "transparent" }}
                                  >
                                    {dn ? "✓" : ""}
                                  </div>
                                )}
                                <span className={`text-sm ${wc(w)} ${dn && !isR ? "line-through opacity-50" : ""}`}>
                                  {w}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-3">
                          {week.race ? (
                            <span className="text-lg">🏁</span>
                          ) : (
                            <span
                              className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${phase.accent}20`, color: phase.accent }}
                            >
                              {week.mi}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 text-xs text-zinc-500">
              <span>🟢 Green = completed</span>
              <span className="text-yellow-400">🟡 Yellow = tempo run</span>
              <span className="text-blue-400">🔵 Blue = race day</span>
            </div>
          </div>
        )}

        {/* Strava Tab - Connect */}
        {tab === "strava" && !athlete && (
          <div className="max-w-xl animate-in fade-in duration-200">
            <h2 className="text-3xl font-black mb-2">CONNECT STRAVA</h2>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              Once connected, your runs auto-import and workouts are marked complete with your real pace and distance.
            </p>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowI(!showI)}
              >
                <span className="text-xs font-bold tracking-widest">HOW TO GET YOUR ACCESS TOKEN</span>
                <span className="text-zinc-500 text-lg">{showI ? "−" : "+"}</span>
              </div>
              {showI && (
                <ol className="text-sm text-zinc-500 mt-4 pl-5 space-y-2 list-decimal leading-relaxed">
                  <li>
                    Go to{" "}
                    <a
                      href="https://www.strava.com/settings/api"
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 hover:underline"
                    >
                      strava.com/settings/api
                    </a>{" "}
                    and create a free API application
                  </li>
                  <li>
                    Set <strong className="text-zinc-300">Authorization Callback Domain</strong> to{" "}
                    <code className="text-purple-400 bg-zinc-800 px-1 rounded text-xs">localhost</code>
                  </li>
                  <li>
                    Note your <strong className="text-zinc-300">Client ID</strong> and{" "}
                    <strong className="text-zinc-300">Client Secret</strong>
                  </li>
                  <li>
                    Open this in your browser, replacing <code className="text-purple-400">YOUR_CLIENT_ID</code>:
                    <code className="text-xs text-purple-400 bg-zinc-950 block p-2 rounded mt-1 break-all">
                      https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&scope=activity:read_all
                    </code>
                  </li>
                  <li>
                    Authorize → you&apos;ll be redirected to localhost. Copy the{" "}
                    <strong className="text-zinc-300">code=</strong> value from the URL
                  </li>
                  <li>
                    Run this to get your token (replace ID, SECRET, CODE):
                    <code className="text-xs text-purple-400 bg-zinc-950 block p-2 rounded mt-1 break-all">
                      curl -X POST https://www.strava.com/oauth/token -d client_id=ID -d client_secret=SECRET -d code=CODE -d grant_type=authorization_code
                    </code>
                  </li>
                  <li>
                    Copy the <strong className="text-zinc-300">access_token</strong> from the response and paste below
                  </li>
                </ol>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                value={tInput}
                onChange={(e) => setTInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connectStrava()}
                placeholder="Paste your Strava access token..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm outline-none focus:border-zinc-700"
              />
              <button
                onClick={connectStrava}
                disabled={syncing}
                className="px-4 py-2 bg-orange-500 text-black text-xs font-bold rounded hover:opacity-80 disabled:opacity-50"
              >
                {syncing ? <span className="animate-spin">⟳</span> : "CONNECT"}
              </button>
            </div>
            {serr && <div className="mt-3 text-sm text-red-400">⚠ {serr}</div>}
          </div>
        )}

        {/* Strava Tab - Connected */}
        {tab === "strava" && athlete && (
          <div className="animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4 flex items-center gap-4 flex-wrap">
              {athlete.profile_medium && (
                <img
                  src={athlete.profile_medium}
                  alt=""
                  className="w-12 h-12 rounded-full border-2 border-orange-500"
                />
              )}
              <div>
                <div className="text-xs tracking-widest text-green-400 uppercase mb-1">Connected</div>
                <div className="text-xl font-bold">
                  {athlete.firstname} {athlete.lastname}
                </div>
                <div className="text-sm text-zinc-500">
                  {sRuns.length} runs synced · {sMiles.toFixed(1)} miles total
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={syncStrava}
                  disabled={syncing}
                  className="px-3 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded hover:bg-zinc-700 disabled:opacity-50"
                >
                  {syncing ? <span className="animate-spin">⟳</span> : "↻ SYNC NOW"}
                </button>
                <button
                  onClick={disconnect}
                  className="px-3 py-2 bg-red-950 text-red-400 text-xs font-bold rounded hover:bg-red-900"
                >
                  DISCONNECT
                </button>
              </div>
            </div>
            
            {serr && <div className="mb-4 text-sm text-red-400">⚠ {serr}</div>}
            
            <div className="text-xs tracking-widest text-zinc-500 uppercase mb-3">
              Runs Since Plan Start — {sRuns.length} Activities
            </div>
            
            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              {sRuns.length === 0 ? (
                <div className="p-10 text-center text-zinc-500">
                  No runs found since April 14 — go log some miles! 🏃
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-900">
                      {["DATE", "ACTIVITY", "DIST", "TIME", "PACE", "WK", ""].map((h, i) => (
                        <th
                          key={i}
                          className="text-left text-xs font-bold tracking-widest text-zinc-600 py-2 px-3 border-b border-zinc-800"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sRuns.slice(0, 80).map((a) => {
                      const dt = a.start_date_local?.split("T")[0] || "";
                      const wn = Math.floor((new Date(dt + "T12:00:00").getTime() - PLAN_START.getTime()) / (7 * 864e5)) + 1;
                      return (
                        <tr key={a.id} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                          <td className="py-2 px-3 text-xs text-zinc-500">{dt}</td>
                          <td className="py-2 px-3 text-sm max-w-40 truncate">{a.name}</td>
                          <td className="py-2 px-3 text-sm font-bold text-orange-400">{toMi(a.distance)} mi</td>
                          <td className="py-2 px-3 text-sm text-zinc-500">{fmtDur(a.moving_time)}</td>
                          <td className="py-2 px-3 text-sm text-zinc-500">{fmtPace(a.average_speed)}</td>
                          <td className="py-2 px-3">
                            {wn >= 1 && wn <= 29 && (
                              <span
                                className="text-xs px-2 py-0.5 rounded border"
                                style={{ color: cPhase.accent, borderColor: `${cPhase.accent}40` }}
                              >
                                WK {wn}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <a
                              href={`https://www.strava.com/activities/${a.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-zinc-500 hover:text-zinc-300"
                            >
                              View ↗
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Log Tab */}
        {tab === "log" && (
          <div className="animate-in fade-in duration-200">
            <div className="flex items-baseline justify-between gap-4 mb-6 flex-wrap">
              <div>
                <h2 className="text-3xl font-black mb-1">RUN LOG</h2>
                <p className="text-sm text-zinc-500">
                  {athlete ? "Strava runs auto-imported." : "Manual tracking."} {allRuns.length} total entries.
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`px-4 py-2 text-xs font-bold rounded ${
                  showForm
                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    : "bg-green-400 text-black hover:opacity-80"
                }`}
              >
                {showForm ? "CANCEL" : "+ ADD RUN"}
              </button>
            </div>

            {showForm && (
              <div className="bg-zinc-900 border border-green-800 rounded-lg p-4 mb-6">
                <div className="text-xs tracking-widest text-green-400 uppercase mb-4">Log a Run Manually</div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase block mb-1">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase block mb-1">Distance (mi)</label>
                    <input
                      type="number"
                      value={form.dist}
                      onChange={(e) => setForm({ ...form, dist: e.target.value })}
                      placeholder="3.5"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase block mb-1">Duration</label>
                    <input
                      type="text"
                      value={form.dur}
                      onChange={(e) => setForm({ ...form, dur: e.target.value })}
                      placeholder="35m or 1h 20m"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Notes (optional)..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm outline-none focus:border-zinc-700"
                  />
                  <button
                    onClick={addRun}
                    className="px-4 py-2 bg-green-400 text-black text-xs font-bold rounded hover:opacity-80"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            )}

            {allRuns.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <div className="text-4xl mb-3">🏃</div>
                <div>
                  {athlete
                    ? "Your Strava runs will appear here after syncing."
                    : "No runs logged yet — add one above or connect Strava."}
                </div>
              </div>
            ) : (
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-900">
                      {["DATE", "DIST", "DURATION", "PACE", "SOURCE", "NOTES", ""].map((h, i) => (
                        <th
                          key={i}
                          className="text-left text-xs font-bold tracking-widest text-zinc-600 py-2 px-3 border-b border-zinc-800"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allRuns.map((r) => (
                      <tr key={r.id} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                        <td className="py-2 px-3 text-xs text-zinc-500">{r.date}</td>
                        <td className="py-2 px-3 text-sm font-bold text-orange-400">{r.dist} mi</td>
                        <td className="py-2 px-3 text-sm text-zinc-500">{r.dur}</td>
                        <td className="py-2 px-3 text-sm text-zinc-500">{r.pace}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${
                              r.source === "strava"
                                ? "text-orange-400 border-orange-400/30 bg-orange-400/10"
                                : "text-green-400 border-green-400/30 bg-green-400/10"
                            }`}
                          >
                            {r.source === "strava" ? "STRAVA" : "MANUAL"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-sm text-zinc-500 max-w-40 truncate">{r.name || "—"}</td>
                        <td className="py-2 px-3">
                          {r.source === "manual" ? (
                            <button
                              onClick={() => delManual(r.id as number)}
                              className="text-zinc-600 hover:text-red-400"
                              title="Delete"
                            >
                              ✕
                            </button>
                          ) : (
                            <a
                              href={`https://www.strava.com/activities/${r.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-zinc-500 hover:text-zinc-300"
                            >
                              ↗
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
