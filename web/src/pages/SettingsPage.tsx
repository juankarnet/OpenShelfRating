/**
 * Settings page - Application settings placeholder.
 * REQ-013 from SPEC-0006.
 */

import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="page settings-page">
      <h1 className="page-title">Settings</h1>
      <div className="settings-sections">
        <section className="settings-section">
          <h2>Account Settings</h2>
          <p className="settings-placeholder">Password change and email verification — coming soon.</p>
        </section>
        <section className="settings-section">
          <h2>Notification Preferences</h2>
          <p className="settings-placeholder">Email notifications and reminders — coming soon.</p>
        </section>
        <section className="settings-section">
          <h2>Display Preferences</h2>
          <p className="settings-placeholder">Dark mode and language settings — coming soon.</p>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
