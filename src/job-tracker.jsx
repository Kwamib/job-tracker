import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const STATUSES = ["Applied", "Interviewing", "Offer", "Rejected", "Ghosted"];

const STATUS_CONFIG = {
  Applied:     { color: "#4A9EFF", bg: "rgba(74,158,255,0.12)"  },
  Interviewing:{ color: "#F5A623", bg: "rgba(245,166,35,0.12)" },
  Offer:       { color: "#4CD964", bg: "rgba(76,217,100,0.12)" },
  Rejected:    { color: "#FF453A", bg: "rgba(255,69,58,0.12)"  },
  Ghosted:     { color: "#8E8E93", bg: "rgba(142,142,147,0.12)"},
};

const SOURCES = ["LinkedIn", "Company Site", "Referral", "Indeed", "Recruiter", "Other"];

const ENTRY_TAGS = [
  { id: "applied",    label: "Applied",    icon: "📨", color: "#4A9EFF" },
  { id: "call",       label: "Call",       icon: "📞", color: "#4CD964" },
  { id: "email",      label: "Email",      icon: "💬", color: "#A855F7" },
  { id: "interview",  label: "Interview",  icon: "🎯", color: "#F5A623" },
  { id: "task",       label: "Task",       icon: "📋", color: "#FF8C42" },
  { id: "offer",      label: "Offer",      icon: "💰", color: "#4CD964" },
  { id: "rejection",  label: "Rejection",  icon: "❌", color: "#FF453A" },
  { id: "note",       label: "Note",       icon: "📝", color: "#8E8E93" },
];

const TAG_BY_ID = Object.fromEntries(ENTRY_TAGS.map(t => [t.id, t]));

function formatEntryTime(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    const date = d.toLocaleDateString(undefined, sameYear ? { month: "short", day: "numeric" } : { year: "numeric", month: "short", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${date} · ${time}`;
  } catch { return iso; }
}

const THEME = {
  dark: {
    bg:"#0A0A0F",surface:"#111118",surface2:"#16161F",border:"#1C1C2A",borderStrong:"#2C2C3A",
    text:"#E5E5EA",textMuted:"#A0A0B0",textFaint:"#4A4A5A",textGhost:"#3C3C4A",
    rowAlt:"rgba(255,255,255,0.01)",rowHover:"rgba(255,255,255,0.03)",
    inputBg:"#0A0A0F",emptyText:"#2C2C3A",overlay:"rgba(0,0,0,0.75)",
  },
  light: {
    bg:"#F5F5F7",surface:"#FFFFFF",surface2:"#F0F0F5",border:"#E0E0E8",borderStrong:"#C8C8D8",
    text:"#1C1C2A",textMuted:"#4A4A6A",textFaint:"#8A8AA0",textGhost:"#ADADC0",
    rowAlt:"rgba(0,0,0,0.02)",rowHover:"rgba(0,0,0,0.04)",
    inputBg:"#F9F9FC",emptyText:"#C8C8D8",overlay:"rgba(0,0,0,0.5)",
  },
};

const BANNER_MESSAGES = {
  0:  ["Pipeline looking clean. Stay locked in.","Every application is a rep. Keep lifting.","Built quietly. Hired loudly.","The right role exists. Go find it.","Terraform the job market. One apply at a time."],
  1:  ["One rejection. That's nothing. Stack more.","They rejected you before they knew you. Their loss.","Rejection is just pipeline noise. Filter it out.","One down. Keep the PRs coming.","CACI didn't define you. Neither does this."],
  3:  ["Three rejections. You're warming up.","The pipeline has latency. Ship anyway.","Every no is just bad infra. Build around it.","Still standing. Still applying. Built quietly.","Rejection #3 means you're actively in the game."],
  5:  ["Five rejections and you're still here? Respect.","At this point rejections are just logs. Grep and move on.","5 Ls and counting. The offer is in the queue.","This is just the pod restarting. It'll come back up.","They slept on you. Document it. Move forward."],
  8:  ["Eight? You're basically battle-hardened now.","The stack isn't broken. The market is. Push anyway.","Your GitHub is cleaner than their entire infra. Keep going.","At 8 rejections you should be charging consulting fees just to interview.","Rejection speedrun any%? You're competitive."],
  12: ["Twelve rejections. You are the cluster. You will not go down.","At this point you've stress-tested the entire hiring market.","The ATS is cooked. You are not.","You've outlasted 12 companies' interest and you're still shipping. Unreal.","This is fine. 🔥 The offer is containerized and on its way."],
};

const MOTIVATIONS = [
  { text: "You've built production infrastructure that serves real traffic. Most people interviewing you haven't.", author: "Built Quietly" },
  { text: "AWS Solutions Architect. Public Trust cleared. 15 years deep. You're not entry level. Stop applying like you are.", author: "Pipeline Truth" },
  { text: "The right company isn't rejecting you. The wrong ones are. That's called filtering.", author: "Systems Thinking" },
  { text: "Every rejection is just the market telling you that wasn't your cluster. Your node is out there.", author: "DevOps Mindset" },
  { text: "You left a stable job to build something real. That's not reckless. That's conviction.", author: "Built Quietly" },
  { text: "Katy, TX. Ghana. The vision is intact. The job search is just an infra step in a longer pipeline.", author: "Long Game" },
  { text: "You're not just applying for jobs. You're positioning yourself for the next decade. Act accordingly.", author: "Career Architect" },
  { text: "The market is weird right now. That's not a you problem. That's a macro problem. Keep shipping.", author: "Honest Truth" },
  { text: "Your GitHub does the talking when you're not in the room. Make sure it's loud.", author: "Digital Presence" },
  { text: "Terraform, Kubernetes, ArgoCD, AWS. You didn't get here by accident. Trust the compounding.", author: "Stack Check" },
  { text: "Introverts don't need to perform confidence. They need to let the work speak. Yours is speaking.", author: "Built Quietly" },
  { text: "One offer changes everything. One is all you need.", author: "Pipeline Math" },
  { text: "The streak continues. Applied today. That's the job right now.", author: "Daily Rep" },
  { text: "Two kids, a relocation, a side hustle, and a job search running in parallel. You're not behind. You're juggling.", author: "Real Talk" },
  { text: "The offer is in the queue. It just hasn't been processed yet. Keep the pipeline warm.", author: "Cloud Native" },
];

const ROAST_TEMPLATES = [
  s => `${s.total} applications and ${s.Offer} offers. That's a ${s.total>0?Math.round((s.Offer/s.total)*100):0}% close rate. Your Terraform modules have better uptime.`,
  s => `${s.Ghosted} ghostings. You've been left on read more times than a Slack message in #general.`,
  s => `${s.Rejected} rejections, ${s.Ghosted} ghostings, ${s.Interviewing} interviews. The pipeline has more failures than a Friday deploy.`,
  s => `${s.Applied} applied, ${s.Interviewing} interviewing. That's a ${s.total>0?Math.round((s.Interviewing/s.total)*100):0}% interview rate. Your AWS cost optimization is tighter than your conversion rate.`,
  s => s.Offer > 0 ? `${s.Offer} offer${s.Offer>1?"s":""}?? Let's go. Close it before the market changes again.` : `Zero offers so far. The cluster is healthy. The job market is the incident.`,
  s => `${s.Ghosted} ghosts. At this point you're haunted. Build Quietly, Apply Loudly, Get Ignored Silently.`,
];

function getBannerMessages(n) {
  for (const tier of [12,8,5,3,1,0]) { if (n >= tier) return BANNER_MESSAGES[tier]; }
  return BANNER_MESSAGES[0];
}

function createAudioContext() {
  try { return new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
}

function playSound(type) {
  const ctx = createAudioContext();
  if (!ctx) return;
  const play = (freq, dur, wave="sine", vol=0.3) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = wave; o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + dur);
  };
  if (type==="Applied")      { play(440,0.1,"sine",0.2); }
  if (type==="Interviewing") { play(523,0.12,"sine",0.25); setTimeout(()=>play(659,0.15,"sine",0.25),80); }
  if (type==="Offer")        { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>play(f,0.25,"triangle",0.3),i*100)); setTimeout(()=>play(1047,0.5,"triangle",0.35),450); }
  if (type==="Rejected")     { play(330,0.3,"sawtooth",0.15); setTimeout(()=>play(262,0.4,"sawtooth",0.12),200); setTimeout(()=>play(196,0.5,"sawtooth",0.1),450); }
  if (type==="Ghosted")      { play(200,0.8,"sine",0.1); setTimeout(()=>play(180,0.6,"sine",0.07),300); }
}

