# Astra QA Chrome Extension

## Overview
The Astra QA Chrome Extension is designed to enhance the quality assurance process by providing tools for design analysis and feedback directly within the browser. This extension interacts with web pages and communicates with a backend server to process requests and deliver insights.

## Features
- **Design Analysis**: Leverage the Anthropic API to analyze designs and provide feedback.
- **User-Friendly Popup**: Access tools and features through an intuitive popup interface.
- **Background Processing**: Efficiently manage events and interactions in the background.

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd astra-qa-extension
   ```
3. Install the necessary dependencies for the backend:
   ```
   cd backend
   npm install
   ```

## Usage
1. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory.
2. Click on the extension icon to open the popup and start using the features.

## Backend Deployment
The backend is designed to be deployed on Vercel. Ensure you have the Vercel CLI installed and configured. To deploy:
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Deploy using Vercel:
   ```
   vercel
   ```

## Contribution
Contributions are welcome! Please fork the repository and submit a pull request with your changes. Ensure to follow the coding standards and include tests for new features.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.