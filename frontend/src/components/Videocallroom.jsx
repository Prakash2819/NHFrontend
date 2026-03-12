import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  MessageSquare, X, Clock, AlertTriangle,
  Calendar, User, Send, Camera
} from 'lucide-react';

// ─── Time gate helpers ────────────────────────────────────────────────────────
function parseApptMinutes(t) {
  if (!t) return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let [, h, min, mer] = m; h = +h; min = +min;
  if (mer.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (mer.toUpperCase() === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}
function localToday() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}
export function getCallStatus(appt) {
  if (!appt) return { canJoin: false, reason: 'No appointment' };
  if (appt.type !== 'video') return { canJoin: false, reason: 'Not a video appointment' };
  if (appt.status !== 'confirmed') return { canJoin: false, reason: 'Appointment not confirmed yet' };
  const today = localToday();
  if (appt.date < today) return { canJoin: false, reason: 'This appointment was in the past', isPast: true };
  if (appt.date > today) {
    const [y, mo, d] = appt.date.split('-').map(Number);
    const td = new Date(); td.setHours(0, 0, 0, 0);
    const days = Math.ceil((new Date(y, mo - 1, d) - td) / 86400000);
    return { canJoin: false, reason: `Appointment is in ${days} day${days !== 1 ? 's' : ''}`, isFuture: true, daysAway: days };
  }
  const apptMin = parseApptMinutes(appt.time);
  if (apptMin === null) return { canJoin: true, reason: '' };
  const n = new Date(), nowMin = n.getHours() * 60 + n.getMinutes();
  if (nowMin < apptMin - 15) {
    const ml = apptMin - 15 - nowMin;
    return { canJoin: false, reason: `Call opens in ${ml >= 60 ? `${Math.floor(ml / 60)}h ${ml % 60}m` : `${ml} min`}`, isTooEarly: true, minutesUntil: ml };
  }
  if (nowMin > apptMin + 60) return { canJoin: false, reason: 'Call window expired (>60 min past scheduled time)', isExpired: true };
  return { canJoin: true, reason: '' };
}

// ─── Blocked Screen ───────────────────────────────────────────────────────────
function CallBlockedScreen({ appt, onClose, role }) {
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 30000); return () => clearInterval(t); }, []);
  const cs = getCallStatus(appt);
  const fmtDate = () => { const [y, mo, d] = appt.date.split('-').map(Number); return new Date(y, mo - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }); };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 font-bold text-sm">Video Consultation</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-8 text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${cs.isExpired ? 'bg-red-50' : cs.isFuture ? 'bg-blue-50' : 'bg-amber-50'}`}>
            {cs.isExpired ? <AlertTriangle className="w-8 h-8 text-red-500" /> : cs.isFuture ? <Calendar className="w-8 h-8 text-blue-500" /> : <Clock className="w-8 h-8 text-amber-500" />}
          </div>
          <h3 className={`text-lg font-bold mb-2 ${cs.isExpired ? 'text-red-600' : cs.isFuture ? 'text-blue-700' : 'text-gray-900'}`}>
            {cs.isExpired ? 'Call Window Expired' : cs.isFuture ? 'Appointment Not Yet' : cs.isTooEarly ? 'Too Early to Join' : 'Cannot Join Call'}
          </h3>
          <p className="text-sm text-gray-400 mb-5">{cs.reason}</p>
          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2.5 mb-5 border border-gray-100">
            <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-300" /><span className="font-semibold text-gray-700">{role === 'doctor' ? appt.patientName : appt.doctorName}</span></div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-gray-300" /><span className="text-gray-500">{fmtDate()}</span></div>
            <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-gray-300" /><span className="text-gray-500">{appt.time}</span><span className="text-xs text-gray-300 ml-1">(opens 15 min before)</span></div>
          </div>
          {cs.isTooEarly && <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-2 mb-4 border border-amber-100">Opening in {cs.minutesUntil <= 1 ? 'less than a minute' : `about ${cs.minutesUntil} min`}</p>}
          <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Permission Screen ────────────────────────────────────────────────────────
function PermissionScreen({ appt, role, onGranted, onClose }) {
  const [state, setState] = useState('requesting');
  const [errMsg, setErrMsg] = useState('');

  const request = useCallback(async () => {
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      setState('granted');
      setTimeout(onGranted, 500);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') setState('denied');
      else if (err.name === 'NotFoundError') { setErrMsg('No camera or microphone found.'); setState('error'); }
      else if (err.name === 'NotReadableError') { setErrMsg('Camera/mic is in use by another app.'); setState('error'); }
      else { setErrMsg(`Device error: ${err.message}`); setState('error'); }
    }
  }, [onGranted]);

  useEffect(() => { request(); }, [request]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 font-bold text-sm">Video Consultation</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-8">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl mb-6 border border-blue-100">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{role === 'doctor' ? appt.patientName : appt.doctorName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{appt.time} · Video Consultation</p>
            </div>
          </div>
          {state === 'requesting' && (
            <div className="text-center">
              <div className="flex justify-center gap-4 mb-6">
                {[{ Icon: Mic, label: 'Mic' }, { Icon: Camera, label: 'Camera' }].map(({ Icon, label }) => (
                  <div key={label} className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-blue-200 bg-blue-50">
                    <Icon className="w-7 h-7 text-blue-500" /><span className="text-xs font-semibold text-blue-400">{label}</span>
                  </div>
                ))}
              </div>
              <div className="w-7 h-7 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-bold text-gray-900 mb-1">Waiting for permission…</p>
              <p className="text-sm text-gray-400 mb-3">Click <strong className="text-gray-700">"Allow"</strong> in the browser popup.</p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-600 font-medium">Check for a popup near your browser's address bar</p>
              </div>
            </div>
          )}
          {state === 'granted' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="font-bold text-gray-900 mb-1">Permissions Granted!</p>
              <p className="text-sm text-gray-400">Starting your call…</p>
            </div>
          )}
          {state === 'denied' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100"><AlertTriangle className="w-8 h-8 text-red-400" /></div>
              <p className="font-bold text-red-600 mb-2">Permission Denied</p>
              <ol className="text-left text-sm text-gray-500 space-y-2 mb-5 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <li>1. Click the <strong className="text-gray-700">lock icon</strong> in your browser address bar</li>
                <li>2. Set <strong className="text-gray-700">Camera</strong> and <strong className="text-gray-700">Microphone</strong> to <strong className="text-gray-700">"Allow"</strong></li>
                <li>3. Refresh and try again</li>
              </ol>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={request} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors">Try Again</button>
              </div>
            </div>
          )}
          {state === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100"><AlertTriangle className="w-8 h-8 text-orange-400" /></div>
              <p className="font-bold text-gray-900 mb-2">Device Error</p>
              <p className="text-sm text-gray-400 mb-5">{errMsg}</p>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={request} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors">Retry</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Avatar tile ──────────────────────────────────────────────────────────────
function AvatarTile({ name = '', size = 'lg' }) {
  const ini = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500'];
  let sum = 0; for (const c of name) sum += c.charCodeAt(0);
  const bg = colors[sum % colors.length];
  const sz = size === 'lg' ? 'w-24 h-24 text-3xl' : size === 'md' ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-base';
  return <div className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-bold select-none`}>{ini || '?'}</div>;
}

// ─── Chat panel ───────────────────────────────────────────────────────────────
function ChatPanel({ messages, myName, onSend, onClose }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-gray-900 text-sm">Chat</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-300 font-medium">No messages yet</p>
            <p className="text-xs text-gray-300 mt-0.5">Say hello!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender === myName;
          return (
            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && <span className="text-xs text-gray-400 font-medium px-1">{msg.sender}</span>}
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-300 px-1">{msg.time}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-300"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-1.5">Press Enter to send</p>
      </div>
    </div>
  );
}

// ─── Control Button ───────────────────────────────────────────────────────────
function CtrlBtn({ onClick, Icon, IconOff, isOff, label, danger, badge }) {
  const Ic = isOff && IconOff ? IconOff : Icon;
  return (
    <button onClick={onClick} title={label} className="flex flex-col items-center gap-1.5 group relative">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm
        ${danger
          ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
          : isOff
            ? 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            : 'bg-white/90 hover:bg-white backdrop-blur-sm border border-white/20'}`}>
        <Ic className={`w-5 h-5 ${danger ? 'text-white' : isOff ? 'text-white' : 'text-gray-700'}`} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{badge}</span>
        )}
      </div>
      <span className={`text-[10px] font-semibold drop-shadow transition-colors ${danger ? 'text-red-300' : 'text-white/80 group-hover:text-white'}`}>{label}</span>
    </button>
  );
}

