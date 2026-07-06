/**
 * Help page - Application documentation and feature guide.
 * REQ-014 from SPEC-0006.
 */

import React from 'react';

const HelpPage: React.FC = () => {
  return (
    <div className="page help-page">
      <div className="help-header">
        <h1 className="page-title">Help & Documentation</h1>
        <p className="help-tagline">
          OpenShelfRating helps you catalog your personal library, track reading progress,
          and rate the books you've read.
        </p>
      </div>

      <div className="help-sections">
        <section className="help-section" id="library-management">
          <div className="help-section-icon" aria-hidden="true">📚</div>
          <h2>Library Management</h2>
          <p>
            Build and maintain your personal book collection. Add books by searching the global
            catalog or creating a new entry. Organize your books with search and filters to
            quickly find what you're looking for.
          </p>
          <ul>
            <li>Search the global catalog to find existing books</li>
            <li>Add books directly to your personal library</li>
            <li>Search and filter your library by title, author, or reading state</li>
            <li>Remove books you no longer want to track</li>
          </ul>
        </section>

        <section className="help-section" id="reading-lifecycle">
          <div className="help-section-icon" aria-hidden="true">🔖</div>
          <h2>Reading Lifecycle</h2>
          <p>
            Track your reading progress with three states. Move books through your reading
            journey from wishlist to completion.
          </p>
          <ul>
            <li><strong>To Read:</strong> Books you plan to read in the future</li>
            <li><strong>Reading:</strong> Books you're currently reading</li>
            <li><strong>Read:</strong> Books you've finished — only completed books can be rated</li>
          </ul>
          <p>State transitions are one-way: To Read → Reading → Read.</p>
        </section>

        <section className="help-section" id="ratings-reviews">
          <div className="help-section-icon" aria-hidden="true">⭐</div>
          <h2>Ratings &amp; Reviews</h2>
          <p>
            Share your thoughts on books you've finished. Rate books on a 1–5 star scale and
            write personal opinions to remember what you liked or disliked.
          </p>
          <ul>
            <li>Rate books from 1 (poor) to 5 (excellent) stars</li>
            <li>Write personal opinions and notes</li>
            <li>Ratings only available for books marked as Read</li>
            <li>Edit your rating and opinion at any time</li>
          </ul>
        </section>

        <section className="help-section" id="profile-media">
          <div className="help-section-icon" aria-hidden="true">👤</div>
          <h2>Profile &amp; Media</h2>
          <p>
            Personalize your account with a display name and avatar. Book covers are
            automatically associated with catalog entries.
          </p>
          <ul>
            <li>Upload a profile avatar (JPG, PNG, or WebP, max 5MB)</li>
            <li>Update your display name at any time</li>
            <li>Book cover images are managed through the global catalog</li>
          </ul>
        </section>

        <section className="help-section" id="account-security">
          <div className="help-section-icon" aria-hidden="true">🔒</div>
          <h2>Account Security</h2>
          <p>
            Your account is protected with secure authentication and email verification.
            Sign in with your email and password or use social login providers.
          </p>
          <ul>
            <li>Register with email and password (min. 8 characters, uppercase, number, special char)</li>
            <li>Sign in with Google, Apple, or Microsoft</li>
            <li>Verify your email to activate your account</li>
            <li>Reset your password via email link (valid 1 hour)</li>
            <li>After 10 failed login attempts, your account is locked for 2 minutes</li>
          </ul>
        </section>
      </div>

      <div className="help-footer">
        <p>
          For additional support or to report an issue, please contact the OpenShelfRating team.
        </p>
      </div>
    </div>
  );
};

export default HelpPage;
