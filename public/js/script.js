// Make jsPDF globally available (since it's loaded from CDN)
const { jsPDF } = window.jspdf;

// DOM Elements
const minNumberInput = document.getElementById('minNumber');
const maxNumberInput = document.getElementById('maxNumber');
const numQuestionsInput = document.getElementById('numQuestions'); // New
const generatePreviewBtn = document.getElementById('generatePreviewBtn'); // Updated ID
const downloadBtn = document.getElementById('downloadBtn'); // New
const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const showAnswerBtn = document.getElementById('showAnswerBtn'); // Keep for single Q display if needed
const pdfPreviewContainer = document.getElementById('pdfPreviewContainer'); // New
const pdfPreview = document.getElementById('pdfPreview'); // New

// Global variable to store the generated PDF data URL
let pdfDataUrl = null;
// Global variable to store the jsPDF document instance for downloading
let pdfDoc = null;


// --- Helper Functions ---

function getRandomNumber(min, max) {
    // Ensure min and max are integers
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(min, max) {
    const num1 = getRandomNumber(min, max);
    const num2 = getRandomNumber(min, max);
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let questionText = `${num1} ${operator} ${num2}`;
    let answer;

    switch (operator) {
        case '+':
            answer = num1 + num2;
            break;
        case '-':
            // Optional: Ensure non-negative results if desired
            // if (num1 < num2) {
            //     questionText = `${num2} - ${num1}`; // Swap them
            //     answer = num2 - num1;
            // } else {
                 answer = num1 - num2;
            // }
            break;
        case '*':
            answer = num1 * num2;
            break;
        // Future: Add division, handle division by zero etc.
    }

    return { question: questionText, answer: answer };
}


// --- PDF Generation and Preview ---

function generateAndPreviewPdf() {
    const min = parseInt(minNumberInput.value);
    const max = parseInt(maxNumberInput.value);
    const count = parseInt(numQuestionsInput.value);

    // --- Input Validation ---
    if (isNaN(min) || isNaN(max) || isNaN(count)) {
        alert("Please enter valid numbers for all fields.");
        return;
    }
    if (min > max) {
        alert("Minimum number cannot be greater than maximum number.");
        return;
    }
     if (count <= 0 || count > 100) { // Basic count validation
        alert("Please enter a number of questions between 1 and 100.");
        return;
    }

    // --- Generate Questions ---
    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push(generateQuestion(min, max));
    }

    // --- Create PDF using jsPDF ---
    pdfDoc = new jsPDF(); // Store globally for download
    const pageHeight = pdfDoc.internal.pageSize.height;
    const pageWidth = pdfDoc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin; // Start position for text

    pdfDoc.setFontSize(18);
    pdfDoc.text("Math Practice Questions", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15; // Move down

    pdfDoc.setFontSize(12);
    pdfDoc.text(`Number Range: ${min} to ${max}`, margin, yPosition);
    yPosition += 10;

    pdfDoc.line(margin, yPosition, pageWidth - margin, yPosition); // Separator line
    yPosition += 10;

    questions.forEach((q, index) => {
        const questionText = `${index + 1}. ${q.question} = ?`;
        const answerText = `   Answer: ${q.answer}`; // Indent answer slightly

        // Check if content exceeds page height
        if (yPosition + 20 > pageHeight - margin) { // Estimate space needed for Q&A
            pdfDoc.addPage();
            yPosition = margin; // Reset Y position for new page
        }

        pdfDoc.text(questionText, margin, yPosition);
        yPosition += 8; // Space between question and answer
        pdfDoc.text(answerText, margin, yPosition);
        yPosition += 12; // Space before next question
    });

    // --- Generate Data URL and Display Preview ---
    try {
        pdfDataUrl = pdfDoc.output('datauristring'); // Generate PDF as Data URI
        pdfPreview.src = pdfDataUrl;
        pdfPreviewContainer.classList.remove('hidden'); // Show the preview area
        downloadBtn.disabled = false; // Enable download button
        console.log("PDF generated and preview updated.");

        // Optionally display the first generated question in the old section
        if (questions.length > 0) {
            questionEl.textContent = questions[0].question + " = ?";
            answerEl.textContent = "Answer: " + questions[0].answer;
            answerEl.classList.add('hidden'); // Keep answer hidden initially
            showAnswerBtn.classList.remove('hidden'); // Show the 'Show Answer' button
            // Re-attach or ensure showAnswerBtn listener works if needed
        } else {
             questionEl.textContent = "No questions generated.";
             answerEl.classList.add('hidden');
             showAnswerBtn.classList.add('hidden');
        }

    } catch (error) {
        console.error("Error generating or displaying PDF:", error);
        alert("Failed to generate PDF preview. Check console for details.");
        pdfPreviewContainer.classList.add('hidden');
        downloadBtn.disabled = true;
        pdfDataUrl = null; // Reset data URL on error
        pdfDoc = null; // Reset doc on error
    }
}


// --- Download PDF ---
function downloadPdf() {
    if (pdfDoc) {
        try {
            pdfDoc.save('math-questions.pdf'); // Use jsPDF's save method
            console.log("PDF download initiated.");
        } catch(error) {
             console.error("Error initiating PDF download:", error);
             alert("Failed to download PDF. Check console for details.");
        }
    } else {
        alert("No PDF generated yet. Please click 'Generate & Preview PDF' first.");
        console.warn("Download attempted before PDF was generated.");
    }
}

// --- Event Listeners ---
generatePreviewBtn.addEventListener('click', generateAndPreviewPdf);
downloadBtn.addEventListener('click', downloadPdf);

// Optional: Keep the show answer functionality for the single displayed question
showAnswerBtn.addEventListener('click', () => {
    answerEl.classList.toggle('hidden');
});

// --- Initial Setup ---
// Disable download button initially on page load
downloadBtn.disabled = true;
// Hide PDF preview initially
pdfPreviewContainer.classList.add('hidden');
// Optionally hide the single question display until generation
// questionEl.textContent = 'Set parameters and click Generate & Preview PDF.';
// showAnswerBtn.classList.add('hidden');