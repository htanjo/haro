# Haro

> Talking robot in Gundam.

## Overview

This is a browser-based chat interface powered by the Gemini API.  
It runs locally with no login required.

The app demonstrates the use of modern Web APIs including:

- Web Speech API for voice input
- Web Audio API for real-time audio effects

Built with:

- TypeScript
- Vite + React (frontend)
- Express (backend)

## Requirements

- Node.js (v20 or later)
- Chrome

## Running Locally

1. Clone this repository:

   ```bash
   git clone git@github.com:htanjo/haro.git
   cd your-repo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add your Gemini API key:

   ```env
   GEMINI_API_KEY="your-api-key-here"
   ```

   You can obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open you browser and navigate to <http://localhost:5173>.

## License

This project is licensed under the **MIT License**.  
© 2025 htanjo. All rights reserved.

### Trademarks & Copyrights

- “Gundam” and related characters (including "Haro") are the property of **Sunrise**, a subsidiary of **Bandai Namco Filmworks**, and **Sotsu**.
- This project is a fan-made application and is **not affiliated with, or endorsed by, Sunrise or Bandai Namco**.
- All Gundam and Haro trademarks and images are used for educational and non-commercial purposes only.
