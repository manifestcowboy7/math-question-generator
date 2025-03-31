// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import { BsTag, BsBookmark, BsLightning } from 'react-icons/bs';
import parseMathText from './utils/mathParser';

function App() {
    // ... (keep all your existing state, hooks, handlers, etc.) ...

    // --- Render ---
    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Math Question Generator</h1>
            </header>

            <main className="main-content"> {/* Added class */}
                {/* Filters Sidebar */}
                <aside className="filters-sidebar">
                    <h2>Filters</h2>
                    {/* Keyword Search */}
                    <div className="filter-group">
                        <input type="search" placeholder="Search text, keywords..." value={searchTerm} onChange={handleSearchChange} />
                        <button onClick={handleResetFilters}>Reset Filters</button>
                    </div>
                    {/* Topic Checklist */}
                    <div className="filter-group topic-filter-group"> {/* Optional: Added specific class for topic group */}
                        <h3>Topic</h3>
                        {availableTopics.length > 0 ? (
                            <div className="topic-checklist"> {/* This div will scroll if topics overflow */}
                                {availableTopics.map(topic => (
                                    <label key={topic}>
                                        <input type="checkbox" value={topic} checked={selectedTopics.includes(topic)} onChange={handleTopicChange} />
                                        {topic}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p>{loading ? 'Loading topics...' : 'No topics available.'}</p>
                        )}
                    </div>

                    {/* Selection Analysis Section */}
                    <div className="selection-analysis filter-group">
                         <h3>Selection Analysis</h3>
                         {dokAnalysis.total === 0 ? (
                             <p className="analysis-placeholder">Select questions to see DOK breakdown.</p>
                         ) : (
                             <ul className="dok-breakdown-list">
                                 {dokAnalysis.breakdown.map(item => (
                                     <li key={item.dok} className="dok-breakdown-item">
                                         <span>DOK {item.dok}:</span>
                                         <span>{item.count} ({item.percentage}%)</span>
                                     </li>
                                 ))}
                                  <li className="dok-breakdown-total">
                                     <strong>Total Selected: {dokAnalysis.total}</strong>
                                  </li>
                             </ul>
                         )}
                    </div>
                </aside>

                {/* Available Questions List */}
                {/* The outer section provides structure and holds the title */}
                <section className="questions-list-section"> {/* Renamed class slightly for clarity */}
                    <h2>Available Questions ({filteredQuestions.length})</h2>

                    {/* **** THIS IS THE NEW WRAPPER FOR SCROLLING **** */}
                    <div className="question-scroll-area">
                        {loading && <p className="loading-message">Loading questions...</p>}
                        {error && <p className="error-message">{error}</p>}
                        {!loading && !error && (
                            <>
                                {filteredQuestions.length === 0 && <p>No questions match the current filters.</p>}
                                {filteredQuestions.map(question => {
                                    const truncatedLO = question.learning_objective
                                        ? question.learning_objective.substring(0, 80) + (question.learning_objective.length > 80 ? '...' : '')
                                        : '';
                                    const formattedQuestionText = parseMathText(question.question_text);

                                    return (
                                        <div key={question.id} className="question-item">
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={selectedQuestionIds.includes(question.id)}
                                                onChange={(e) => handleQuestionSelectionChange(question.id, e.target.checked)}
                                                aria-label={`Select question: ${question.question_text}`}
                                            />
                                            {/* Details */}
                                            <div className="question-details">
                                                <p>{formattedQuestionText}</p>
                                                {/* Metadata Pills/Buttons */}
                                                <div className="question-meta combination">
                                                    <div className="meta-pills">
                                                        {question.dok !== null && question.dok !== undefined && (
                                                            <button className="pill-button dok-pill" onClick={() => handleDOKPillClick(question.dok)} title={`Filter by DOK: ${question.dok}`} >
                                                                <BsLightning className="pill-icon" aria-hidden="true" /> DOK: {question.dok}
                                                            </button>
                                                        )}
                                                        {question.standard && (
                                                            <button className="pill-button standard-pill" onClick={() => handleStandardPillClick(question.standard)} title={`Filter by Standard: ${question.standard}`} >
                                                                <BsBookmark className="pill-icon" aria-hidden="true" /> Std: {question.standard}
                                                            </button>
                                                        )}
                                                        {question.topic && (
                                                            <button className="pill-button topic-pill" onClick={() => handleTopicPillClick(question.topic)} title={`Filter by topic: ${question.topic}`} >
                                                                <BsTag className="pill-icon" aria-hidden="true" /> Topic: {question.topic}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {/* Learning Objective Text */}
                                                    {question.learning_objective && <p className="meta-lo">{truncatedLO}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div> {/* **** END OF NEW SCROLL WRAPPER **** */}
                </section>

                {/* Selected Questions Panel */}
                <aside className="selected-panel">
                    <h2>Selected ({selectedQuestionIds.length})</h2>
                     {/* Added wrapper for potential scrolling here too */}
                     <div className="selected-items-scroll-area">
                        {selectedQuestionIds.length === 0 ? (
                            <p className="placeholder-text">Drag questions here or select using checkboxes.</p>
                        ) : (
                            <ul className="selected-items-list">
                                {selectedQuestionsDetails.map(question => (
                                    <li key={question.id} className="selected-item">
                                        <div className="selected-item-details">
                                            <p className="selected-item-text">{parseMathText(question.question_text)}</p>
                                            <div className="selected-item-meta">
                                                DOK: {question.dok ?? 'N/A'}
                                                {question.topic && <span>Topic: {question.topic}</span>}
                                            </div>
                                        </div>
                                        <button onClick={() => handleQuestionSelectionChange(question.id, false)} className="remove-selected-btn" aria-label={`Remove selected question: ${question.question_text}`} title="Remove" >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div> {/* End selected items scroll wrapper */}
                </aside>
            </main>
        </div>
    );
}

export default App;