const CONFETTI_CFG = {
  Offer:       {count:120,colors:["#4CD964","#FFD700","#FF69B4","#4A9EFF","#FF6B35","#A855F7","#FFFFFF"],shapes:["rect","circle","triangle"],gravity:0.4,spread:160,velocity:18,decay:0.96,duration:4000},
  Interviewing:{count:50, colors:["#F5A623","#FFD700","#FFF0C0","#FFAA33"],                             shapes:["rect","circle"],            gravity:0.35,spread:100,velocity:12,decay:0.97,duration:2500},
  Rejected:    {count:40, colors:["#FF453A","#8B0000","#2A2A2A","#1A1A1A","#CC0000"],                  shapes:["rect","rect","rect"],       gravity:0.15,spread:80, velocity:6, decay:0.98,duration:3500},
  Ghosted:     {count:30, colors:["#8E8E93","#AEAEB2","#636366","#4A4A5A","#C7C7CC"],                  shapes:["circle","rect"],            gravity:0.08,spread:60, velocity:4, decay:0.99,duration:3000},
};

function ConfettiCanvas({ bursts }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);
  const spawnBurst = useCallback((burst) => {
    const cfg = CONFETTI_CFG[burst.status];
    if (!cfg || !canvasRef.current) return;
    const cx = burst.x ?? canvasRef.current.width/2;
    const cy = burst.y ?? canvasRef.current.height/3;
    for (let i=0;i<cfg.count;i++) {
      const angle = (Math.random()*cfg.spread - cfg.spread/2)*(Math.PI/180) - Math.PI/2;
      const speed = cfg.velocity*(0.5+Math.random()*0.5);
      particlesRef.current.push({
        x:cx,y:cy,vx:Math.cos(angle)*speed*(0.7+Math.random()*0.6),vy:Math.sin(angle)*speed,
        gravity:cfg.gravity,decay:cfg.decay,color:cfg.colors[Math.floor(Math.random()*cfg.colors.length)],
        shape:cfg.shapes[Math.floor(Math.random()*cfg.shapes.length)],
        size:Math.random()*7+4,rotation:Math.random()*360,rotationSpeed:(Math.random()-0.5)*8,
        alpha:1,alphaDecay:1/(cfg.duration/16),
      });
    }
  },[]);
  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    c.width=window.innerWidth; c.height=window.innerHeight;
    const r=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    window.addEventListener("resize",r); return ()=>window.removeEventListener("resize",r);
  },[]);
  useEffect(()=>{ if(bursts.length) spawnBurst(bursts[bursts.length-1]); },[bursts,spawnBurst]);
  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    const ctx=c.getContext("2d");
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      particlesRef.current=particlesRef.current.filter(p=>p.alpha>0.01);
      for(const p of particlesRef.current){
        ctx.save(); ctx.globalAlpha=p.alpha; ctx.fillStyle=p.color;
        ctx.translate(p.x,p.y); ctx.rotate(p.rotation*Math.PI/180);
        if(p.shape==="circle"){ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();}
        else if(p.shape==="triangle"){ctx.beginPath();ctx.moveTo(0,-p.size/2);ctx.lineTo(p.size/2,p.size/2);ctx.lineTo(-p.size/2,p.size/2);ctx.closePath();ctx.fill();}
        else{ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);}
        ctx.restore();
        p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity;p.vx*=p.decay;p.vy*=p.decay;
        p.rotation+=p.rotationSpeed;p.alpha-=p.alphaDecay;
      }
      animRef.current=requestAnimationFrame(draw);
    };
    cancelAnimationFrame(animRef.current); animRef.current=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(animRef.current);
  },[]);
  return <canvas ref={canvasRef} style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",pointerEvents:"none",zIndex:9999}}/>;
}

function Toast({ message, color, onDone }) {
  useEffect(()=>{const t=setTimeout(onDone,2800);return ()=>clearTimeout(t);},[onDone]);
  return (
    <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#1C1C2A",border:`1px solid ${color}40`,borderRadius:"8px",padding:"10px 20px",fontSize:"12px",color,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",zIndex:10000,animation:"toastIn 0.3s ease",whiteSpace:"nowrap",boxShadow:"0 4px 24px rgba(0,0,0,0.4)"}}>
      {message}
    </div>
  );
}

const STORAGE_KEY = "job-tracker-v2";
const SETTINGS_KEY = "job-tracker-settings-v1";

const defaultJobs = [];

function migrateJob(j) {
  // v1 → v2: convert single notes string to entries array
  if (Array.isArray(j.entries)) return j;
  const entries = [];
  if (j.notes && typeof j.notes === "string" && j.notes.trim()) {
    entries.push({
      id: `migrated-${j.id}`,
      timestamp: j.date ? new Date(j.date).toISOString() : new Date().toISOString(),
      tag: "note",
      text: j.notes.trim(),
    });
  }
  const { notes, ...rest } = j;
  void notes;
  return { ...rest, entries };
}

function loadJobs() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) return JSON.parse(d).map(migrateJob);
    // one-time migration from v1 storage
    const old = localStorage.getItem("job-tracker-v1");
    if (old) {
      const migrated = JSON.parse(old).map(migrateJob);
      // don't auto-import demo data; leave that to the user
      return migrated.filter(j => !/^Company \d+$/i.test(j.company));
    }
    return defaultJobs;
  } catch { return defaultJobs; }
}
function saveJobs(jobs) {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(jobs)); } catch {}
}
function loadSettings() {
  try { const d=localStorage.getItem(SETTINGS_KEY); return d?JSON.parse(d):{isDark:true,soundOn:true,view:"table"}; } catch { return {isDark:true,soundOn:true,view:"table"}; }
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY,JSON.stringify(s)); } catch {}
}

const emptyForm = {company:"",role:"",date:new Date().toISOString().split("T")[0],status:"Applied",source:"LinkedIn",entries:[],salary:"",location:""};

const REQUIRED_FIELDS = ["company", "role", "date", "status", "source"];
function validateForm(form) {
  const errors = {};
  REQUIRED_FIELDS.forEach(f => {
    if (!form[f] || (typeof form[f] === "string" && !form[f].trim())) {
      errors[f] = "Required";
    }
  });
  return errors;
}

let nextId = Date.now();

