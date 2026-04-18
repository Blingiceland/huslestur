/**
 * ChildGate -- Börnin velja nafn sitt og fara beint í lestur.
 * Engin innskráning þarf.
 */
import React from 'react';
import { useFamily } from '../contexts/FamilyContext';

export default function ChildGate() {
  const { family, childMode, pickChildReader } = useFamily();

  if (!family) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-rune">?</div>
          <h1 className="login-title">Hmm...</h1>
          <p className="login-hint">
            Þessi hlekkur virkar ekki. Biddu foreldri þitt um nýjan hlekk!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-rune">&#x16ED;</div>
        <h1 className="login-title">{family.name}</h1>
        <p className="login-tagline">Hver ert þú?</p>

        <div className="login-divider" />

        {(family.members || []).length === 0 ? (
          <p className="login-hint">
            Engin börn skráð á þessa fjölskyldu. Foreldri þitt þarf að bæta þér við í stillingum.
          </p>
        ) : (
          <div className="child-gate-list">
            {(family.members || []).map(name => (
              <button
                key={name}
                className="child-gate-btn"
                onClick={() => pickChildReader(name)}
              >
                <span className="child-gate-avatar">
                  {name.charAt(0).toUpperCase()}
                </span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        )}

        <p className="login-footer">
          Veldu nafnið þitt til að byrja að lesa!
        </p>
      </div>
    </div>
  );
}
