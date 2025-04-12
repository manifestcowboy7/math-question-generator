// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import { supabase } from './supabaseClient';
import { BsTag, BsBookmark, BsLightning, BsCardText } from 'react-icons/bs';
import FinalizePdfPage from './pages/FinalizePdfPage';

// --- Helper Functions, DOK Calc, Constants ---

// --- NEW: Function to render superscripts ---
function renderTextWithSuperscripts(text) {
    // Return immediately if text is null, undefined, or not a string
    if (!text || typeof text !== 'string') return text;

    // Split the string by potential superscript parts, keeping the delimiters
    // This regex looks for '^' followed by one or more letters/numbers
    const parts = text.split(/(\^[a-zA-Z0-9]+)/g);

    return (
        <>
            {/* Filter out potential empty strings from split and map */}
            {parts.filter(part => part).map((part, index) => {
                if (part.startsWith('^')) {
                    // If part starts with '^', remove '^' and wrap in <sup>
                    return <sup key={index}>{part.substring(1)}</sup>;
                } else {
                    // Otherwise, render the part as plain text
                    // Use React.Fragment for keys when returning plain strings/text nodes directly
                    return <React.Fragment key={index}>{part}</React.Fragment>;
                }
            })}
        </>
    );
}
// --- End NEW Function ---

// Removed old parseMathText

