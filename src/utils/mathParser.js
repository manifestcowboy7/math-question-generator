// src/utils/mathParser.js
import React from 'react'; // Make sure React is imported if using JSX

/**
 * Parses a string containing simple math notation (^ for superscript, _ for subscript)
 * Handles single characters, alphanumeric sequences, or expressions in () or {} after ^ or _.
 * Example: "x^2 + y_1 + z^(n+1)" -> ["x", <sup>2</sup>, " + y", <sub>1</sub>, " + z", <sup>n+1</sup>]
 */
function parseMathText(text) {
  if (!text) return '';

  const parts = [];
  let currentText = '';
  let keyIndex = 0; // Unique key index

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    // Check for Superscript or Subscript trigger
    if ((char === '^' || char === '_') && nextChar) {
      const Tag = char === '^' ? 'sup' : 'sub'; // Determine the tag type
      let scriptContent = '';
      let scriptFound = false;
      let endIndex = i; // Track the end of the script part

      // --- Check for Parentheses/Braces ---
      if (nextChar === '(' || nextChar === '{') {
        const openBracket = nextChar;
        const closeBracket = openBracket === '(' ? ')' : '}';
        let nestingLevel = 1;
        let scriptStartIndex = i + 2; // Start capturing after '^(' or '^{'

        for (let j = scriptStartIndex; j < text.length; j++) {
          if (text[j] === openBracket) {
            nestingLevel++;
          } else if (text[j] === closeBracket) {
            nestingLevel--;
            if (nestingLevel === 0) {
              // Found the matching closing bracket
              scriptContent = text.substring(scriptStartIndex, j);
              endIndex = j; // Update the end index
              scriptFound = true;
              break; // Exit inner loop
            }
          }
        }
        // If loop finished without finding match (nestingLevel !== 0), treat as error/literal
        if (!scriptFound) {
           console.warn(`Mismatched bracket '${openBracket}' starting at index ${i+1} in string: ${text}`);
           // Fallback: treat the trigger char literally
           currentText += char;
           continue; // Skip script processing for this char
        }

      // --- Check for Alphanumeric Sequence ---
      } else if (/^[a-zA-Z0-9]/.test(nextChar)) {
        let scriptStartIndex = i + 1;
        endIndex = scriptStartIndex;
        // Capture contiguous alphanumeric characters
        while (endIndex < text.length && /^[a-zA-Z0-9]/.test(text[endIndex])) {
          endIndex++;
        }
        scriptContent = text.substring(scriptStartIndex, endIndex);
        endIndex--; // Adjust index as the loop goes one past
        scriptFound = true;
      }

      // --- Add the parsed part ---
      if (scriptFound && scriptContent) {
        if (currentText) {
          parts.push(currentText); // Push preceding text
          currentText = '';
        }
        parts.push(React.createElement(Tag, { key: `${Tag}-${keyIndex++}` }, scriptContent));
        i = endIndex; // Jump the main loop index past the processed script
      } else {
        // If no valid script found after ^ or _, treat the trigger char literally
        currentText += char;
      }

    // --- Handle regular characters ---
    } else {
      currentText += char;
    }
  }

  // Add any remaining text
  if (currentText) {
    parts.push(currentText);
  }

  // Fallback if parsing somehow resulted in empty parts for non-empty text
  if (parts.length === 0 && text) {
    return text;
  }

  return parts; // Return the array of strings and elements
}

export default parseMathText;