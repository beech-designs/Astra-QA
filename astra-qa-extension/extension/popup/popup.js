// This file contains the JavaScript logic for the popup interface, handling user interactions and displaying information.

document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('analyze-button');
    const resultContainer = document.getElementById('result-container');

    button.addEventListener('click', async function() {
        const inputText = document.getElementById('input-text').value;

        if (inputText) {
            try {
                const response = await fetch('https://your-backend-url/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: inputText }),
                });

                const data = await response.json();
                resultContainer.textContent = data.result || 'No result returned.';
            } catch (error) {
                console.error('Error:', error);
                resultContainer.textContent = 'An error occurred while processing your request.';
            }
        } else {
            resultContainer.textContent = 'Please enter some text to analyze.';
        }
    });
});