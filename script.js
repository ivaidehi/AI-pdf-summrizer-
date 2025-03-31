document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('pdfInput');
    const uploadBox = document.querySelector('.upload-box');
    const extractBtn = document.getElementById('extractBtn');
    const summaryText = document.getElementById('summaryText');
    const spinner = document.getElementById('spinner'); // Spinner element

    // Load PDF.js library
    if (typeof pdfjsLib === 'undefined') {
        console.error("PDF.js library is not loaded. Check your script path.");
        alert("PDF.js is not loaded. Please check your console.");
        return;
    }

    // Handle file selection
    uploadBox.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            uploadBox.classList.add('file-selected');
            uploadBox.querySelector('p').innerText = `Selected: ${file.name}`;
        }
    });

    // Extract & Summarize PDF
    extractBtn.addEventListener('click', async function () {
        if (fileInput.files.length === 0) {
            alert('Please select a PDF file.');
            return;
        }

        // Show the spinner
        spinner.style.display = 'block';
        summaryText.value = "";  // Clear previous text
        summaryText.style.color = "white";  // Change text color
        summaryText.style.fontSize = "16px";  // Adjust font size
        summaryText.style.textAlign = "center"; // Center align the text
        summaryText.style.height = "120px"; // Reset height before updating content

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = async function () {
            try {
                const typedArray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                let extractedText = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    extractedText += textContent.items.map(item => item.str).join(" ") + "\n";
                }

                console.log("Extracted Text:", extractedText);
                if (!extractedText.trim()) {
                    alert("No text extracted. The PDF may be scanned or empty.");
                    summaryText.value = ""; // Clear text area if extraction fails
                    spinner.style.display = 'none'; // Hide the spinner
                    return;
                }

                // Call AI API to summarize text
                summarizeText(extractedText);
            } catch (error) {
                console.error("Error extracting text from PDF:", error);
                alert("Error extracting text from PDF.");
                summaryText.value = ""; // Clear text area on error
                spinner.style.display = 'none'; // Hide the spinner
            }
        };

        reader.readAsArrayBuffer(file);
    });

    // Summarization API Call
    async function summarizeText(text) {
        const API_KEY = 'NLKdBYTMQaUPPb7p0hTA51OEqcMhkrsRHd2OKYnP'; // Replace with a valid API Key
        const API_URL = "https://api.cohere.ai/v1/summarize";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: text,
                    length: "medium"
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("API Response:", data);
            if (data.summary) {
                summaryText.value = data.summary;
                adjustTextareaHeight(summaryText);
            } else {
                alert("Summarization failed. Check API response.");
                summaryText.value = ""; // Clear text area on failure
            }
        } catch (error) {
            console.error("Error summarizing text:", error);
            alert("Failed to summarize the text. Check console for details.");
            summaryText.value = ""; // Clear text area on error
        } finally {
            spinner.style.display = 'none'; // Hide the spinner after process completes
        }
    }

    // Function to adjust textarea height dynamically
    function adjustTextareaHeight(element) {
        element.style.height = "auto";
        element.style.height = element.scrollHeight + "px";
    }

});
