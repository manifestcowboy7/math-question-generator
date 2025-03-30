import React from 'react';
import styles from './QuestionItem.module.css';

function QuestionItem({ question, isSelected, onSelect }) {
  // --- Use correct column names from your schema ---
  const questionText = question.question_text || "[No question text]";
  const standard = question.standard || null;
  const learningObjective = question.learning_objective || null;
  const topic = question.topic || null;
  // const dok = question.dok !== null ? question.dok : null; // Example if you want to show DOK level

  const handleSelectChange = () => {
    onSelect(question.id);
  };

  return (
    <li className={`${styles.questionItem} ${isSelected ? styles.selected : ''}`}>
      <div className={styles.checkboxContainer}>
        <input
          type="checkbox"
          id={`q-${question.id}`}
          checked={isSelected}
          onChange={handleSelectChange}
          aria-label={`Select question: ${questionText.substring(0, 70)}...`}
        />
      </div>
      <div className={styles.questionContent}>
         <label htmlFor={`q-${question.id}`} className={styles.questionText}>
            {/* Display the actual question text */}
            {questionText}
         </label>
         {/* Display other useful info */}
         <div className={styles.metaInfo}>
             {topic && <span className={styles.metaTag}>Topic: {topic}</span>}
             {standard && <span className={styles.metaTag} title={standard}>Std: {standard.length > 25 ? standard.substring(0, 25) + '...' : standard}</span>}
             {learningObjective && <span className={styles.metaTag} title={learningObjective}>LO: {learningObjective.length > 30 ? learningObjective.substring(0, 30) + '...' : learningObjective}</span>}
             {/* {dok !== null && <span className={styles.metaTag}>DOK: {dok}</span>} */}
         </div>
      </div>
    </li>
  );
}

export default QuestionItem;