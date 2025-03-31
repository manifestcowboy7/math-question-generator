import React from 'react';
import QuestionItem from '../QuestionItem/QuestionItem'; // Import child component
import styles from './QuestionList.module.css';

function QuestionList({ questions, selectedIds, onSelect, onPreview }) {

  if (!questions || questions.length === 0) {
    // Handled in App.js, but good fallback
    return <p className={styles.noQuestions}>No questions match the current filters.</p>;
  }

  return (
    <ul className={styles.questionList}>
      {questions.map((question) => (
        <QuestionItem
          key={question.id} // Essential for list rendering
          question={question}
          isSelected={selectedIds.includes(question.id)}
          onSelect={onSelect} // Pass handler down
          onPreview={onPreview} // Pass handler down (if implemented)
        />
      ))}
    </ul>
  );
}

export default QuestionList;