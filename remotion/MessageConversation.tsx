import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Message { id: number; text: string; sent: boolean; time: string; }
interface MessageConversationProps {
  messages: Message[];
  typingBeforeIndices?: number[];
  /** Name shown in the navigation header (receiver / contact). */
  contactName?: string;
  /** Battery level 0-100 for status bar icon (defaults to 100). */
  batteryLevel?: number;
}

// CONFIG
const GAP_SECONDS = 2; // base gap inserted after each message (before next starts)
const TYPING_DURATION = 1.2; // total lead time allocated for an incoming typing bubble (indicator length + gap before bubble pops to message)
const TYPING_GAP = 0.15; // gap between typing indicator end and bubble appear
const DELIVERED_DELAY = 0.6; // seconds after last outgoing message finishes typing
// Keyboard + typing effect configuration
const KEYBOARD_HEIGHT = 300; 
const KEYBOARD_LEAD = 0.8; // seconds keyboard appears before first outgoing message typing begins
const KEYBOARD_TRAIL = 0.3; // seconds keyboard stays after last outgoing finishes
const TYPE_SPEED = 14; // characters per second (sender typing speed)

const fontStack = 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const MessageBubble: React.FC<{ msg: Message; appearSec: number; first: boolean; last: boolean; typingDuration?: number; }>= ({ msg, appearSec, first, last, typingDuration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appearFrame = Math.round(appearSec * fps);
  if (frame < appearFrame) return null;
  const progress = spring({ frame: frame - appearFrame, fps, config:{ damping: 12, mass:0.9, stiffness:170 } });
  const translateY = interpolate(progress, [0,1],[24,0]);
  const scale = interpolate(progress, [0,1],[0.8,1]);
  // Live typing effect for sent (outgoing) messages using provided typingDuration
  let displayText = msg.text;
  if (msg.sent && typingDuration && typingDuration > 0) {
    const secondsSince = (frame - appearFrame) / fps;
    const charsTyped = interpolate(secondsSince, [0, typingDuration], [0, msg.text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    displayText = msg.text.slice(0, Math.floor(charsTyped));
  }
  const bubbleStyle: React.CSSProperties = {
    maxWidth: '78%',
    padding: '8px 14px',
    backgroundColor: msg.sent ? '#007AFF' : '#E5E5EA',
    color: msg.sent ? '#fff' : '#000',
    fontSize: 17,
    lineHeight: 1.25,
    fontFamily: fontStack,
    wordWrap: 'break-word',
    borderTopLeftRadius: msg.sent ? 18 : (first ? 18 : 6),
    borderTopRightRadius: msg.sent ? (first ? 18 : 6) : 18,
    borderBottomLeftRadius: msg.sent ? 18 : (last ? 18 : 6),
    borderBottomRightRadius: msg.sent ? (last ? 18 : 6) : 18,
    boxShadow: msg.sent ? '0 1px 1px rgba(0,0,0,.25)' : '0 1px 1px rgba(0,0,0,.15)',
    letterSpacing: -0.2,
  };
  return (
    <div style={{ display:'flex', justifyContent: msg.sent ? 'flex-end':'flex-start', marginBottom:6, transform:`translateY(${translateY}px) scale(${scale})`, opacity: progress }}>
  <div style={bubbleStyle}>{displayText}</div>
    </div>
  );
};

const TypingBubble: React.FC<{ startSec: number; endSec: number; sent: boolean }> = ({ startSec, endSec, sent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(startSec * fps);
  const endFrame = Math.round(endSec * fps);
  if (frame < startFrame || frame > endFrame) return null;
  const local = frame - startFrame;
  const progress = spring({ frame: local, fps, config:{ damping:14, mass:0.8, stiffness:140 } });
  const translateY = interpolate(progress, [0,1],[15,0]);
  const dot = (i: number) => {
    const cycle = (local + i * 6) % 45;
    const scale = interpolate(cycle, [0,15,30,45],[0.4,1,0.4,0.4]);
    return <div key={i} style={{ width:6, height:6, borderRadius:3, background: sent? '#fff':'#6E6E73', transform:`scale(${scale})`, transition:'transform 0.15s linear' }} />;
  };
  return (
    <div style={{ display:'flex', justifyContent: sent? 'flex-end':'flex-start', marginBottom:6, transform:`translateY(${translateY}px)`, opacity:progress }}>
      <div style={{ display:'flex', gap:6, background: sent? '#007AFF':'#E5E5EA', padding:'8px 14px', borderRadius:18 }}>
        {[0,1,2].map(dot)}
      </div>
    </div>
  );
};

const Keyboard: React.FC<{ startSec: number; endSec?: number }> = ({ startSec, endSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(startSec * fps);
  const endFrame = endSec != null ? Math.round(endSec * fps) : undefined;
  if (frame < startFrame) return null;
  if (endFrame !== undefined && frame > endFrame) return null;

  const appearFrames = 12; // frames for slide in
  const disappearFrames = 12; // frames for slide out
  const sinceStart = frame - startFrame;
  const untilEnd = endFrame !== undefined ? endFrame - frame : Infinity;

  const appearProgress = spring({ frame: sinceStart, fps, config:{ damping:16, mass:1, stiffness:180 } });
  const slideIn = interpolate(appearProgress, [0,1],[KEYBOARD_HEIGHT,0]);
  let translateY = slideIn;
  let opacity = appearProgress;

  if (endFrame !== undefined && untilEnd <= disappearFrames) {
    // animate out
    const outProgress = 1 - untilEnd / disappearFrames; // 0 -> 1
    const eased = spring({ frame: Math.round(outProgress * disappearFrames), fps, config:{ damping:18, mass:0.9, stiffness:140 } });
    const slideOut = interpolate(eased, [0,1],[0, KEYBOARD_HEIGHT]);
    translateY = slideOut;
    opacity = 1 - eased * 0.4; // slight fade
  }
  const keyRows = [ ['Q','W','E','R','T','Y','U','I','O','P'], ['A','S','D','F','G','H','J','K','L'], ['⇧','Z','X','C','V','B','N','M','⌫'], ['123','😀','space','return'] ];
  const renderKey = (k: string) => {
    const isSpace = k==='space';
    return <div key={k} style={{ flex:isSpace?4:1, background:'#fff', borderRadius:6, padding:'10px 6px', textAlign:'center', fontSize:14, fontWeight:500, boxShadow:'0 1px 0 rgba(0,0,0,0.25)', margin:'0 3px' }}>{isSpace? '': k}</div>;
  };
  return (
    <div style={{ position:'absolute', left:0, right:0, bottom:0, transform:`translateY(${translateY}px)`, background:'#D1D4DA', borderTop:'1px solid #B4B7BD', fontFamily:fontStack }}>
      <div style={{ display:'flex', alignItems:'center', padding:'6px 8px', gap:8, background:'#F2F2F7' }}>
        <div style={{ width:32, height:32, borderRadius:16, background:'#C7C7CC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📷</div>
        <div style={{ flex:1, background:'#FFFFFF', borderRadius:16, padding:'6px 12px', color:'#8E8E93', fontSize:16 }}>iMessage</div>
        <div style={{ width:32, height:32, borderRadius:16, background:'#C7C7CC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎤</div>
      </div>
      <div style={{ padding:'4px 6px 8px' }}>
        {keyRows.map((row,i)=>(<div key={i} style={{ display:'flex', justifyContent:'center', marginBottom:i===keyRows.length-1?0:6 }}>{row.map(renderKey)}</div>))}
      </div>
    </div>
  );
};

const StatusBar: React.FC<{ batteryLevel?: number }> = ({ batteryLevel = 100 }) => {
  const clamped = Math.min(100, Math.max(0, batteryLevel));
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, height:44, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', fontSize:15, fontWeight:600, fontFamily:fontStack }}>
      <div>9:41</div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {/* Signal Bars */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:2 }}>
          {[4,7,10,13].map((h,i)=>(<div key={i} style={{ width:3, height:h, background:'#000', borderRadius:1 }} />))}
        </div>
        {/* Wi-Fi (simple) */}
        <div style={{ position:'relative', width:18, height:14 }}>
          <svg viewBox="0 0 20 14" width={18} height={14}>
            <path d="M10 13c.9 0 1.6-.7 1.6-1.6S10.9 9.8 10 9.8 8.4 10.5 8.4 11.4 9.1 13 10 13Z" fill="#000" />
            <path d="M3.3 6.6a9.2 9.2 0 0 1 13.4 0l-1.2 1.2a7.5 7.5 0 0 0-11 0L3.3 6.6Z" fill="#000" />
            <path d="M6.2 9.3a5.3 5.3 0 0 1 7.6 0l-1.2 1.2a3.6 3.6 0 0 0-5.2 0l-1.2-1.2Z" fill="#000" />
          </svg>
        </div>
        {/* Battery */}
        <div style={{ position:'relative', width:28, height:14, border:'2px solid #000', borderRadius:4, display:'flex', alignItems:'center', padding:'0 3px', boxSizing:'border-box' }}>
          <div style={{ position:'absolute', top:3, right:-5, width:3, height:8, background:'#000', borderRadius:1 }} />
          <div style={{ width:`${clamped}%`, height:6, background: clamped < 20 ? '#FF3B30' : '#000', borderRadius:2, transition:'width 0.3s' }} />
        </div>
      </div>
    </div>
  );
};

const NavigationHeader: React.FC<{ contactName?: string }> = ({ contactName }) => (
  <div style={{ position:'absolute', top:44, left:0, right:0, height:52, background:'#F2F2F7', borderBottom:'1px solid #C7C7CC', display:'flex', alignItems:'center', padding:'0 12px', fontFamily:fontStack }}>
    <div style={{ fontSize:17, color:'#007AFF' }}>Back</div>
    <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', fontSize:17, fontWeight:600 }}>{contactName || 'Contact'}</div>
  </div>
);

// Inline delivered label component
const DeliveredBelow: React.FC<{ startSec: number }> = ({ startSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(startSec * fps);
  if (frame < startFrame) return null;
  const progress = spring({ frame: frame - startFrame, fps, config:{ damping:20, stiffness:170, mass:0.8 } });
  const opacity = interpolate(progress, [0,1],[0,1]);
  const translateY = interpolate(progress, [0,1],[6,0]);
  return (
    <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4, transform:`translateY(${translateY}px)`, opacity }}>
      <div style={{ fontSize:12, color:'#8E8E93', fontFamily:fontStack }}>Delivered</div>
    </div>
  );
};

export const MessageConversation: React.FC<MessageConversationProps> = ({ messages, typingBeforeIndices, contactName, batteryLevel }) => {
  // Precompute a dynamic timeline for all messages.
  type TimelineEntry = {
    idx: number;
    msg: Message;
    appearSec: number; // when bubble mounts
    typingDuration: number; // for outgoing messages
    endSec: number; // when this message is finished (after typing if outgoing)
    typingIndicatorStart?: number; // for incoming typing indicator
    typingIndicatorEnd?: number;   // end of indicator (before gap)
  };

  const entries: TimelineEntry[] = [];
  let prevEnd = 0; // end time of previous message
  for (let i=0;i<messages.length;i++) {
    const m = messages[i];
    // Should we show a typing indicator before this message (incoming after an outgoing)?
    const indicatorForced = typingBeforeIndices?.includes(i);
    const autoIndicator = !m.sent && i>0 && messages[i-1].sent;
    const showIndicator = indicatorForced || autoIndicator;

    const base = i===0 ? 0 : prevEnd + GAP_SECONDS; // base time before any typing indicator or bubble
    let typingIndicatorStart: number | undefined;
    let typingIndicatorEnd: number | undefined;
    let appearSec: number;
    if (showIndicator) {
      typingIndicatorStart = base;
      // indicator duration (visible) is TYPING_DURATION - TYPING_GAP
      typingIndicatorEnd = typingIndicatorStart + (TYPING_DURATION - TYPING_GAP);
      appearSec = base + TYPING_DURATION; // bubble appears after full TYPING_DURATION
    } else {
      appearSec = base;
    }
    let typingDuration = 0;
    if (m.sent) {
      typingDuration = m.text.length / TYPE_SPEED;
    }
    const endSec = m.sent ? appearSec + typingDuration : appearSec; // incoming instantaneous
    entries.push({ idx:i, msg:m, appearSec, typingDuration, endSec, typingIndicatorStart, typingIndicatorEnd });
    prevEnd = endSec;
  }

  // Keyboard timings: from just before first outgoing begins to shortly after last outgoing finished
  const firstSent = entries.find(e=> e.msg.sent);
  const lastSent = [...entries].reverse().find(e=> e.msg.sent);
  const keyboardStart = firstSent ? Math.max(0, firstSent.appearSec - KEYBOARD_LEAD) : null;
  const keyboardEnd = lastSent ? lastSent.endSec + KEYBOARD_TRAIL : undefined;

  // Delivered label starts after last outgoing finished typing + delay
  const deliveredStartSec = lastSent ? lastSent.endSec + DELIVERED_DELAY : null;

  return (
    <AbsoluteFill style={{ background:'#000', fontFamily:fontStack, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:360, height:780, background:'#FFFFFF', borderRadius:48, position:'relative', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.4)', border:'6px solid #000' }}>
  <StatusBar batteryLevel={batteryLevel} />
  <NavigationHeader contactName={contactName} />
        <div style={{ position:'absolute', top:96, left:0, right:0, bottom:0, padding:'0 12px', display:'flex', flexDirection:'column' }}>
          {entries.map(entry=>{
            const { msg, idx, appearSec, typingDuration, typingIndicatorStart, typingIndicatorEnd } = entry;
            const prev = entries[idx-1]?.msg;
            const next = entries[idx+1]?.msg;
            const first = !prev || prev.sent !== msg.sent;
            const last = !next || next.sent !== msg.sent;
            return (
              <React.Fragment key={msg.id}>
                {typingIndicatorStart !== undefined && typingIndicatorEnd !== undefined && (
                  <TypingBubble startSec={typingIndicatorStart} endSec={typingIndicatorEnd} sent={false} />
                )}
                <MessageBubble msg={msg} appearSec={appearSec} first={first} last={last} typingDuration={typingDuration} />
                {deliveredStartSec != null && lastSent && lastSent.idx === idx && (
                  <DeliveredBelow startSec={deliveredStartSec} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {keyboardStart != null && (
          <Keyboard startSec={keyboardStart} endSec={keyboardEnd} />
        )}
      </div>
    </AbsoluteFill>
  );
};
