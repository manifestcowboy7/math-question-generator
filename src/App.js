// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import { BsTag, BsBookmark, BsLightning } from 'react-icons/bs';
import { PDFDownloadLink } from '@react-pdf/renderer'; // <-- Import Download Link
import QuestionsPDF from './components/QuestionsPDF';   // <-- Import your PDF component

// Placeholder - Replace with your actual math parsing logic
const parseMathText = (text) => {
    // Simple placeholder: just return the text.
    // In reality, you'd use MathJax, KaTeX, or a custom parser here.
    return text ?? ''; // Return empty string if text is null/undefined
};

// --- DOK Analysis Calculation ---
// Defines the DOK levels we always want to show in the analysis
const DOK_LEVELS_TO_DISPLAY = [1, 2, 3, 4];

const calculateDokAnalysis = (selectedQuestions) => {
    // Initialize counts for all predefined DOK levels
    const counts = DOK_LEVELS_TO_DISPLAY.reduce((acc, level) => {
        acc[level] = 0;
        return acc;
    }, {});

    let total = 0;

    selectedQuestions.forEach(q => {
        // Check if the question's DOK is one we're tracking
        if (q.dok && counts.hasOwnProperty(q.dok)) {
            counts[q.dok]++;
            total++; // Only count questions that have a DOK level we track
        }
    });

    const breakdown = DOK_LEVELS_TO_DISPLAY.map(level => ({
        dok: level,
        count: counts[level],
        // Calculate percentage, handle division by zero
        percentage: total === 0 ? '0.0' : ((counts[level] / total) * 100).toFixed(1)
    }));

    // Return the total count and the detailed breakdown
    return { total, breakdown };
};


