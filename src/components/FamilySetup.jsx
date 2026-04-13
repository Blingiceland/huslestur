import React, { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';

export default function FamilySetup() {
  const { createFamily } = useFamily();
  const { user, logOut } = useAuth();

  const [familyName, setFamilyName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  const addMember = () => {
    const name = memberInput.trim();
    if (!name || members.includes(name)) return;
    setMembers(prev => [...prev, name]);
    setMemberInput('');
  };

  const removeMember = (name) => setMembers(prev => prev.filter(m => m !== name));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addMember();
  };

  const handleSave = async () => {
    if (!familyName.trim()) return;
    setSaving(true);
    await createFamily(familyName.trim(), members);
    setSaving(false);
  };

  return (
    <div className="login-page">
      <div className="login-card family-setup-card">
        <div className="login-rune">᛭</div>
        <h1 className="login-title">Velkominn!</h1>
        <p className="login-tagline" style={{ fontSize: '0.95rem', opacity: 0.75 }}>
          Innskráður sem <strong>{user?.displayName}</strong>
        </p>

        <div className="login-divider" />

        <div className="setup-section">
          <label className="setup-label">Nafn fjölskyldunnar</label>
          <input
            className="setup-input"
            type="text"
            placeholder="t.d. Fjölskylda Sigurðssonar"
            value={familyName}
            onChange={e => setFamilyName(e.target.value)}
          />
        </div>

        <div className="setup-section">
          <label className="setup-label">Bæta við börnum (valkvæmt)</label>
          <div className="setup-member-row">
            <input
              className="setup-input"
              type="text"
              placeholder="Nafn barns…"
              value={memberInput}
              onChange={e => setMemberInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="setup-add-btn"
              onClick={addMember}
              disabled={!memberInput.trim()}
            >
              +
            </button>
          </div>

          {members.length > 0 && (
            <div className="setup-members-list">
              {members.map(name => (
                <div key={name} className="setup-member-chip">
                  <span>{name}</span>
                  <button onClick={() => removeMember(name)}>×</button>
                </div>
              ))}
            </div>
          )}
          <p className="setup-hint">
            Þú getur alltaf bætt við fleiri börnum síðar.
          </p>
        </div>

        <button
          className="login-google-btn"
          style={{ marginTop: '8px' }}
          onClick={handleSave}
          disabled={!familyName.trim() || saving}
        >
          {saving ? 'Hleður…' : '✓ Stofna fjölskyldu'}
        </button>

        <button
          onClick={logOut}
          style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Skrá út
        </button>
      </div>
    </div>
  );
}
