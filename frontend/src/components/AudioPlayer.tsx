'use client';

import React, { useRef, useState, useEffect } from 'react';
import { getAudioStreamUrl } from '@/lib/api';

interface AudioPlayerProps {
  noteId: string;
}

export default function AudioPlayer({ noteId }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioUrl = getAudioStreamUrl(noteId);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isPlaying ? '#10b981' : '#6b7280',
            boxShadow: isPlaying ? '0 0 10px #10b981' : 'none'
          }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Playback
          </span>
        </div>

        <button 
          onClick={changeSpeed} 
          className="btn-secondary" 
          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
        >
          {playbackRate}x
        </button>
      </div>

      {/* Progress Slider */}
      <input
        type="range"
        min="0"
        max={duration || 100}
        value={currentTime}
        onChange={handleSeek}
        style={{
          width: '100%',
          accentColor: 'var(--primary)',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      />

      {/* Controls & Timestamps */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          onClick={togglePlay}
          className="btn-primary" 
          style={{ padding: '8px 18px' }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