function App() {
    // --- State ---
    const [allQuestions, setAllQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
    const [selectedQuestionsDetails, setSelectedQuestionsDetails] = useState([]);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchQuestionsAndTopics = async () => {
            setLoading(true);
            setError(null);
            try {
                let { data: questions, error: questionsError } = await supabase
                    .from('questions')
                    .select('*');

                if (questionsError) throw questionsError;

                setAllQuestions(questions || []);

                const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))].sort();
                setAvailableTopics(topics);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load questions. Please try refreshing.");
                setAllQuestions([]);
                setAvailableTopics([]);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestionsAndTopics();
    }, []);

    // --- Filtering Logic ---
    useEffect(() => {
        let currentFiltered = allQuestions;

        if (searchTerm) {
            currentFiltered = currentFiltered.filter(q =>
                q.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.learning_objective?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.standard?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedTopics.length > 0) {
            currentFiltered = currentFiltered.filter(q =>
                q.topic && selectedTopics.includes(q.topic)
            );
        }

        setFilteredQuestions(currentFiltered);

    }, [searchTerm, selectedTopics, allQuestions]);

    // --- Selection Details Update ---
    useEffect(() => {
        const details = allQuestions.filter(q => selectedQuestionIds.includes(q.id));
        // Simple text preprocess for PDF - replace potential math markers if needed
        // This is a VERY basic example, your parseMathText might handle this better
        const processedDetails = details.map(q => ({
            ...q,
            // Ensure question_text is a string before passing to PDF renderer
            question_text: parseMathText(q.question_text)
        }));
        setSelectedQuestionsDetails(processedDetails);
    }, [selectedQuestionIds, allQuestions]);

    // --- DOK Analysis Calculation (Memoized) ---
    const dokAnalysis = useMemo(() => calculateDokAnalysis(selectedQuestionsDetails), [selectedQuestionsDetails]);

    // --- Event Handlers ---
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedTopics([]);
    };

    const handleTopicChange = (event) => {
        const topic = event.target.value;
        setSelectedTopics(prev =>
            event.target.checked
                ? [...prev, topic]
                : prev.filter(t => t !== topic)
        );
    };

    const handleQuestionSelectionChange = (questionId, isSelected) => {
        setSelectedQuestionIds(prev =>
            isSelected
                ? [...prev, questionId]
                : prev.filter(id => id !== questionId)
        );
    };

     const handleDOKPillClick = (dok) => {
        console.log("DOK Pill Clicked:", dok);
     };
     const handleStandardPillClick = (standard) => {
        console.log("Standard Pill Clicked:", standard);
     };
     const handleTopicPillClick = (topic) => {
        if (topic) {
            setSelectedTopics([topic]);
        }
     };

    // --- Render ---
    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Math Question Generator</h1>
            </header>

            <main className="main-content">
                {/* Filters Sidebar */}
                <aside className="filters-sidebar">
                    <h2>Filters</h2>
                    {/* Keyword Search */}
                    <div className="filter-group">
                        <input type="search" placeholder="Search text, keywords..." value={searchTerm} onChange={handleSearchChange} />
                        <button onClick={handleResetFilters}>Reset Filters</button>
                    </div>
                    {/* Topic Checklist */}
                    <div className="filter-group topic-filter-group">
                        <h3>Topic</h3>
                        {loading ? (
                             <p>Loading topics...</p>
                        ) : availableTopics.length > 0 ? (
                            <div className="topic-checklist">
                                {availableTopics.map(topic => (
                                    <label key={topic}>
                                        <input type="checkbox" value={topic} checked={selectedTopics.includes(topic)} onChange={handleTopicChange} />
                                        {topic}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p>No topics found.</p>
                        )}
                    </div>

                    {/* Selection Analysis Section */}
                    <div className="selection-analysis filter-group">
                         <h3>Selection Analysis</h3>
                         {selectedQuestionIds.length === 0 ? (
                             <p className="analysis-placeholder">Select questions to see DOK breakdown.</p>
                         ) : (
                             <ul className="dok-breakdown-list">
                                 {dokAnalysis.breakdown.map(item => (
                                     <li key={item.dok} className={item.count === 0 ? 'dok-breakdown-item zero-count' : 'dok-breakdown-item'}>
                                         <span>DOK {item.dok}:</span>
                                         <span>{item.count} ({item.percentage}%)</span>
                                     </li>
                                 ))}
                                  <li className="dok-breakdown-total">
                                     <strong>
                                        <span>Total Selected:</span>
                                        <span>{selectedQuestionIds.length}</span>
                                     </strong>
                                  </li>
                             </ul>
                         )}
                    </div>
                </aside>

                {/* Available Questions List */}
                <section className="questions-list-section">
                    <h2>Available Questions ({filteredQuestions.length})</h2>
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
                                    const formattedQuestionText = parseMathText(question.question_text); // Use same parser for display

                                    return (
                                        <div key={question.id} className="question-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedQuestionIds.includes(question.id)}
                                                onChange={(e) => handleQuestionSelectionChange(question.id, e.target.checked)}
                                                aria-label={`Select question: ${question.question_text}`}
                                            />
                                            <div className="question-details">
                                                <p>{formattedQuestionText}</p>
                                                <div className="question-meta combination">
                                                    <div className="meta-pills">
                                                        {(question.dok !== null && question.dok !== undefined) && (
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
                                                    {question.learning_objective && <p className="meta-lo" title={question.learning_objective}>{truncatedLO}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </section>

                {/* Selected Questions Panel */}
                <aside className="selected-panel">
                    <h2>Selected ({selectedQuestionIds.length})</h2>
                     <div className="selected-items-scroll-area">
                         {selectedQuestionIds.length === 0 ? (
                            <p className="placeholder-text">Select questions using checkboxes.</p>
                         ) : (
                            <ul className="selected-items-list">
                                {selectedQuestionsDetails.map(question => (
                                    <li key={question.id} className="selected-item">
                                        <div className="selected-item-details">
                                            <p className="selected-item-text">{parseMathText(question.question_text)}</p> {/* Use parser */}
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

                     {/* --- START: PDF Download Link Section --- */}
                     {selectedQuestionIds.length > 0 && !loading && ( // Only show if questions selected AND not initially loading
                         <div className="download-pdf-section">
                             <PDFDownloadLink
                                 // Pass the detailed (and potentially pre-processed) question data
                                 document={<QuestionsPDF questions={selectedQuestionsDetails} />}
                                 // Generate a filename with the current date
                                 fileName={`math_questions_${new Date().toISOString().slice(0,10)}.pdf`}
                             >
                                 {/* Render prop to display status */}
                                 {({ blob, url, loading: pdfLoading, error: pdfError }) =>
                                     pdfLoading
                                     ? 'Generating PDF...' // Show loading text while PDF is being created
                                     : pdfError
                                     ? 'Error!' // Show error text (consider more detail)
                                     : 'Download Selected as PDF' // The actual link text
                                 }
                             </PDFDownloadLink>
                             {/* Optional: Display detailed error message if pdfError exists */}
                             {/* {pdfError && <p style={{color: 'red', fontSize: '0.8em', marginTop: '5px'}}>PDF Generation Failed</p>} */}
                         </div>
                     )}
                     {/* --- END: PDF Download Link Section --- */}

                </aside>
            </main>
        </div>
    );
}

export default App;