// ─── Main VideoCallRoom ───────────────────────────────────────────────────────
export function VideoCallRoom({ appt, role = 'patient', onClose }) {
  const localMainRef   = useRef(null);  // main tile local video
  const localPipRef    = useRef(null);  // pip tile local video
  const remoteMainRef  = useRef(null);  // main tile remote video
  const remotePipRef   = useRef(null);  // pip tile remote video
  const pcRef          = useRef(null);
  const socketRef      = useRef(null);
  const localStreamRef = useRef(null);

  const [phase,       setPhase]       = useState('permissions');
  const [status,      setStatus]      = useState('waiting');
  const [audioOn,     setAudioOn]     = useState(true);
  const [videoOn,     setVideoOn]     = useState(true);
  const [remoteAudio, setRemoteAudio] = useState(true);
  const [remoteVideo, setRemoteVideo] = useState(true);
  const [peerName,    setPeerName]    = useState('');
  const [peerJoined,  setPeerJoined]  = useState(false);
  const [callTime,    setCallTime]    = useState(0);
  const [pinned,      setPinned]      = useState('remote');
  const [error,       setError]       = useState('');
  const [showChat,    setShowChat]    = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [unread,      setUnread]      = useState(0);
  const [remoteStream,setRemoteStream] = useState(null);  // stored so useEffect can assign to refs

  const callStatus = getCallStatus(appt);
  const roomId     = `room_${appt._id}`;
  const myName     = role === 'doctor'
    ? (localStorage.getItem('doctorName') || 'Doctor')
    : (localStorage.getItem('patientName') || 'Patient');


  // Assign remote stream to BOTH remote video refs whenever it arrives or pinned swaps.
  // Using state (remoteStream) guarantees this runs AFTER React re-renders the video elements.
  useEffect(() => {
    if (remoteStream) {
      if (remoteMainRef.current) remoteMainRef.current.srcObject = remoteStream;
      if (remotePipRef.current)  remotePipRef.current.srcObject  = remoteStream;
    }
  }, [remoteStream, pinned]);

  // Re-sync local stream when pinned swaps (new local video element mounts)
  useEffect(() => {
    const local = localStreamRef.current;
    if (local) {
      if (localMainRef.current && !localMainRef.current.srcObject) localMainRef.current.srcObject = local;
      if (localPipRef.current  && !localPipRef.current.srcObject)  localPipRef.current.srcObject  = local;
    }
  }, [pinned]);

  useEffect(() => {
    if (status !== 'connected') return;
    const t = setInterval(() => setCallTime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const fmtTime = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Track unread messages when chat is closed
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!showChat && last.sender !== myName) {
      setUnread(u => u + 1);
    }
  }, [messages, showChat, myName]);

  const openChat = () => { setShowChat(true); setUnread(0); };

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const endCall = useCallback(() => {
    socketRef.current?.emit('leave-room', { roomId });
    cleanup();
    setPhase('ended');
  }, [roomId, cleanup]);

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioOn(track.enabled);
    socketRef.current?.emit('media-state', { roomId, audio: track.enabled, video: videoOn });
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoOn(track.enabled);
    socketRef.current?.emit('media-state', { roomId, audio: audioOn, video: track.enabled });
  };

  const sendMessage = useCallback((text) => {
    if (!socketRef.current) return;
    const msg = {
      sender: myName,
      text,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    // Emit to server — server broadcasts to others in room
    socketRef.current.emit('chat-message', { roomId, ...msg });
    // Add to own list immediately (optimistic)
    setMessages(prev => [...prev, msg]);
  }, [roomId, myName]);

  const startCall = useCallback(async () => {
    setPhase('call');
    setStatus('waiting');

    let stream;
    try {
      // Try full video + audio first
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.warn('[Media] video+audio failed:', err.name, '— trying audio only');
      try {
        // Camera busy (e.g. another tab) — fall back to audio only
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        console.info('[Media] Using audio-only stream (camera unavailable)');
      } catch (err2) {
        console.warn('[Media] audio also failed:', err2.name, '— using silent stream');
        // Last resort: silent fake stream so WebRTC signaling still works
        const ctx = new AudioContext();
        const dest = ctx.crpZEAWYtiB6bJ16NuLbGCc6CZ6jJdKfb63();
        stream = dest.stream;
      }
    }
    localStreamRef.current = stream;
    // Assign to both local video elements
    if (localMainRef.current)  localMainRef.current.srcObject  = stream;
    if (localPipRef.current)   localPipRef.current.srcObject   = stream;

    const loadSocket = () => new Promise((res, rej) => {
      if (window.io) { res(); return; }
      const s = document.createElement('script');
      s.src = 'https://nhbackend.onrender.com/socket.io/socket.io.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });

    try { await loadSocket(); }
    catch { setError('Cannot connect to signaling server.'); return; }

    const socket = window.io('https://nhbackend.onrender.com', { transports: ['websocket'] });
    socketRef.current = socket;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    });
    pcRef.current = pc;

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      if (e.streams[0]) {
        // Store in state so useEffect can reliably assign to whichever
        // video elements are currently mounted (avoids ref timing race)
        setRemoteStream(e.streams[0]);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('ice-candidate', { roomId, candidate: e.candidate });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setStatus('connected');
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setStatus('waiting'); setPeerJoined(false);
      }
    };

    socket.on('connect', () => {
      socket.emit('join-room', { roomId, role, displayName: myName });
    });

    // peer-joined fires on whoever was ALREADY in the room when the 2nd person joins.
    // That person (regardless of role) must create the offer.
    socket.on('peer-joined', async ({ displayName: pName }) => {
      setPeerName(pName); setPeerJoined(true); setStatus('connecting');
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
      } catch (err) {
        console.error('[WebRTC] createOffer failed:', err);
      }
    });

    socket.on('offer', async ({ offer }) => {
      setStatus('connecting');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId, answer });
    });

    socket.on('answer', async ({ answer }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { console.warn('[ICE]', e); }
    });

    socket.on('peer-media-state', ({ audio, video }) => {
      setRemoteAudio(audio); setRemoteVideo(video);
    });

    // Incoming chat from the OTHER side
    socket.on('chat-message', ({ sender, text, time }) => {
      if (sender === myName) return; // skip echo of own messages
      setMessages(prev => [...prev, { sender, text, time }]);
    });

    socket.on('peer-left', () => {
      setPeerJoined(false); setStatus('waiting');
      setRemoteStream(null);
      if (remoteMainRef.current) remoteMainRef.current.srcObject = null;
      if (remotePipRef.current)  remotePipRef.current.srcObject  = null;
    });
  }, [roomId, role, myName]);

  useEffect(() => () => cleanup(), [cleanup]);

  if (!callStatus.canJoin) return <CallBlockedScreen appt={appt} onClose={onClose} role={role} />;
  if (phase === 'permissions') return <PermissionScreen appt={appt} role={role} onGranted={startCall} onClose={onClose} />;

  if (phase === 'ended') return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <PhoneOff className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Call Ended</h3>
        {callTime > 0 && <p className="text-sm text-gray-400 mb-1">Duration: {fmtTime(callTime)}</p>}
        <p className="text-sm text-gray-400 mb-6">Your video consultation has ended.</p>
        <button onClick={onClose} className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors">Close</button>
      </div>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Error</h3>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Close</button>
          <button onClick={() => { setError(''); setPhase('permissions'); }} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      </div>
    </div>
  );

  const remoteName  = peerName || (role === 'doctor' ? appt.patientName : appt.doctorName);
  const isConnected = status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-900">

      {/* ── Video area (full height, shrinks when chat is open) ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Main tile */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          {pinned === 'remote' ? (
            <>
              <video ref={remoteMainRef} autoPlay playsInline
                className={`w-full h-full object-cover ${!remoteVideo || !peerJoined ? 'hidden' : ''}`} />
              {(!peerJoined || !remoteVideo) && (
                <div className="flex flex-col items-center gap-4">
                  <AvatarTile name={remoteName} size="lg" />
                  <p className="text-white text-lg font-semibold">{remoteName}</p>
                  {!peerJoined
                    ? <p className="text-gray-400 text-sm">Waiting to join…</p>
                    : <div className="flex items-center gap-2"><VideoOff className="w-4 h-4 text-gray-400" /><span className="text-gray-400 text-sm">Camera off</span></div>
                  }
                  {!peerJoined && (
                    <div className="flex gap-1.5 mt-1">
                      {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <video ref={localMainRef} autoPlay playsInline muted
                className={`w-full h-full object-cover ${!videoOn ? 'hidden' : ''}`} />
              {!videoOn && (
                <div className="flex flex-col items-center gap-4">
                  <AvatarTile name={myName} size="lg" />
                  <p className="text-white text-lg font-semibold">{myName} (You)</p>
                  <div className="flex items-center gap-2"><VideoOff className="w-4 h-4 text-gray-400" /><span className="text-gray-400 text-sm">Camera off</span></div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Top bar — transparent gradient overlay ── */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`} />
            <span className="text-white text-sm font-semibold drop-shadow">
              {isConnected ? fmtTime(callTime) : status === 'connecting' ? 'Connecting…' : 'Waiting for participant…'}
            </span>
          </div>
          <div className="bg-black/30 backdrop-blur-sm px-3 py-1 rounded-xl">
            <span className="text-white text-xs font-medium">{appt.time}</span>
          </div>
        </div>

        {/* Remote muted badge */}
        {peerJoined && !remoteAudio && pinned === 'remote' && (
          <div className="absolute top-14 left-4 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-xl">
            <MicOff className="w-3.5 h-3.5 text-red-400" /><span className="text-white text-xs">{remoteName} muted</span>
          </div>
        )}

        {/* PiP tile */}
        <div
          onClick={() => setPinned(p => p === 'remote' ? 'local' : 'remote')}
          className="absolute bottom-28 right-4 w-36 h-24 rounded-2xl overflow-hidden border-2 border-white/20 cursor-pointer shadow-xl hover:border-white/50 transition-all group"
          style={{ zIndex: 5 }}
        >
          {pinned === 'remote' ? (
            <>
              <video ref={localPipRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!videoOn ? 'hidden' : ''}`} />
              {!videoOn && <div className="w-full h-full bg-gray-700 flex items-center justify-center"><AvatarTile name={myName} size="sm" /></div>}
              <div className="absolute bottom-1.5 left-2"><span className="text-white text-xs font-semibold drop-shadow">You</span></div>
            </>
          ) : (
            <>
              <video ref={remotePipRef} autoPlay playsInline className={`w-full h-full object-cover ${!remoteVideo || !peerJoined ? 'hidden' : ''}`} />
              {(!peerJoined || !remoteVideo) && <div className="w-full h-full bg-gray-700 flex items-center justify-center"><AvatarTile name={remoteName} size="sm" /></div>}
              <div className="absolute bottom-1.5 left-2"><span className="text-white text-xs font-semibold drop-shadow">{remoteName}</span></div>
            </>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <span className="text-white text-xs font-bold bg-black/50 px-2 py-0.5 rounded-lg">Swap</span>
          </div>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-28 left-4 pointer-events-none" style={{ zIndex: 5 }}>
          <div className="bg-black/35 backdrop-blur-sm px-3 py-1.5 rounded-xl">
            <span className="text-white text-sm font-medium">
              {pinned === 'remote' ? remoteName : `${myName} (You)`}
            </span>
            {pinned === 'remote' && !remoteAudio && peerJoined && (
              <MicOff className="w-3.5 h-3.5 text-red-400 inline ml-1.5" />
            )}
          </div>
        </div>

        {/* ── Bottom controls — transparent gradient overlay on the video ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-5 pb-6 pt-16"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.50) 0%, transparent 100%)' }}
        >
          <CtrlBtn onClick={toggleAudio} Icon={Mic} IconOff={MicOff} isOff={!audioOn} label={audioOn ? 'Mute' : 'Unmute'} />
          <CtrlBtn onClick={toggleVideo} Icon={Video} IconOff={VideoOff} isOff={!videoOn} label={videoOn ? 'Stop Video' : 'Start Video'} />

          {/* End call */}
          <button onClick={endCall} title="End call" className="flex flex-col items-center gap-1.5 group">
            <div className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40 transition-all active:scale-95">
              <PhoneOff className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-red-300 group-hover:text-red-200 drop-shadow">End Call</span>
          </button>

          <CtrlBtn
            onClick={openChat}
            Icon={MessageSquare}
            isOff={false}
            label="Chat"
            badge={!showChat ? unread : 0}
          />
        </div>
      </div>

      {/* ── Chat sidebar ── */}
      {showChat && (
        <div className="w-80 border-l border-white/10 flex flex-col bg-white shadow-2xl shrink-0">
          <ChatPanel
            messages={messages}
            myName={myName}
            onSend={sendMessage}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
}