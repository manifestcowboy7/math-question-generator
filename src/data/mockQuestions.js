// src/data/mockQuestions.js
export const mockQuestions = [
    {
      id: 'q1',
      text: 'What is 2 + 2?',
      answer: '4',
      standard: 'CCSS.MATH.CONTENT.K.OA.A.1',
      learningObjective: 'Addition within 5',
      keywords: ['addition', 'basic', 'sum'],
      gradeLevel: 'K',
      difficulty: 'Easy',
    },
    {
      id: 'q2',
      text: 'Solve for x: 3x - 5 = 10',
      answer: 'x = 5',
      standard: 'CCSS.MATH.CONTENT.7.EE.B.4',
      learningObjective: 'Solve linear equations',
      keywords: ['algebra', 'equation', 'solve'],
      gradeLevel: '7',
      difficulty: 'Medium',
    },
    {
      id: 'q3',
      text: 'What is the area of a circle with radius 5?',
      answer: '25π',
      standard: 'CCSS.MATH.CONTENT.7.G.B.4',
      learningObjective: 'Calculate area of a circle',
      keywords: ['geometry', 'circle', 'area', 'pi'],
      gradeLevel: '7',
      difficulty: 'Medium',
    },
    {
      id: 'q4',
      text: 'Simplify the expression: (2x^2 + 3x - 1) + (x^2 - x + 5)',
      answer: '3x^2 + 2x + 4',
      standard: 'CCSS.MATH.CONTENT.HSA.APR.A.1',
      learningObjective: 'Add polynomials',
      keywords: ['algebra', 'polynomial', 'simplify'],
      gradeLevel: '9',
      difficulty: 'Medium',
    },
    // Add many more questions...
  ];
  
  // Helper to get unique values for filters
  export const getUniqueFilterValues = (questions) => {
    const standards = new Set();
    const objectives = new Set();
    const grades = new Set();
    const difficulties = new Set();
  
    questions.forEach(q => {
      if (q.standard) standards.add(q.standard);
      if (q.learningObjective) objectives.add(q.learningObjective);
      if (q.gradeLevel) grades.add(q.gradeLevel);
      if (q.difficulty) difficulties.add(q.difficulty);
    });
  
    return {
      standards: [...standards].sort(),
      objectives: [...objectives].sort(),
      grades: [...grades].sort(), // Consider custom sorting for grades (K, 1, 2...)
      difficulties: [...difficulties].sort(), // Consider custom order (Easy, Medium, Hard)
    };
  };