function ActivityLog({ entries, onAdd, onDelete, theme, compact = false }) {
  const t = theme;
  const [tag, setTag] = useState("note");
  const [text, setText] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const sorted = [...(entries || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const submit = () => {
    if (!text.trim()) return;
    if (onAdd(tag, text)) {
      setText("");
      setTag("note");
    }
  };

  const tagInfo = TAG_BY_ID[tag] || TAG_BY_ID.note;

  return (
    <div>
      {/* Composer */}
      <div style={{ background: t.inputBg, border: `1px solid ${t.borderStrong}`, borderRadius: "8px", padding: "10px", marginBottom: "12px", position: "relative" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "stretch", marginBottom: "8px" }}>
          <button
            type="button"
            onClick={() => setShowPicker(p => !p)}
            style={{
              background: tagInfo.color + "18",
              border: `1px solid ${tagInfo.color}50`,
              color: tagInfo.color,
              borderRadius: "6px",
              padding: "0 10px",
              fontSize: "11px",
              fontFamily: "'IBM Plex Mono',monospace",
              letterSpacing: "0.04em",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
            <span>{tagInfo.icon}</span>
            <span>{tagInfo.label}</span>
            <span style={{ opacity: 0.6, fontSize: "9px" }}>▾</span>
          </button>
        </div>
        {showPicker && (
          <div style={{
            position: "absolute", top: "44px", left: "10px", zIndex: 50,
            background: t.surface, border: `1px solid ${t.borderStrong}`, borderRadius: "8px",
            padding: "6px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "4px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)", minWidth: "220px",
          }}>
            {ENTRY_TAGS.map(et => (
              <button key={et.id} type="button" onClick={() => { setTag(et.id); setShowPicker(false); }}
                style={{
                  background: tag === et.id ? et.color + "22" : "transparent",
                  border: `1px solid ${tag === et.id ? et.color + "60" : "transparent"}`,
                  borderRadius: "5px", padding: "7px 9px", textAlign: "left",
                  fontSize: "11px", color: et.color, fontFamily: "'IBM Plex Mono',monospace",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                }}>
                <span>{et.icon}</span><span>{et.label}</span>
              </button>
            ))}
          </div>
        )}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }}
          placeholder="Add a note, log a call, capture an interview..."
          rows={compact ? 2 : 3}
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            color: t.text, fontSize: "12px", fontFamily: "'IBM Plex Mono',monospace",
            resize: "vertical", lineHeight: 1.5, padding: "4px 2px",
          }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
          <span style={{ fontSize: "9px", color: t.textGhost, letterSpacing: "0.06em" }}>⌘+Enter to log</span>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            style={{
              background: text.trim() ? tagInfo.color : "transparent",
              color: text.trim() ? "#fff" : t.textGhost,
              border: text.trim() ? "none" : `1px solid ${t.border}`,
              borderRadius: "5px", padding: "6px 14px", fontSize: "10px",
              fontFamily: "'IBM Plex Mono',monospace", letterSpacing: "0.08em",
              cursor: text.trim() ? "pointer" : "not-allowed", fontWeight: 500,
            }}>
            + LOG
          </button>
        </div>
      </div>

      {/* Timeline */}
      {sorted.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "20px 8px", color: t.textGhost,
          fontSize: "10px", letterSpacing: "0.08em", border: `1px dashed ${t.border}`,
          borderRadius: "6px",
        }}>
          NO ACTIVITY YET — LOG YOUR FIRST ENTRY ABOVE
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sorted.map(entry => {
            const et = TAG_BY_ID[entry.tag] || TAG_BY_ID.note;
            return (
              <div key={entry.id} style={{
                background: t.inputBg, borderLeft: `3px solid ${et.color}`,
                border: `1px solid ${t.border}`, borderLeftWidth: "3px",
                borderRadius: "6px", padding: "10px 12px", position: "relative",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                    <span style={{ fontSize: "11px" }}>{et.icon}</span>
                    <span style={{ fontSize: "9px", color: et.color, letterSpacing: "0.08em", fontWeight: 600 }}>{et.label.toUpperCase()}</span>
                    <span style={{ fontSize: "9px", color: t.textGhost, letterSpacing: "0.04em" }}>· {formatEntryTime(entry.timestamp)}</span>
                  </div>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete this entry? Activity log entries can't be edited, only deleted.")) {
                          onDelete(entry.id);
                        }
                      }}
                      style={{
                        background: "none", border: "none", color: t.textGhost,
                        cursor: "pointer", fontSize: "12px", padding: "0 4px", lineHeight: 1,
                      }}
                      title="Delete entry">✕</button>
                  )}
                </div>
                <div style={{
                  fontSize: "12px", color: t.text, fontFamily: "'IBM Plex Mono',monospace",
                  lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>{entry.text}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function useIsMobile(breakpoint = 700) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = e => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [breakpoint]);
  return isMobile;
}

export default function JobTracker() {
  const isMobile = useIsMobile();
  const [jobs, setJobsRaw]            = useState(loadJobs);
  const settings                       = useMemo(loadSettings,[]);
  const [form, setForm]               = useState(emptyForm);
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState(null);
  const [filterStatus, setFilterStatus]= useState("All");
  const [sortBy, setSortBy]           = useState("date");
  const [search, setSearch]           = useState("");
  const [isDark, setIsDarkRaw]        = useState(settings.isDark);
  const [view, setViewRaw]            = useState(settings.view);
  const [soundOn, setSoundOnRaw]      = useState(settings.soundOn);
  const [confettiBursts, setConfettiBursts] = useState([]);
  const [notesJob, setNotesJob]       = useState(null);
  const [roastText, setRoastText]     = useState(null);
  const [toast, setToast]             = useState(null);
  const [dragging, setDragging]       = useState(null);
  const [dragOver, setDragOver]       = useState(null);
  const [motivationModal, setMotivationModal] = useState(null);
  const [selected, setSelected]       = useState(new Set());
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [headline, setHeadline]       = useState(()=>{ try { return localStorage.getItem("job-tracker-headline")||"DEVOPS & CLOUD"; } catch { return "DEVOPS & CLOUD"; } });
  const [editingHeadline, setEditingHeadline] = useState(false);
  const [headlineDraft, setHeadlineDraft] = useState("");
  const [formErrors, setFormErrors]   = useState({});

  const setJobs = (jobs) => { setJobsRaw(jobs); saveJobs(typeof jobs === "function" ? jobs([]) : jobs); };
  const setIsDark = (v) => { setIsDarkRaw(v); saveSettings({isDark:v, soundOn, view}); };
  const setView   = (v) => { setViewRaw(v);   saveSettings({isDark, soundOn, view:v}); };
  const setSoundOn= (v) => { setSoundOnRaw(v);saveSettings({isDark, soundOn:v, view}); };

  // Persist jobs properly using useEffect
  useEffect(() => { saveJobs(jobs); }, [jobs]);

  const t = THEME[isDark ? "dark" : "light"];

  const stats = useMemo(()=>{
    const total=jobs.length, counts={};
    STATUSES.forEach(s=>counts[s]=jobs.filter(j=>j.status===s).length);
    return {total,...counts};
  },[jobs]);

  const rejectionCount = stats["Rejected"] + stats["Ghosted"];
  const bannerMessages = getBannerMessages(rejectionCount);
  const tickerItems    = [...bannerMessages,...bannerMessages,...bannerMessages];

  const filtered = useMemo(()=>{
    let list=[...jobs];
    if(filterStatus!=="All") list=list.filter(j=>j.status===filterStatus);
    if(search){
      const q=search.toLowerCase();
      list=list.filter(j=>
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        (j.entries||[]).some(e => (e.text||"").toLowerCase().includes(q))
      );
    }
    list.sort((a,b)=>{
      if(sortBy==="date") return new Date(b.date)-new Date(a.date);
      if(sortBy==="company") return a.company.localeCompare(b.company);
      if(sortBy==="status") return a.status.localeCompare(b.status);
      return 0;
    });
    return list;
  },[jobs,filterStatus,search,sortBy]);

  const fireStatus = (id, newStatus, event) => {
    setJobs(jobs.map(j=>j.id===id?{...j,status:newStatus}:j));
    if(soundOn) playSound(newStatus);
    if(CONFETTI_CFG[newStatus]){
      const rect=event?.target?.getBoundingClientRect();
      setConfettiBursts(prev=>[...prev,{status:newStatus,x:rect?rect.left+rect.width/2:window.innerWidth/2,y:rect?rect.top+rect.height/2:window.innerHeight/3,id:Date.now()}]);
    }
    const msgs={Offer:"🎉 LFG!! Offer incoming!",Rejected:"F in chat.",Ghosted:"👻 Left on read. Again.",Interviewing:"📞 Interview locked in. Prep up.",Applied:"📨 Sent."};
    if(msgs[newStatus]) setToast({message:msgs[newStatus],color:STATUS_CONFIG[newStatus].color});
  };

  const handleSubmit = ()=>{
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setToast({ message: "Fix required fields", color: "#FF453A" });
      return;
    }
    const cleaned = { ...form, entries: Array.isArray(form.entries) ? form.entries : [] };
    if(editId!==null){
      setJobs(jobs.map(j=>j.id===editId?{...cleaned,id:editId}:j)); setEditId(null);
    } else {
      setJobs([...jobs,{...cleaned,id:nextId++}]);
    }
    setForm(emptyForm); setFormErrors({}); setShowForm(false);
  };

  const updateForm = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (formErrors[key]) {
      setFormErrors(e => { const n = {...e}; delete n[key]; return n; });
    }
  };

  const handleEdit   = (job)=>{
    setForm({...job, entries: Array.isArray(job.entries) ? job.entries : []});
    setEditId(job.id);
    setFormErrors({});
    setShowForm(true);
  };
  const handleDelete = (id) =>setJobs(jobs.filter(j=>j.id!==id));
  const cancelForm   = ()=>{setForm(emptyForm);setFormErrors({});setEditId(null);setShowForm(false);};

  const addEntryToJob = (jobId, tag, text) => {
    if (!text || !text.trim()) return false;
    const entry = { id: `e-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, timestamp: new Date().toISOString(), tag, text: text.trim() };
    setJobs(jobs.map(j => j.id === jobId ? { ...j, entries: [...(j.entries||[]), entry] } : j));
    // keep modal in sync
    setNotesJob(prev => prev && prev.id === jobId ? { ...prev, entries: [...(prev.entries||[]), entry] } : prev);
    setToast({ message: `${TAG_BY_ID[tag]?.icon||"📝"} Logged`, color: TAG_BY_ID[tag]?.color || "#4A9EFF" });
    return true;
  };

  const deleteEntryFromJob = (jobId, entryId) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, entries: (j.entries||[]).filter(e => e.id !== entryId) } : j));
    setNotesJob(prev => prev && prev.id === jobId ? { ...prev, entries: (prev.entries||[]).filter(e => e.id !== entryId) } : prev);
  };

  const toggleSelect = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) { setSelected(new Set()); }
    else { setSelected(new Set(filtered.map(j => j.id))); }
  };
  const deleteSelected = () => {
    setJobs(jobs.filter(j => !selected.has(j.id)));
    setSelected(new Set());
    setToast({ message: `🗑 ${selected.size} application${selected.size > 1 ? "s" : ""} removed`, color: "#FF453A" });
  };
  const clearAll = () => {
    setJobs([]);
    setSelected(new Set());
    setConfirmClearAll(false);
    setToast({ message: "Pipeline cleared.", color: "#8E8E93" });
  };

  const exportCSV = ()=>{
    const h=["Company","Role","Date","Status","Source","Salary","Location","Activity Log"];
    const flatten = entries => (entries||[])
      .slice()
      .sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp))
      .map(e=>`[${formatEntryTime(e.timestamp)} ${TAG_BY_ID[e.tag]?.label||"Note"}] ${e.text}`)
      .join(" || ");
    const rows=jobs.map(j=>[j.company,j.role,j.date,j.status,j.source,j.salary,j.location,`"${flatten(j.entries).replace(/"/g,'""')}"`]);
    const csv=[h.join(","),...rows.map(r=>r.join(","))].join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="job-pipeline.csv"; a.click();
    setToast({message:"📥 Exported to CSV",color:"#4A9EFF"});
  };

  const handleRoast = ()=>{
    const fn=ROAST_TEMPLATES[Math.floor(Math.random()*ROAST_TEMPLATES.length)];
    setRoastText(fn(stats));
  };

  const handleMotivate = ()=>{
    const m=MOTIVATIONS[Math.floor(Math.random()*MOTIVATIONS.length)];
    setMotivationModal(m);
    if(soundOn) { try { const ctx=createAudioContext(); if(ctx){const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type="sine";o.frequency.setValueAtTime(528,ctx.currentTime);g.gain.setValueAtTime(0.15,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.8);o.start(ctx.currentTime);o.stop(ctx.currentTime+0.8);} } catch {} }
  };

  const handleDragStart = (job)=>setDragging(job);
  const saveHeadline = (val) => {
    const v = val.trim() || "DEVOPS & CLOUD";
    setHeadline(v);
    try { localStorage.setItem("job-tracker-headline", v); } catch {}
    setEditingHeadline(false);
  };
  const handleDragOver  = (e,status)=>{e.preventDefault();setDragOver(status);};
  const handleDrop      = (e,status)=>{e.preventDefault();if(dragging&&dragging.status!==status)fireStatus(dragging.id,status,null);setDragging(null);setDragOver(null);};

  const inputStyle={width:"100%",background:t.inputBg,border:`1px solid ${t.borderStrong}`,borderRadius:"4px",padding:"8px 10px",color:t.text,fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace"};
  const bannerColor=rejectionCount===0?"#4A9EFF":rejectionCount<3?"#F5A623":rejectionCount<8?"#FF8C42":"#FF453A";
  const bannerBg   =rejectionCount===0?"rgba(74,158,255,0.08)":rejectionCount<3?"rgba(245,166,35,0.08)":rejectionCount<8?"rgba(255,140,66,0.08)":"rgba(255,69,58,0.10)";

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:"'IBM Plex Mono','Courier New',monospace",color:t.text,transition:"background 0.25s,color 0.25s"}}>
      <ConfettiCanvas bursts={confettiBursts}/>
      {toast && <Toast message={toast.message} color={toast.color} onDone={()=>setToast(null)}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,textarea{outline:none;transition:background 0.25s,color 0.25s,border-color 0.25s;}
        .status-pill{cursor:pointer;transition:opacity 0.15s;}
        .status-pill:hover{opacity:0.8;}
        .filter-btn,.icon-btn,.view-btn{transition:all 0.15s;cursor:pointer;border:none;}
        .icon-btn:hover{transform:translateY(-1px);}
        .add-btn{transition:all 0.15s;cursor:pointer;}
        .add-btn:hover{transform:translateY(-1px);}
        .stat-card{transition:border-color 0.15s,background 0.25s;cursor:pointer;}
        .del-btn{opacity:0;transition:opacity 0.15s;cursor:pointer;border:none;background:none;color:#FF453A;font-size:11px;padding:2px 6px;}
        .job-row:hover .del-btn{opacity:1;}
        .edit-btn{opacity:0;transition:opacity 0.15s;cursor:pointer;border:none;background:none;font-size:11px;padding:2px 6px;}
        .job-row:hover .edit-btn{opacity:1;}
        .form-overlay{animation:fadeIn 0.2s ease;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes motivIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        .job-row{transition:background 0.1s;}
        .ticker-track{display:flex;animation:ticker 30s linear infinite;white-space:nowrap;}
        .ticker-track:hover{animation-play-state:paused;}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}}
        .ticker-sep{margin:0 24px;opacity:0.35;}
        .kanban-col{transition:background 0.15s,border-color 0.15s;}
        .kanban-card{transition:transform 0.15s,box-shadow 0.15s;cursor:grab;}
        .kanban-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.3);}
        .kanban-card:active{cursor:grabbing;}
        .modal-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;}
        .modal-box{animation:fadeIn 0.2s ease;max-width:520px;width:90%;}
        .motiv-box{animation:motivIn 0.3s cubic-bezier(0.34,1.56,0.64,1);max-width:480px;width:90%;}
        .roast-box{animation:fadeIn 0.25s ease;}
        .motiv-btn{background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(100,180,255,0.2);transition:all 0.2s;}
        .motiv-btn:hover{border-color:rgba(100,180,255,0.5);transform:translateY(-1px);box-shadow:0 4px 20px rgba(74,158,255,0.15);}
        .bulk-bar{animation:bulkIn 0.25s cubic-bezier(0.34,1.56,0.64,1);}
        @keyframes bulkIn{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        input[type="checkbox"]{cursor:pointer;accent-color:#4A9EFF;width:14px;height:14px;}
        .headline-edit{border-bottom:1px dotted rgba(74,158,255,0.3);transition:border-color 0.15s;}
        .headline-edit:hover{border-bottom-color:rgba(74,158,255,0.9);}
      `}</style>

      {/* Banner */}
      <div style={{background:bannerBg,borderBottom:`1px solid ${bannerColor}22`,overflow:"hidden",padding:"7px 0",transition:"background 0.5s"}}>
        <div className="ticker-track">
          {tickerItems.map((msg,i)=>(
            <span key={i} style={{fontSize:"11px",color:bannerColor,letterSpacing:"0.08em",flexShrink:0,transition:"color 0.5s"}}>
              {msg}<span className="ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{borderBottom:`1px solid ${t.border}`,padding:isMobile?"14px 16px":"16px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
        <div>
          {editingHeadline ? (
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"}}>
              <input
                autoFocus
                value={headlineDraft}
                onChange={e=>setHeadlineDraft(e.target.value.toUpperCase())}
                onKeyDown={e=>{ if(e.key==="Enter") saveHeadline(headlineDraft); if(e.key==="Escape"){setEditingHeadline(false);} }}
                onBlur={()=>saveHeadline(headlineDraft)}
                maxLength={40}
                style={{background:"transparent",border:"none",borderBottom:"1px solid #4A9EFF",outline:"none",fontSize:"11px",color:"#4A9EFF",letterSpacing:"0.15em",fontWeight:500,fontFamily:"'IBM Plex Mono',monospace",width:"220px",padding:"1px 0"}}
              />
            </div>
          ) : (
            <div
              onClick={()=>{ setHeadlineDraft(headline); setEditingHeadline(true); }}
              title="Click to personalize"
              className="headline-edit"
              style={{fontSize:"11px",color:"#4A9EFF",letterSpacing:"0.15em",fontWeight:500,marginBottom:"4px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px"}}
            >
              KWAME // {headline}
              <span style={{fontSize:"10px",opacity:0.6}}>✎</span>
            </div>
          )}
          <div style={{fontSize:"20px",fontWeight:600,letterSpacing:"-0.02em",fontFamily:"'IBM Plex Sans',sans-serif"}}>Job Pipeline</div>
        </div>
        <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          {/* Motivate */}
          <button className="icon-btn motiv-btn" onClick={handleMotivate}
            style={{borderRadius:"6px",padding:"7px 13px",fontSize:"12px",color:"#4A9EFF",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.04em",cursor:"pointer"}}
            title="Motivate Me">✦ Motivate</button>
          {/* Roast */}
          <button className="icon-btn" onClick={handleRoast}
            style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:"6px",padding:"7px 11px",fontSize:"12px",color:t.textMuted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.04em",cursor:"pointer"}}
            title="Roast Me">🔥 Roast</button>
          {/* CSV */}
          <button className="icon-btn" onClick={exportCSV}
            style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:"6px",padding:"7px 11px",fontSize:"12px",color:t.textMuted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.04em",cursor:"pointer"}}>
            📥 CSV</button>
          {/* Sound */}
          <button className="icon-btn" onClick={()=>setSoundOn(!soundOn)}
            style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:"6px",padding:"7px 11px",fontSize:"15px",cursor:"pointer"}}>
            {soundOn?"🔊":"🔇"}</button>
          {/* View */}
          <div style={{display:"flex",background:t.surface,border:`1px solid ${t.border}`,borderRadius:"6px",overflow:"hidden"}}>
            {["table","kanban"].map(v=>(
              <button key={v} className="view-btn" onClick={()=>setView(v)}
                style={{padding:"7px 12px",fontSize:"11px",background:view===v?t.borderStrong:"transparent",color:view===v?t.text:t.textFaint,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.04em",border:"none",cursor:"pointer"}}>
                {v==="table"?"≡ LIST":"⊞ BOARD"}
              </button>
            ))}
          </div>
          {/* Theme */}
          <button className="icon-btn" onClick={()=>setIsDark(!isDark)}
            style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:"6px",padding:"7px 11px",fontSize:"15px",cursor:"pointer"}}>
            {isDark?"☀️":"🌙"}</button>
          {/* Add */}
          <button className="add-btn" onClick={()=>{setShowForm(!showForm);setEditId(null);setForm(emptyForm);}}
            style={{background:showForm?"transparent":"#4A9EFF",color:showForm?t.textFaint:"#fff",border:showForm?`1px solid ${t.borderStrong}`:"none",borderRadius:"6px",padding:"8px 16px",fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace",fontWeight:500,letterSpacing:"0.05em",cursor:"pointer"}}>
            {showForm?"CANCEL":"+ ADD ROLE"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"flex",padding:isMobile?"12px 16px":"14px 28px",overflowX:"auto",gap:"8px"}}>
        {[{label:"TOTAL",value:stats.total,color:t.text},...STATUSES.map(s=>({label:s.toUpperCase(),value:stats[s],color:STATUS_CONFIG[s].color}))].map(({label,value,color})=>(
          <div key={label} className="stat-card"
            onClick={()=>setFilterStatus(label==="TOTAL"?"All":label.charAt(0)+label.slice(1).toLowerCase())}
            style={{flex:"1 0 80px",background:t.surface,borderRadius:"6px",padding:"10px 14px",minWidth:"70px",border:`1px solid ${filterStatus===(label==="TOTAL"?"All":label.charAt(0)+label.slice(1).toLowerCase())?color:t.border}`}}>
            <div style={{fontSize:"22px",fontWeight:600,color,fontFamily:"'IBM Plex Sans',sans-serif"}}>{value}</div>
            <div style={{fontSize:"9px",color:t.textFaint,letterSpacing:"0.12em",marginTop:"2px"}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Roast */}
      {roastText && (
        <div className="roast-box" style={{margin:isMobile?"0 16px 12px":"0 28px 14px",background:"rgba(255,69,58,0.08)",border:"1px solid rgba(255,69,58,0.25)",borderRadius:"8px",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"12px",color:"#FF453A",letterSpacing:"0.04em",lineHeight:1.5}}>🔥 {roastText}</span>
          <button onClick={()=>setRoastText(null)} style={{background:"none",border:"none",color:"rgba(255,69,58,0.5)",cursor:"pointer",fontSize:"14px",flexShrink:0}}>✕</button>
        </div>
      )}

      {/* Form */}
      {showForm && (() => {
        const fieldLabel = (label, required) => (
          <span style={{fontSize:"9px",color:t.textFaint,letterSpacing:"0.12em"}}>
            {label}{required && <span style={{color:"#FF453A",marginLeft:"3px"}}>*</span>}
          </span>
        );
        const fieldError = (key) => formErrors[key] ? (
          <div style={{fontSize:"9px",color:"#FF453A",letterSpacing:"0.06em",marginTop:"4px"}}>{formErrors[key]}</div>
        ) : null;
        const errStyle = (key) => formErrors[key] ? { borderColor: "#FF453A" } : {};
        return (
        <div className="form-overlay" style={{margin:isMobile?"0 16px 14px":"0 28px 16px",background:t.surface,border:`1px solid ${t.borderStrong}`,borderRadius:"8px",padding:isMobile?"16px":"20px"}}>
          <div style={{fontSize:"11px",color:"#4A9EFF",letterSpacing:"0.12em",marginBottom:"16px"}}>{editId?"EDIT ROLE":"NEW APPLICATION"}</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px"}}>
            {[
              {key:"company",label:"COMPANY",placeholder:"e.g. Booz Allen",required:true},
              {key:"role",label:"ROLE",placeholder:"e.g. Senior DevOps Engineer",required:true},
              {key:"salary",label:"SALARY RANGE",placeholder:"e.g. $130k–$150k",required:false},
              {key:"location",label:"LOCATION",placeholder:"Remote / Hybrid / Onsite",required:false},
            ].map(({key,label,placeholder,required})=>(
              <div key={key}>
                <div style={{marginBottom:"6px"}}>{fieldLabel(label, required)}</div>
                <input value={form[key]||""} onChange={e=>updateForm(key, e.target.value)} placeholder={placeholder} style={{...inputStyle, ...errStyle(key)}}/>
                {fieldError(key)}
              </div>
            ))}
            <div>
              <div style={{marginBottom:"6px"}}>{fieldLabel("DATE APPLIED", true)}</div>
              <input type="date" value={form.date||""} onChange={e=>updateForm("date", e.target.value)} style={{...inputStyle,colorScheme:isDark?"dark":"light", ...errStyle("date")}}/>
              {fieldError("date")}
            </div>
            <div>
              <div style={{marginBottom:"6px"}}>{fieldLabel("STATUS", true)}</div>
              <select value={form.status||""} onChange={e=>updateForm("status", e.target.value)} style={{...inputStyle,color:STATUS_CONFIG[form.status]?.color||t.text, ...errStyle("status")}}>
                {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              {fieldError("status")}
            </div>
            <div>
              <div style={{marginBottom:"6px"}}>{fieldLabel("SOURCE", true)}</div>
              <select value={form.source||""} onChange={e=>updateForm("source", e.target.value)} style={{...inputStyle, ...errStyle("source")}}>
                {SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              {fieldError("source")}
            </div>
          </div>

          {/* Activity log shown when editing an existing role */}
          {editId !== null && (
            <div style={{marginTop:"20px"}}>
              <div style={{fontSize:"9px",color:t.textFaint,letterSpacing:"0.12em",marginBottom:"10px"}}>ACTIVITY LOG</div>
              <ActivityLog
                entries={form.entries}
                theme={t}
                onAdd={(tag, text) => addEntryToJob(editId, tag, text)}
                onDelete={(entryId) => deleteEntryFromJob(editId, entryId)}
              />
            </div>
          )}

          <div style={{display:"flex",gap:"8px",marginTop:"16px",flexWrap:"wrap"}}>
            <button onClick={handleSubmit} style={{background:"#4A9EFF",color:"#fff",border:"none",borderRadius:"6px",padding:"9px 20px",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",fontWeight:500,letterSpacing:"0.08em",cursor:"pointer"}}>
              {editId?"SAVE CHANGES":"ADD TO PIPELINE"}
            </button>
            <button onClick={cancelForm} style={{background:"transparent",color:t.textFaint,border:`1px solid ${t.borderStrong}`,borderRadius:"6px",padding:"9px 16px",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",cursor:"pointer"}}>DISCARD</button>
            {!editId && Object.keys(formErrors).length > 0 && (
              <span style={{fontSize:"10px",color:"#FF453A",alignSelf:"center",letterSpacing:"0.06em"}}>
                Required: {Object.keys(formErrors).join(", ")}
              </span>
            )}
          </div>
          {!editId && (
            <div style={{fontSize:"10px",color:t.textGhost,marginTop:"12px",letterSpacing:"0.04em",lineHeight:1.5}}>
              💡 Add the role first, then open it from the list to log calls, interviews, and other activity over time.
            </div>
          )}
        </div>
        );
      })()}

      {/* Filters */}
      <div style={{padding:isMobile?"0 16px 12px":"0 28px 12px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
          style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:"6px",padding:"7px 12px",color:t.text,fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",width:isMobile?"100%":"180px",outline:"none"}}/>
        <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
          {["All",...STATUSES].map(s=>(
            <button key={s} className="filter-btn" onClick={()=>setFilterStatus(s)} style={{
              background:filterStatus===s?(s==="All"?t.borderStrong:STATUS_CONFIG[s]?.bg):"transparent",
              color:filterStatus===s?(s==="All"?t.text:STATUS_CONFIG[s]?.color):t.textFaint,
              border:`1px solid ${filterStatus===s?(s==="All"?t.borderStrong:STATUS_CONFIG[s]?.color):t.border}`,
              borderRadius:"4px",padding:"5px 10px",fontSize:"10px",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer",
            }}>{s.toUpperCase()}</button>
          ))}
        </div>
        {view==="table"&&(
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{marginLeft:"auto",background:t.surface,border:`1px solid ${t.border}`,borderRadius:"6px",padding:"7px 10px",color:t.textMuted,fontSize:"10px",fontFamily:"'IBM Plex Mono',monospace",outline:"none",cursor:"pointer"}}>
            <option value="date">SORT: DATE</option>
            <option value="company">SORT: COMPANY</option>
            <option value="status">SORT: STATUS</option>
          </select>
        )}
      </div>

      {/* TABLE / CARD LIST */}
      {view==="table"&&!isMobile&&(
        <div style={{padding:"0 28px 28px"}}>
          <div style={{display:"grid",gridTemplateColumns:"32px 1fr 1.2fr 100px 120px 110px 1fr 80px",padding:"8px 12px",borderBottom:`1px solid ${t.border}`,fontSize:"9px",color:t.textGhost,letterSpacing:"0.12em",alignItems:"center"}}>
            <div><input type="checkbox" checked={filtered.length>0&&selected.size===filtered.length} onChange={toggleSelectAll}/></div>
            <div>COMPANY</div><div>ROLE</div><div>DATE</div><div>STATUS</div><div>SOURCE</div><div>ACTIVITY</div><div></div>
          </div>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px",color:t.emptyText,fontSize:"12px",letterSpacing:"0.1em"}}>NO APPLICATIONS YET — HIT + ADD ROLE</div>}
          {filtered.map((job,i)=>(
            <div key={job.id} className="job-row"
              style={{display:"grid",gridTemplateColumns:"32px 1fr 1.2fr 100px 120px 110px 1fr 80px",padding:"12px 12px",borderBottom:`1px solid ${t.border}`,alignItems:"center",background:selected.has(job.id)?`${STATUS_CONFIG[job.status].bg}`:i%2===0?"transparent":t.rowAlt}}
              onMouseEnter={e=>{ if(!selected.has(job.id)) e.currentTarget.style.background=t.rowHover; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=selected.has(job.id)?`${STATUS_CONFIG[job.status].bg}`:i%2===0?"transparent":t.rowAlt; }}>
              <div onClick={()=>toggleSelect(job.id)} style={{display:"flex",alignItems:"center",cursor:"pointer"}}>
                <input type="checkbox" checked={selected.has(job.id)} onChange={()=>toggleSelect(job.id)} onClick={e=>e.stopPropagation()}/>
              </div>
              <div style={{fontSize:"13px",fontWeight:500,fontFamily:"'IBM Plex Sans',sans-serif",color:t.text}}>
                {job.company}
                {job.salary&&<span style={{display:"block",fontSize:"10px",color:t.textFaint,marginTop:"1px"}}>{job.salary}</span>}
              </div>
              <div style={{fontSize:"11px",color:t.textMuted,paddingRight:"8px"}}>
                {job.role}
                {job.location&&<span style={{display:"block",fontSize:"10px",color:t.textGhost,marginTop:"1px"}}>{job.location}</span>}
              </div>
              <div style={{fontSize:"11px",color:t.textFaint}}>{job.date}</div>
              <div style={{paddingRight:"12px"}}>
                <select className="status-pill" value={job.status} onChange={e=>fireStatus(job.id,e.target.value,e)}
                  style={{background:STATUS_CONFIG[job.status].bg,color:STATUS_CONFIG[job.status].color,border:`1px solid ${STATUS_CONFIG[job.status].color}30`,borderRadius:"4px",padding:"3px 8px",fontSize:"10px",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",fontWeight:500,outline:"none"}}>
                  {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{fontSize:"10px",color:t.textGhost,letterSpacing:"0.06em",paddingLeft:"4px"}}>{job.source.toUpperCase()}</div>
              {(() => {
                const entries = job.entries || [];
                const latest = entries.length > 0
                  ? [...entries].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0]
                  : null;
                const latestTag = latest ? (TAG_BY_ID[latest.tag] || TAG_BY_ID.note) : null;
                return (
                  <div onClick={()=>setNotesJob(job)} style={{fontSize:"11px",color:latest?t.textFaint:t.textGhost,overflow:"hidden",cursor:"pointer"}} title="Open activity log">
                    {latest ? (
                      <span style={{display:"flex",alignItems:"center",gap:"5px",overflow:"hidden"}}>
                        <span style={{flexShrink:0,fontSize:"11px"}}>{latestTag.icon}</span>
                        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:"underline dotted"}}>{latest.text}</span>
                        {entries.length > 1 && <span style={{flexShrink:0,fontSize:"9px",color:t.textGhost,letterSpacing:"0.04em"}}>+{entries.length-1}</span>}
                      </span>
                    ) : (
                      <span style={{textDecoration:"underline dotted"}}>+ Log activity</span>
                    )}
                  </div>
                );
              })()}
              <div style={{display:"flex",gap:"2px",justifyContent:"flex-end"}}>
                <button className="edit-btn" onClick={()=>handleEdit(job)} style={{color:t.textMuted}}>EDIT</button>
                <button className="del-btn" onClick={()=>handleDelete(job.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MOBILE CARD LIST */}
      {view==="table"&&isMobile&&(
        <div style={{padding:"0 16px 28px"}}>
          {filtered.length>0&&(
            <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 4px 10px",fontSize:"10px",color:t.textGhost,letterSpacing:"0.1em"}}>
              <input type="checkbox" checked={selected.size===filtered.length} onChange={toggleSelectAll}/>
              <span>{selected.size>0?`${selected.size} SELECTED`:"SELECT ALL"}</span>
              <span style={{marginLeft:"auto"}}>{filtered.length} {filtered.length===1?"ROLE":"ROLES"}</span>
            </div>
          )}
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 16px",color:t.emptyText,fontSize:"12px",letterSpacing:"0.1em",lineHeight:1.6}}>NO APPLICATIONS YET<br/>TAP + ADD ROLE</div>}
          {filtered.map(job=>{
            const cfg=STATUS_CONFIG[job.status];
            const isSel=selected.has(job.id);
            return (
              <div key={job.id}
                onClick={()=>setNotesJob(job)}
                style={{
                  background:isSel?cfg.bg:t.surface,
                  border:`1px solid ${isSel?cfg.color+"60":t.border}`,
                  borderLeft:`3px solid ${cfg.color}`,
                  borderRadius:"8px",padding:"14px",marginBottom:"10px",
                  cursor:"pointer",WebkitTapHighlightColor:"transparent"
                }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px",marginBottom:"8px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"15px",fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif",color:t.text,lineHeight:1.3}}>{job.company}</div>
                    <div style={{fontSize:"12px",color:t.textMuted,marginTop:"2px",lineHeight:1.4}}>{job.role}</div>
                  </div>
                  <span style={{fontSize:"10px",background:cfg.bg,color:cfg.color,padding:"3px 9px",borderRadius:"4px",letterSpacing:"0.06em",fontWeight:500,whiteSpace:"nowrap",flexShrink:0}}>
                    {job.status}
                  </span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"10px",fontSize:"10px",color:t.textFaint,letterSpacing:"0.04em"}}>
                  <span>{job.date}</span>
                  {job.salary&&<span>· {job.salary}</span>}
                  {job.location&&<span>· {job.location}</span>}
                  {job.source&&<span>· {job.source.toUpperCase()}</span>}
                </div>
                {(() => {
                  const entries = job.entries || [];
                  if (entries.length === 0) return null;
                  const latest = [...entries].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
                  const latestTag = TAG_BY_ID[latest.tag] || TAG_BY_ID.note;
                  return (
                    <div style={{marginTop:"8px",padding:"8px 10px",background:t.inputBg,borderLeft:`2px solid ${latestTag.color}`,borderRadius:"4px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"}}>
                        <span style={{fontSize:"10px"}}>{latestTag.icon}</span>
                        <span style={{fontSize:"9px",color:latestTag.color,letterSpacing:"0.06em",fontWeight:600}}>{latestTag.label.toUpperCase()}</span>
                        <span style={{fontSize:"9px",color:t.textGhost}}>· {formatEntryTime(latest.timestamp)}</span>
                        {entries.length > 1 && <span style={{marginLeft:"auto",fontSize:"9px",color:t.textGhost,letterSpacing:"0.04em"}}>+{entries.length-1} more</span>}
                      </div>
                      <div style={{fontSize:"11px",color:t.textMuted,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                        {latest.text}
                      </div>
                    </div>
                  );
                })()}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"10px",paddingTop:"10px",borderTop:`1px solid ${t.border}`}}>
                  <label onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"10px",color:t.textFaint,letterSpacing:"0.06em",cursor:"pointer"}}>
                    <input type="checkbox" checked={isSel} onChange={()=>toggleSelect(job.id)}/>
                    SELECT
                  </label>
                  <div style={{display:"flex",gap:"6px"}}>
                    <button onClick={e=>{e.stopPropagation();handleEdit(job);}} style={{background:"transparent",border:`1px solid ${t.border}`,borderRadius:"5px",padding:"6px 12px",fontSize:"10px",color:t.textMuted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer"}}>
                      EDIT
                    </button>
                    <button onClick={e=>{e.stopPropagation();setNotesJob(job);}} style={{background:cfg.bg,border:`1px solid ${cfg.color}40`,borderRadius:"5px",padding:"6px 12px",fontSize:"10px",color:cfg.color,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer"}}>
                      + LOG
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN */}
      {view==="kanban"&&(
        <div style={{padding:isMobile?"0 16px 28px":"0 28px 28px",display:"flex",flexDirection:isMobile?"column":"row",gap:"12px",overflowX:isMobile?"visible":"auto",alignItems:"flex-start"}}>
          {STATUSES.map(status=>{
            const colJobs=jobs.filter(j=>j.status===status&&(filterStatus==="All"||filterStatus===status));
            const cfg=STATUS_CONFIG[status]; const isOver=dragOver===status;
            return(
              <div key={status} className="kanban-col"
                onDragOver={e=>handleDragOver(e,status)} onDrop={e=>handleDrop(e,status)}
                style={{flex:isMobile?"1 1 auto":"0 0 220px",width:isMobile?"100%":undefined,minWidth:isMobile?undefined:"220px",background:isOver?cfg.bg:t.surface,border:`1px solid ${isOver?cfg.color:t.border}`,borderRadius:"8px",padding:"12px",minHeight:isMobile?"auto":"300px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                  <span style={{fontSize:"10px",color:cfg.color,letterSpacing:"0.1em",fontWeight:600}}>{status.toUpperCase()}</span>
                  <span style={{fontSize:"11px",color:t.textFaint,background:cfg.bg,borderRadius:"4px",padding:"1px 7px"}}>{colJobs.length}</span>
                </div>
                {colJobs.length===0&&<div style={{fontSize:"10px",color:t.emptyText,textAlign:"center",padding:"20px 0",letterSpacing:"0.06em"}}>DROP HERE</div>}
                {colJobs.map(job=>(
                  <div key={job.id} className="kanban-card" draggable onDragStart={()=>handleDragStart(job)} onDragEnd={()=>{setDragging(null);setDragOver(null);}}
                    style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:"6px",padding:"10px 12px",marginBottom:"8px",userSelect:"none"}}>
                    <div style={{fontSize:"12px",fontWeight:600,color:t.text,fontFamily:"'IBM Plex Sans',sans-serif",marginBottom:"3px"}}>{job.company}</div>
                    <div style={{fontSize:"10px",color:t.textMuted,marginBottom:"4px"}}>{job.role}</div>
                    {job.salary&&<div style={{fontSize:"10px",color:t.textFaint}}>{job.salary}</div>}
                    {job.location&&<div style={{fontSize:"10px",color:t.textFaint}}>{job.location}</div>}
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px",alignItems:"center"}}>
                      <span style={{fontSize:"9px",color:t.textGhost}}>{job.date}</span>
                      <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                        {(job.entries||[]).length>0 && (
                          <span onClick={()=>setNotesJob(job)} style={{fontSize:"9px",color:cfg.color,cursor:"pointer",textDecoration:"underline dotted"}}>
                            log ({(job.entries||[]).length})
                          </span>
                        )}
                        <span onClick={()=>handleEdit(job)} style={{fontSize:"9px",color:t.textFaint,cursor:"pointer"}}>edit</span>
                        <span onClick={()=>handleDelete(job.id)} style={{fontSize:"9px",color:"#FF453A",cursor:"pointer"}}>✕</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Notes / Edit Sheet */}
      {notesJob&&(
        <div className="modal-overlay" style={{background:t.overlay,alignItems:isMobile?"flex-end":"center"}} onClick={()=>setNotesJob(null)}>
          <div className="modal-box" style={{background:t.surface,border:`1px solid ${t.borderStrong}`,borderRadius:isMobile?"14px 14px 0 0":"10px",padding:isMobile?"20px 18px 28px":"24px",width:isMobile?"100%":undefined,maxWidth:isMobile?"100%":"520px",maxHeight:isMobile?"90vh":"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            {isMobile&&<div style={{width:"40px",height:"4px",background:t.borderStrong,borderRadius:"2px",margin:"-4px auto 14px"}}/>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px",gap:"12px"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"17px",fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif",color:t.text,lineHeight:1.3}}>{notesJob.company}</div>
                <div style={{fontSize:"12px",color:t.textMuted,marginTop:"3px",lineHeight:1.4}}>{notesJob.role}</div>
                <div style={{fontSize:"10px",color:t.textGhost,marginTop:"6px",letterSpacing:"0.04em"}}>Applied {notesJob.date}</div>
              </div>
              <button onClick={()=>setNotesJob(null)} style={{background:"none",border:"none",color:t.textFaint,cursor:"pointer",fontSize:"22px",lineHeight:1,padding:"0 4px"}}>✕</button>
            </div>

            {/* Quick edit row: STATUS + SOURCE */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
              <div>
                <div style={{fontSize:"9px",color:t.textFaint,letterSpacing:"0.12em",marginBottom:"5px"}}>STATUS</div>
                <select value={notesJob.status} onChange={e=>{
                  const updated={...notesJob,status:e.target.value};
                  setNotesJob(updated);
                  setJobs(jobs.map(j=>j.id===notesJob.id?updated:j));
                  if(soundOn) playSound(e.target.value);
                }} style={{...inputStyle,color:STATUS_CONFIG[notesJob.status]?.color||t.text,fontWeight:500}}>
                  {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:"9px",color:t.textFaint,letterSpacing:"0.12em",marginBottom:"5px"}}>SOURCE</div>
                <select value={notesJob.source} onChange={e=>{
                  const updated={...notesJob,source:e.target.value};
                  setNotesJob(updated);
                  setJobs(jobs.map(j=>j.id===notesJob.id?updated:j));
                }} style={inputStyle}>
                  {SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:"9px",color:t.textFaint,letterSpacing:"0.12em",marginBottom:"5px"}}>SALARY</div>
                <input value={notesJob.salary||""} placeholder="e.g. $150k" onChange={e=>{
                  const updated={...notesJob,salary:e.target.value};
                  setNotesJob(updated);
                  setJobs(jobs.map(j=>j.id===notesJob.id?updated:j));
                }} style={inputStyle}/>
              </div>
              <div>
                <div style={{fontSize:"9px",color:t.textFaint,letterSpacing:"0.12em",marginBottom:"5px"}}>LOCATION</div>
                <input value={notesJob.location||""} placeholder="Remote / Hybrid / Onsite" onChange={e=>{
                  const updated={...notesJob,location:e.target.value};
                  setNotesJob(updated);
                  setJobs(jobs.map(j=>j.id===notesJob.id?updated:j));
                }} style={inputStyle}/>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
              <div style={{fontSize:"9px",color:t.textFaint,letterSpacing:"0.12em"}}>ACTIVITY LOG</div>
              {(notesJob.entries||[]).length > 0 && (
                <div style={{fontSize:"9px",color:t.textGhost,letterSpacing:"0.06em"}}>{(notesJob.entries||[]).length} {(notesJob.entries||[]).length===1?"entry":"entries"}</div>
              )}
            </div>
            <ActivityLog
              entries={notesJob.entries}
              theme={t}
              compact={isMobile}
              onAdd={(tag, text) => addEntryToJob(notesJob.id, tag, text)}
              onDelete={(entryId) => deleteEntryFromJob(notesJob.id, entryId)}
            />

            <div style={{display:"flex",gap:"8px",marginTop:"16px",flexWrap:"wrap"}}>
              <button onClick={()=>{setNotesJob(null);handleEdit(notesJob);}}
                style={{flex:"1 1 auto",background:"#4A9EFF",color:"#fff",border:"none",borderRadius:"6px",padding:"11px 16px",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",fontWeight:500,letterSpacing:"0.06em",cursor:"pointer"}}>
                EDIT ALL FIELDS
              </button>
              <button onClick={()=>{
                if(window.confirm(`Delete ${notesJob.company} – ${notesJob.role}?`)){
                  handleDelete(notesJob.id);
                  setNotesJob(null);
                }
              }}
                style={{background:"rgba(255,69,58,0.1)",border:"1px solid rgba(255,69,58,0.3)",borderRadius:"6px",padding:"11px 14px",fontSize:"11px",color:"#FF453A",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer"}}>
                🗑 DELETE
              </button>
            </div>
            <div style={{fontSize:"9px",color:t.textGhost,marginTop:"10px",textAlign:"center",letterSpacing:"0.06em"}}>Changes save automatically</div>
          </div>
        </div>
      )}

      {/* Motivation Modal */}
      {motivationModal&&(
        <div className="modal-overlay" style={{background:"rgba(0,0,0,0.7)"}} onClick={()=>setMotivationModal(null)}>
          <div className="motiv-box" style={{background:"linear-gradient(135deg,#0d1117,#0a0f1e)",border:"1px solid rgba(74,158,255,0.25)",borderRadius:"12px",padding:"36px 32px",textAlign:"center",position:"relative"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"28px",marginBottom:"20px"}}>✦</div>
            <div style={{fontSize:"16px",color:"#E5E5EA",fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:300,lineHeight:1.7,letterSpacing:"0.01em",marginBottom:"20px"}}>
              "{motivationModal.text}"
            </div>
            <div style={{fontSize:"10px",color:"#4A9EFF",letterSpacing:"0.15em"}}>— {motivationModal.author}</div>
            <div style={{marginTop:"24px",display:"flex",gap:"10px",justifyContent:"center"}}>
              <button onClick={handleMotivate}
                style={{background:"rgba(74,158,255,0.1)",border:"1px solid rgba(74,158,255,0.3)",borderRadius:"6px",padding:"8px 18px",fontSize:"11px",color:"#4A9EFF",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer"}}>
                ANOTHER ONE
              </button>
              <button onClick={()=>setMotivationModal(null)}
                style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",padding:"8px 18px",fontSize:"11px",color:"#4A4A5A",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer"}}>
                CLOSE
              </button>
            </div>
            <button onClick={()=>setMotivationModal(null)} style={{position:"absolute",top:"14px",right:"16px",background:"none",border:"none",color:"rgba(255,255,255,0.2)",cursor:"pointer",fontSize:"16px"}}>✕</button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="bulk-bar" style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:isDark?"#1C1C2A":"#FFFFFF",border:`1px solid ${t.borderStrong}`,borderRadius:"10px",padding:"10px 16px",display:"flex",alignItems:"center",gap:"12px",zIndex:5000,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",whiteSpace:"nowrap"}}>
          <span style={{fontSize:"11px",color:t.textMuted,fontFamily:"'IBM Plex Mono',monospace"}}>{selected.size} selected</span>
          <div style={{width:"1px",height:"16px",background:t.border}}/>
          <button onClick={deleteSelected}
            style={{background:"rgba(255,69,58,0.1)",border:"1px solid rgba(255,69,58,0.3)",borderRadius:"6px",padding:"6px 14px",fontSize:"11px",color:"#FF453A",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.04em",cursor:"pointer"}}>
            🗑 Delete Selected
          </button>
          <button onClick={()=>setConfirmClearAll(true)}
            style={{background:"transparent",border:`1px solid ${t.border}`,borderRadius:"6px",padding:"6px 14px",fontSize:"11px",color:t.textFaint,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.04em",cursor:"pointer"}}>
            Clear All
          </button>
          <button onClick={()=>setSelected(new Set())}
            style={{background:"transparent",border:"none",color:t.textGhost,cursor:"pointer",fontSize:"14px",padding:"2px 4px"}}>✕</button>
        </div>
      )}

      {/* Confirm Clear All */}
      {confirmClearAll && (
        <div className="modal-overlay" style={{background:t.overlay}} onClick={()=>setConfirmClearAll(false)}>
          <div style={{background:t.surface,border:`1px solid ${t.borderStrong}`,borderRadius:"10px",padding:"28px",maxWidth:"380px",width:"90%",animation:"fadeIn 0.2s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:"15px",fontWeight:600,fontFamily:"'IBM Plex Sans',sans-serif",color:t.text,marginBottom:"8px"}}>Clear entire pipeline?</div>
            <div style={{fontSize:"12px",color:t.textMuted,marginBottom:"24px",lineHeight:1.6}}>This removes all {jobs.length} application{jobs.length!==1?"s":""} permanently. Export to CSV first if you want a backup.</div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={clearAll}
                style={{background:"#FF453A",color:"#fff",border:"none",borderRadius:"6px",padding:"9px 20px",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",fontWeight:500,cursor:"pointer",letterSpacing:"0.04em"}}>
                YES, CLEAR ALL
              </button>
              <button onClick={()=>setConfirmClearAll(false)}
                style={{background:"transparent",color:t.textFaint,border:`1px solid ${t.borderStrong}`,borderRadius:"6px",padding:"9px 16px",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",cursor:"pointer"}}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
