# LLM Text Enhancer Chrome Extension

## Overview

The "LLM Text Enhancer" is a Chrome extension (Manifest V3) designed to seamlessly integrate the power of the Google Gemini API into your web browsing experience. It allows users to select any text on a webpage and, with a single click, send it to the Gemini API for enhancement. The original text is then replaced with the improved version, offering a quick and efficient way to refine content directly within your browser.

## Features

*   **Floating "Enhance" Button:** A discreet button appears next to selected text, providing an intuitive way to trigger the enhancement process.
*   **In-Place Text Replacement:** The original selected text is automatically replaced with the Gemini API's enhanced output, streamlining your workflow.
*   **Configurable Gemini API Key:** Users can easily set and manage their Google Gemini API key through a dedicated options page, ensuring secure and personalized access to the API.
*   **Customizable Enhancement Prompt:** Users can define their own prompt to guide the Gemini API's text enhancement, allowing for flexible and tailored text transformations.

## File Structure

This project is organized into the following files, each serving a specific purpose:

*   `manifest.json`: The core manifest file for the Chrome extension. It defines the extension's metadata, permissions, background scripts, content scripts, and options page.
*   `content.js`: This script is injected into web pages. It handles text selection, displays the "Enhance" button, sends selected text to the background script, and replaces the text with the enhanced version.
*   `background.js`: The service worker script that runs in the background. It listens for messages from `content.js`, retrieves the Gemini API key, makes requests to the Google Gemini API, and sends the enhanced text back to `content.js`.
*   `options.html`: The HTML page for the extension's options. It provides a user interface for entering and saving the Gemini API key.
*   `options.js`: The JavaScript file for `options.html`. It handles saving and loading the API key to and from `chrome.storage`.
*   `styles.css`: Contains the CSS rules for styling the "Enhance" button and the options page, ensuring a clean and consistent user interface.

## Setup and Usage

### Installation

1.  **Download the Extension:** (Instructions for downloading the packaged extension will go here once built, or users can load it as an unpacked extension).
2.  **Load as Unpacked Extension (for development):**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" (usually a toggle in the top right corner).
    *   Click "Load unpacked" and select the directory containing the extension files.

### Setting Your Gemini API Key and Custom Prompt

1.  **Obtain a Gemini API Key:** If you don't have one, visit the Google AI Studio (or relevant Google Cloud Console page) to generate a Gemini API key.
2.  **Access Extension Options:**
    *   Right-click on the "LLM Text Enhancer" extension icon in your Chrome toolbar.
    *   Select "Options" (or "Extension options").
3.  **Enter API Key and Custom Prompt:** In the options page, paste your Gemini API key into the provided input field. Optionally, you can also enter a custom prompt in the text area to guide the Gemini API's text enhancement (e.g., "Summarize this text:", "Translate to French:"). If left blank, a default prompt will be used.
4.  **Save:** Click the "Save" button. You should see a confirmation message.

### Enhancing Text

1.  **Navigate to a Webpage:** Go to any webpage with text you wish to enhance.
2.  **Select Text:** Highlight the desired text using your mouse.
3.  **Click "Enhance":** A small, floating "Enhance" button will appear near your selection. Click this button.
4.  **View Enhanced Text:** The selected text will be replaced with the improved version generated by the Gemini API.