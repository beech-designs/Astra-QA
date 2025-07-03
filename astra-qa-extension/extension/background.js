// This file contains the background script for the extension, which runs in the background and manages events such as browser actions and messages from content scripts.

chrome.runtime.onInstalled.addListener(() => {
    console.log("Astra QA Extension installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getData") {
        // Handle the request from content script or popup
        sendResponse({ data: "Sample data from background script." });
    }
});

// Additional event listeners can be added here as needed.