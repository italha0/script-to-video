import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

interface Message {
  id: number;
  text: string;
  sent: boolean;
  time: string;
}

interface MessageConversationProps {
  messages: Message[];
}

interface MessageBubbleProps {
  message: Message;
  delay: number;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, delay, isFirstInGroup, isLastInGroup }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const startFrame = delay * fps;
  const animationFrames = 12; // quicker pop
  
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + animationFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  const scale = interpolate(
    frame,
    [startFrame, startFrame + animationFrames],
    [0.95, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const translateY = interpolate(
    frame,
    [startFrame, startFrame + animationFrames],
    [10, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  if (frame < startFrame) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: message.sent ? 'flex-end' : 'flex-start',
        marginBottom: 8,
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          maxWidth: '80%',
          padding: '10px 16px',
          backgroundColor: message.sent ? '#007AFF' : '#E5E5EA',
          color: message.sent ? 'white' : 'black',
          fontSize: 17,
          lineHeight: 1.25,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          wordWrap: 'break-word',
          position: 'relative',
          borderTopLeftRadius: message.sent ? 20 : (isFirstInGroup ? 20 : 6),
          borderTopRightRadius: message.sent ? (isFirstInGroup ? 20 : 6) : 20,
          borderBottomLeftRadius: message.sent ? 20 : (isLastInGroup ? 20 : 6),
          borderBottomRightRadius: message.sent ? (isLastInGroup ? 20 : 6) : 20,
        }}
      >
        {message.text}
      </div>
    </div>
  );
};

// Simplified iOS keyboard (visual only)
const Keyboard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const startFrame = delay * fps;
  
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 15],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  if (frame < startFrame) return null;

  const keyRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['shift','Z','X','C','V','B','N','M','⌫'],
    ['123','emoji','space','return']
  ];

  const renderKey = (k: string) => {
    const isWide = ['space'].includes(k);
    const label = k === 'shift' ? '⇧' : k === 'return' ? 'return' : k === 'emoji' ? '😀' : k;
    return (
      <div key={k} style={{
        flex: isWide ? 4 : 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        padding: '10px 6px',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
        margin: '0 3px'
      }}>{label}</div>
    );
  };

  if (frame < startFrame) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#D1D4DA',
      borderTop: '1px solid #B4B7BD',
      opacity,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Input bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', gap: 8, backgroundColor: '#F2F2F7' }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: '#C7C7CC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📷</div>
        <div style={{ flex:1, background:'#FFFFFF', borderRadius:16, padding:'6px 12px', color:'#8E8E93', fontSize:16 }}>iMessage</div>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: '#C7C7CC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎤</div>
      </div>
      {/* Keys */}
      <div style={{ padding: '4px 6px 8px' }}>
        {keyRows.map((row,i) => (
          <div key={i} style={{ display:'flex', justifyContent:'center', marginBottom: i===keyRows.length-1 ? 0 : 6 }}>
            {row.map(renderKey)}
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBar: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 44,
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 20,
      paddingRight: 20,
      fontSize: 17,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}
  >
    <div>9:41</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div>📶</div>
      <div>📶</div>
      <div>🔋</div>
    </div>
  </div>
);

const NavigationHeader: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 44,
      left: 0,
      right: 0,
      height: 60,
      backgroundColor: '#F2F2F7',
      borderBottom: '1px solid #C7C7CC',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 16,
      paddingRight: 16,
    }}
  >
    <div
      style={{
        fontSize: 18,
        color: '#007AFF',
        marginRight: 'auto',
      }}
    >
      ←
    </div>
    <div
      style={{
        fontSize: 17,
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'black',
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      Contact
    </div>
  </div>
);

export const MessageConversation: React.FC<MessageConversationProps> = ({
  messages,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <StatusBar />
      <NavigationHeader />
      
      <div
        style={{
          marginTop: 104,
          marginBottom: 300, // space for keyboard
          padding: '0 12px 12px',
          height: 'calc(100% - 404px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.map((message, index) => {
          const prev = messages[index - 1];
          const next = messages[index + 1];
          const isFirstInGroup = !prev || prev.sent !== message.sent;
          const isLastInGroup = !next || next.sent !== message.sent;
          return (
            <MessageBubble
              key={message.id}
              message={message}
              delay={index * 2}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
            />
          );
        })}

        {/* Delivered status after last sent message */}
        <Sequence from={messages.length * 2 * fps} durationInFrames={durationInFrames - messages.length * 2 * fps}>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
            <div style={{ fontSize:12, color:'#8E8E93', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Delivered</div>
          </div>
        </Sequence>
      </div>

      <Keyboard delay={messages.length * 2 + 4} />
    </AbsoluteFill>
  );
};