const formatQuestionTypeDisplay = (type) => {
    if (!type) return 'N/A';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
const DOK_LEVELS_TO_DISPLAY = [1, 2, 3, 4];
const calculateDokAnalysis = (selectedQuestions) => {
    const counts = DOK_LEVELS_TO_DISPLAY.reduce((acc, level) => ({ ...acc, [level]: 0 }), {});
    let total = 0;
    selectedQuestions.forEach(q => {
        const dokValue = q.dok;
        if (dokValue && counts.hasOwnProperty(dokValue)) {
            counts[dokValue]++;
            total++;
        }
    });
    const breakdown = DOK_LEVELS_TO_DISPLAY.map(level => ({
        dok: level,
        count: counts[level],
        percentage: total === 0 ? '0.0' : ((counts[level] / total) * 100).toFixed(1)
    }));
    return { total, breakdown };
};
const QUESTION_TYPE_FILTERS = [
    { label: 'All', value: null },
    { label: 'Short Response', value: 'short_response' },
    { label: 'Multiple Choice', value: 'multiple_choice' },
    // Add other types as needed, e.g., { label: 'Numeric', value: 'numeric' }
    // Match the 'value' to actual values in your 'question_type' column
];
const SUBJECT_TABLES = [ { label: 'Algebra 1', tableName: 'questions' }, ];
// --- End Constants / Helpers ---


// --- #################################### ---
// ---       Selection Page Component       ---
// --- #################################### ---
function SelectionPage({ selectedQuestionIds, setSelectedQuestionIds }) {
    // --- State Definitions ---
    const [currentSubjectTable, setCurrentSubjectTable] = useState(SUBJECT_TABLES[0].tableName);
    const [allQuestions, setAllQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [selectedQuestionsDetails, setSelectedQuestionsDetails] = useState([]);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuestionType, setSelectedQuestionType] = useState(null);
    const [selectedDok, setSelectedDok] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchQuestionsAndTopics = async () => {
            console.log("1. Starting fetchQuestionsAndTopics...");
            setAllQuestions([]); setAvailableTopics([]); setFilteredQuestions([]);
            setSelectedQuestionsDetails([]);
            setSearchTerm(''); setSelectedTopics([]); setSelectedQuestionType(null);
            setError(null); setLoading(true);
            setSelectedDok(null); // Reset DOK on subject change
            try {
                console.log("2. Inside try block, before query.");
                const selectQuery = `
                    id, question_text, dok, question_type, answer_data, image_url, tags, metadata, graph_needed, steps,
                    success_criterion_id,
                    success_criteria (
                        learning_intention_id,
                        learning_intentions (
                            intention_text,
                            topic_id,
                            topics ( title ),
                            learning_intention_standards (
                                standard_id,
                                standards ( description )
                            )
                        )
                    )
                `;
                console.log("3. Supabase Select Query:", selectQuery);
                let { data: questions, error: questionsError } = await supabase
                    .from(currentSubjectTable)
                    .select(selectQuery);

                console.log("4. After supabase query attempt.");
                console.log("   - questionsError:", questionsError);
                console.log("   - questions data:", questions);

                if (questionsError) {
                    console.error("5a. Supabase query returned an error object:", questionsError);
                    throw questionsError;
                }

                console.log("5b. Supabase query successful (no error object).");
                setAllQuestions(questions || []);

                console.log("6. Attempting to extract topics...");
                const topics = [...new Set((questions || [])
                    .map(q => q.success_criteria?.learning_intentions?.topics?.title)
                    .filter(Boolean))]
                    .sort();
                setAvailableTopics(topics);
                console.log("7. Extracted topics:", topics);

            } catch (err) {
                console.error("8. Caught error in catch block:", err);
                let displayError = err.message || 'Unknown error.';
                if (err.message && (err.message.includes('failed to parse select parameter') || err.message.includes("relation") || err.message.includes("does not exist")) ) {
                   displayError = `Database query failed. Check JOIN syntax, table/column names, relationships, and RLS permissions in Supabase. Original error: ${err.message}`;
                }
                 setError(`Failed to load data for '${SUBJECT_TABLES.find(s => s.tableName === currentSubjectTable)?.label || currentSubjectTable}': ${displayError}`);
                setAllQuestions([]); setAvailableTopics([]); setFilteredQuestions([]); setSelectedQuestionsDetails([]);
            } finally {
                console.log("9. Inside finally block, setting loading to false.");
                setLoading(false);
            }
        };
        fetchQuestionsAndTopics();
    }, [currentSubjectTable]);


    // --- Filtering Effect ---
    useEffect(() => {
        let currentFiltered = allQuestions;

        if (searchTerm) {
             const lowerSearchTerm = searchTerm.toLowerCase();
            currentFiltered = currentFiltered.filter(q =>
                q.question_text?.toLowerCase().includes(lowerSearchTerm) ||
                q.success_criteria?.learning_intentions?.intention_text?.toLowerCase().includes(lowerSearchTerm) ||
                q.success_criteria?.learning_intentions?.learning_intention_standards?.some(lis => lis.standards?.description?.toLowerCase().includes(lowerSearchTerm)) ||
                q.success_criteria?.learning_intentions?.topics?.title?.toLowerCase().includes(lowerSearchTerm) ||
                q.tags?.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
            );
        }

        if (selectedTopics.length > 0) {
            currentFiltered = currentFiltered.filter(q => {
                const topicTitle = q.success_criteria?.learning_intentions?.topics?.title;
                return topicTitle && selectedTopics.includes(topicTitle);
            });
        }

        if (selectedQuestionType) {
             currentFiltered = currentFiltered.filter(q => q.question_type && q.question_type.toLowerCase() === selectedQuestionType);
        }

        if (selectedDok !== null) {
            currentFiltered = currentFiltered.filter(q => q.dok === selectedDok);
        }

        console.log("Filtering effect finished. Filtered count:", currentFiltered.length);
        setFilteredQuestions(currentFiltered);

    }, [searchTerm, selectedTopics, selectedQuestionType, selectedDok, allQuestions]);


    // --- Selection Details Update Effect ---
    useEffect(() => {
        const selectedIdsArray = Array.from(selectedQuestionIds);
        const details = allQuestions
            .filter(q => selectedIdsArray.includes(q.id))
            .sort((a, b) => selectedIdsArray.indexOf(a.id) - selectedIdsArray.indexOf(b.id));
        // No need to pre-process text here anymore
        const processedDetails = details.map(q => ({ ...q }));
        setSelectedQuestionsDetails(processedDetails);
    }, [selectedQuestionIds, allQuestions]);


    // --- DOK Analysis Calculation ---
    const dokAnalysis = useMemo(() => calculateDokAnalysis(selectedQuestionsDetails), [selectedQuestionsDetails]);


    // --- Event Handlers ---
    const handleSearchChange = (event) => setSearchTerm(event.target.value);
    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedTopics([]);
        setSelectedQuestionType(null);
        setSelectedDok(null);
    };
    const handleTopicChange = (event) => { const topic = event.target.value; setSelectedTopics(prev => event.target.checked ? [...prev, topic] : prev.filter(t => t !== topic)); };
    const handleQuestionSelectionChange = (questionId, isSelected) => { setSelectedQuestionIds(prev => { const newSet = new Set(prev); if (isSelected) newSet.add(questionId); else newSet.delete(questionId); return newSet; }); };
    const handleDOKPillClick = (dok) => {
        console.log("Filtering by DOK:", dok);
        setSelectedDok(dok);
        setSearchTerm('');
        setSelectedTopics([]);
        setSelectedQuestionType(null);
    };
    const handleStandardPillClick = (standard) => console.log("Standard Pill Clicked:", standard);
    const handleTopicPillClick = (topicTitle) => {
        if (!topicTitle) return;
        console.log("Filtering by Topic:", topicTitle);
        setSelectedTopics([topicTitle]);
        setSearchTerm('');
        setSelectedQuestionType(null);
        setSelectedDok(null);
    };
    const handleQuestionTypeSelect = (typeValue) => {
         console.log("Filtering by Type (Button):", typeValue);
         setSelectedQuestionType(typeValue);
    };
    const handleTypePillClick = (typeValue) => {
        if (!typeValue) return;
        console.log("Filtering by Type (Pill):", typeValue);
        setSelectedQuestionType(typeValue);
        setSearchTerm('');
        setSelectedTopics([]);
        setSelectedDok(null);
    }
    const handleSubjectChange = (newTableName) => { if (newTableName !== currentSubjectTable) { setCurrentSubjectTable(newTableName); } };
    const handleGoToFinalize = () => { if (selectedQuestionsDetails.length === 0) return; navigate('/finalize', { state: { questions: selectedQuestionsDetails, analysis: dokAnalysis } }); };


    // --- Log State Right Before Render ---
    console.log("Rendering SelectionPage with state:", { loading, error, allQuestionsLength: allQuestions.length, filteredQuestionsLength: filteredQuestions.length, availableTopicsLength: availableTopics.length, selectedQuestionIdsSize: selectedQuestionIds.size, selectedDok, selectedQuestionType, selectedTopicsCount: selectedTopics.length, searchTerm });


    // --- Render Logic ---
    const currentSubjectLabel = SUBJECT_TABLES.find(s => s.tableName === currentSubjectTable)?.label || currentSubjectTable;
    return (
        <>
            <header className="app-header"> <h1>Math Question Generator</h1> </header>
            {error && !loading && ( <div className="global-error-container"> <p className="error-message">{error}</p> </div> )}
            <main className="main-content">
                {/* Filters Sidebar */}
                <aside className="filters-sidebar">
                    <h2>Filters</h2>
                    {/* Subject */}
                    <div className="filter-group subject-filter-group"><h3>Subject / Course</h3><select value={currentSubjectTable} onChange={(e) => handleSubjectChange(e.target.value)} className="subject-select" disabled={loading}>{SUBJECT_TABLES.map(subject => (<option key={subject.tableName} value={subject.tableName}>{subject.label}</option>))}</select></div>
                    {/* Search */}
                    <div className="filter-group"><input type="search" placeholder={`Search ${currentSubjectLabel}...`} value={searchTerm} onChange={handleSearchChange} disabled={loading} /><button onClick={handleResetFilters} className="reset-button filter-button" disabled={loading}>Reset Filters</button></div>
                    {/* Topics */}
                    <div className="filter-group topic-filter-group">
                        <h3>Topic</h3>
                        {loading ? (<p>Loading topics...</p>) : error ? null : availableTopics.length > 0 ? (<div className="topic-checklist">{availableTopics.map(topic => (<label key={topic} className="topic-label"><input type="checkbox" value={topic} checked={selectedTopics.includes(topic)} onChange={handleTopicChange} disabled={loading} />{topic}</label>))}</div>) : (<p>No topics found.</p>)}
                    </div>
                    {/* Display active DOK filter */}
                    {selectedDok !== null && <div className='filter-group' style={{paddingTop: '10px', borderTop: '1px solid #eee'}}><p style={{fontSize: '0.9em', fontStyle: 'italic', color: '#555', marginBottom: 0}}>Active DOK Filter: {selectedDok}</p></div>}
                </aside>

                {/* Questions List Section */}
                <section className="questions-list-section">
                    <h2>{currentSubjectLabel}: Available Questions ({filteredQuestions.length})</h2>
                    {/* Type Filters */}
                    {!loading && !error && allQuestions.length > 0 && (<div className="question-type-filter-group">{QUESTION_TYPE_FILTERS.map(filter => (<button key={filter.label} onClick={() => handleQuestionTypeSelect(filter.value)} className={`question-type-button ${selectedQuestionType === filter.value ? 'active' : ''}`} aria-pressed={selectedQuestionType === filter.value} disabled={loading}>{filter.label}</button>))}</div>)}
                    {/* Question Scroll Area */}
                    <div className="question-scroll-area">
                        {loading ? (<p className="loading-message">Loading questions for {currentSubjectLabel}...</p>)
                         : error ? null // Error is shown globally
                         : allQuestions.length === 0 ? (<p>No questions found for {currentSubjectLabel}.</p>)
                         : filteredQuestions.length === 0 ? (<p>No questions match the current filters for {currentSubjectLabel}.</p>)
                         : (
                            <>
                                {console.log("Rendering question list, filteredQuestions:", filteredQuestions)}
                                {filteredQuestions.map((question, index) => {
                                    // Access nested data safely
                                    const loText = question.success_criteria?.learning_intentions?.intention_text;
                                    const truncatedLO = loText ? (loText.substring(0, 80) + (loText.length > 80 ? '...' : '')) : null;

                                    // Use the new function for superscript rendering
                                    const formattedQuestionText = renderTextWithSuperscripts(question.question_text);

                                    const formattedType = formatQuestionTypeDisplay(question.question_type);
                                    const standard = question.success_criteria?.learning_intentions?.learning_intention_standards?.[0]?.standards;
                                    const standardDisplay = standard?.description;
                                    const topic = question.success_criteria?.learning_intentions?.topics;
                                    const topicDisplay = topic?.title;

                                    if (!question || typeof question.id === 'undefined') {
                                        console.warn(`Skipping rendering question at index ${index} due to missing data or ID.`);
                                        return null;
                                    }

                                    return (
                                        <div key={question.id} className="question-item">
                                            <input type="checkbox" checked={selectedQuestionIds.has(question.id)} onChange={(e) => handleQuestionSelectionChange(question.id, e.target.checked)} />
                                            <div className="question-details">
                                                {/* Render the formatted text */}
                                                <div className="question-text-display">{formattedQuestionText || '[No Text]'}</div>
                                                <div className="question-meta combination">
                                                     <div className="meta-pills">
                                                         {(question.dok !== null && question.dok !== undefined) && (<button className="pill-button dok-pill" onClick={() => handleDOKPillClick(question.dok)} title={`Filter by DOK: ${question.dok}`}><BsLightning className="pill-icon"/> DOK: {question.dok}</button>)}
                                                         {question.question_type && (<button className="pill-button type-pill" onClick={() => handleTypePillClick(question.question_type)} title={`Filter by Type: ${formattedType}`}><BsCardText className="pill-icon"/> Type: {formattedType}</button> )}
                                                         {standardDisplay && (<button className="pill-button standard-pill" onClick={() => handleStandardPillClick(standard)} title={`Filter by Standard: ${standardDisplay}`}><BsBookmark className="pill-icon"/> Std: {standardDisplay}</button>)}
                                                         {topicDisplay && (<button className="pill-button topic-pill" onClick={() => handleTopicPillClick(topicDisplay)} title={`Filter by Topic: ${topicDisplay}`}><BsTag className="pill-icon"/> Topic: {topicDisplay}</button>)}
                                                     </div>
                                                     {loText && <p className="meta-lo" title={loText}>{truncatedLO || loText}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </section>

                {/* Selected Panel */}
                <aside className="selected-panel">
                    <h2>Selected ({selectedQuestionIds.size})</h2>
                    <div className="selected-items-scroll-area">
                        {selectedQuestionIds.size === 0 ? (<p className="placeholder-text">Select questions using checkboxes.</p>)
                         : (
                            <ul className="selected-items-list">
                                {selectedQuestionsDetails.map(question => {
                                    // Use the new function for superscript rendering here too
                                    const formattedSelectedItemText = renderTextWithSuperscripts(question.question_text);
                                    const topicTitle = question.success_criteria?.learning_intentions?.topics?.title;
                                    return (
                                        <li key={question.id} className="selected-item">
                                            <div className="selected-item-details">
                                                {/* Render formatted text */}
                                                <div className="selected-item-text">{formattedSelectedItemText}</div>
                                                <div className="selected-item-meta">
                                                    <span>DOK: {question.dok ?? 'N/A'}</span>
                                                    {question.question_type && <span className="meta-type">Type: {formatQuestionTypeDisplay(question.question_type)}</span>}
                                                    {topicTitle && <span className="meta-topic">Topic: {topicTitle}</span>}
                                                </div>
                                            </div>
                                            <button onClick={() => handleQuestionSelectionChange(question.id, false)} className="remove-selected-btn" title="Remove">×</button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="selected-actions">
                        {selectedQuestionIds.size > 0 && !loading && (<button onClick={handleGoToFinalize} disabled={loading} className="action-button preview-button">Finalize & Arrange</button>)}
                        {selectedQuestionIds.size === 0 && !loading && (<p className='analysis-placeholder'>Select questions to continue.</p>)}
                    </div>
                </aside>
            </main>
        </>
    );
} // End of SelectionPage


// --- Main App Component ---
function App() {
    const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
    return (
        <div className="app-container">
             <Routes>
                <Route path="/" element={ <SelectionPage selectedQuestionIds={selectedQuestionIds} setSelectedQuestionIds={setSelectedQuestionIds} /> } />
                <Route path="/finalize" element={<FinalizePdfPage />} />
            </Routes>
        </div>
    );
}

export default App;