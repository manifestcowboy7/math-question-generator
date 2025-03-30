import { supabase } from '../supabaseClient';

// (Keep getUniqueFilterValues function as is)
const getUniqueFilterValues = (questions) => { /* ... */ };

export const fetchQuestions = async () => {
  console.log("[questionService] fetchQuestions: STARTING..."); // Log start
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*');

    // Log detailed results *after* await completes
    if (error) {
      console.error('[questionService] fetchQuestions: Supabase fetch ERROR:', error);
    } else {
      console.log(`[questionService] fetchQuestions: Supabase fetch SUCCESS - Received ${data ? data.length : 0} items.`);
      // console.log('[questionService] fetchQuestions: Sample data:', data ? data.slice(0, 2) : 'null'); // Log first few items
    }

    // Always return data or empty array, handle error status in caller if needed
    return data || [];

  } catch (catchError) {
      // Catch unexpected errors during the await/fetch process itself
      console.error('[questionService] fetchQuestions: UNEXPECTED CATCH BLOCK ERROR:', catchError);
      return []; // Return empty array on unexpected error
  } finally {
      console.log("[questionService] fetchQuestions: FINISHED."); // Log finish
  }
};

// (Keep fetchFilterOptions function as is)
export const fetchFilterOptions = async (allQuestions) => { /* ... */ };