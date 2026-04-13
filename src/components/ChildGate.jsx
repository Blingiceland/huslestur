/**
 * ChildGate -- Bornin velja nafn sitt og fara beint i lestur.
 * Engin innskraning tharf.
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
            Thessi linkur virkar ekki. Biddu foreldri thitt um nyjann link!
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
        <p className="login-tagline">Hver ert thu?</p>

        <div className="login-divider" />

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

        <p className="login-footer">
          Veldu nafnid thitt til ad byrja ad lesa!
        </p>
      </div>
    </div>
  );
}
