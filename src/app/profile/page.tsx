'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_PROFILE } from '@/lib/mock-data';
import type { FanProfile } from '@/lib/types';

const TEAMS = [
  { id: 'bra', name: 'Brazil', flag: '🇧🇷' },
  { id: 'usa', name: 'USA', flag: '🇺🇸' },
  { id: 'arg', name: 'Argentina', flag: '🇦🇷' },
  { id: 'fra', name: 'France', flag: '🇫🇷' },
  { id: 'ger', name: 'Germany', flag: '🇩🇪' },
  { id: 'esp', name: 'Spain', flag: '🇪🇸' },
  { id: 'eng', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'mex', name: 'Mexico', flag: '🇲🇽' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<FanProfile>(DEMO_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fanProfile');
    if (stored) {
      setProfile(JSON.parse(stored));
      setStep(2); // Already set up
    }
  }, []);

  const toggleTeam = (id: string) => {
    setProfile(p => ({
      ...p,
      favoriteTeams: p.favoriteTeams.includes(id)
        ? p.favoriteTeams.filter(t => t !== id)
        : p.favoriteTeams.length < 3 ? [...p.favoriteTeams, id] : p.favoriteTeams,
    }));
  };

  const save = () => {
    localStorage.setItem('fanProfile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  if (step === 2) {
    return (
      <div className="min-h-screen px-4 pt-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black">👤 My Profile</h1>
          <button
            onClick={() => setStep(0)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Edit
          </button>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-400">Name</p>
            <p className="font-semibold">{profile.name ?? 'Fan'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Favorite Teams</p>
            <div className="flex gap-1 mt-1">
              {profile.favoriteTeams.map(tid => {
                const team = TEAMS.find(t => t.id === tid);
                return team ? (
                  <span key={tid} className="text-2xl">{team.flag}</span>
                ) : null;
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-400">Watch Style</p>
              <p className="font-semibold capitalize">{profile.watchStyle}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Budget</p>
              <p className="font-semibold">{'$'.repeat(profile.budgetRange)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Max Travel</p>
              <p className="font-semibold">{profile.maxTravelMinutes} min</p>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-400">Party Size</p>
              <p className="font-semibold">{profile.partySize ?? 2} people</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Notifications</p>
              <p className="font-semibold">{profile.notificationsEnabled ? '✅ On' : '❌ Off'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-12">
      <div className="mb-6">
        <div className="flex gap-1.5 mb-4">
          {[0, 1].map(i => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-gray-700'}`} />
          ))}
        </div>
        <h1 className="text-xl font-black">
          {step === 0 ? '🏳️ Pick your teams' : '⚙️ Your preferences'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {step === 0 ? 'Choose up to 3 favorite teams' : 'Set your matchday style'}
        </p>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">Your name</label>
            <input
              value={profile.name ?? ''}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Enter your name"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {TEAMS.map(team => {
              const selected = profile.favoriteTeams.includes(team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-950/50'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <span className="text-3xl">{team.flag}</span>
                  <span className="text-xs mt-1 text-center leading-tight">{team.name}</span>
                  {selected && <span className="text-blue-400 text-xs mt-0.5">✓</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={profile.favoriteTeams.length === 0}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 font-bold transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="text-xs text-gray-400 block mb-2">Watch style</label>
            <div className="flex gap-2">
              {(['social', 'focused', 'family'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => setProfile(p => ({ ...p, watchStyle: style }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${
                    profile.watchStyle === style
                      ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  {style === 'social' ? '🎉' : style === 'focused' ? '👁️' : '👨‍👩‍👧'} {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">Budget range: {'$'.repeat(profile.budgetRange)}</label>
            <input
              type="range" min={1} max={3} value={profile.budgetRange}
              onChange={e => setProfile(p => ({ ...p, budgetRange: +e.target.value as 1 | 2 | 3 }))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$ Budget</span><span>$$ Mid</span><span>$$$ Premium</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">Max travel: {profile.maxTravelMinutes} min</label>
            <input
              type="range" min={10} max={60} step={5} value={profile.maxTravelMinutes}
              onChange={e => setProfile(p => ({ ...p, maxTravelMinutes: +e.target.value }))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">Party size: {profile.partySize ?? 2}</label>
            <input
              type="range" min={1} max={10} value={profile.partySize ?? 2}
              onChange={e => setProfile(p => ({ ...p, partySize: +e.target.value }))}
              className="w-full accent-blue-500"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-800 rounded-xl p-3 border border-gray-700">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-gray-400">Departure alerts & key moments</p>
            </div>
            <button
              onClick={() => setProfile(p => ({ ...p, notificationsEnabled: !p.notificationsEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${profile.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${profile.notificationsEnabled ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="px-4 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors">
              ← Back
            </button>
            <button
              onClick={save}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 font-bold transition-colors"
            >
              {saved ? '✅ Saved!' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
