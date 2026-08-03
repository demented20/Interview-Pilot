# InterviewPilot AI

> **🏆 Best Upcoming Edition Award**  at Hackathon Weekly  

## Hackathon Project Overview

InterviewPilot AI is an AI-powered mock interview simulator developed
during a hackathon. The project demonstrates how artificial intelligence
can improve interview preparation by generating personalized interview
questions, analyzing candidate responses, and providing detailed
performance feedback.

The application runs locally with a browser-based frontend and a
lightweight Python backend that securely communicates with the OpenRouter
AI API.

Users can configure an interview based on their desired position,
difficulty level, and interview type. The system then generates relevant
questions, allows users to answer through text or voice, evaluates
responses using AI, and produces a final performance report.

------------------------------------------------------------------------

# Features

## AI-Generated Interviews

InterviewPilot AI creates personalized interview sessions based on:

-   Target position
-   Difficulty level
-   Interview type:
    -   Technical
    -   Behavioral
    -   Mixed

The AI generates structured interview questions designed for the
selected role.

------------------------------------------------------------------------

## AI Answer Evaluation

Candidate answers are analyzed by AI based on:

-   Technical accuracy
-   Communication quality
-   Clarity
-   Confidence
-   Problem-solving ability
-   Relevance
-   Answer consistency

The system provides:

-   Overall score
-   Category scores
-   Strengths
-   Improvement suggestions
-   Keyword analysis

------------------------------------------------------------------------

## Voice Interview Experience

The platform supports voice-based interaction using browser APIs.

Features:

-   Speech-to-text answers
-   Text-to-speech question reading
-   Voice activity detection
-   Live audio-level monitoring

------------------------------------------------------------------------

## Camera Support

The application includes local webcam functionality:

-   Start and stop camera
-   Live preview
-   Permission handling

Camera and microphone data remain local and are not sent to the AI
service.

------------------------------------------------------------------------

## Final Performance Report

After completing an interview, users receive:

-   Overall performance score
-   Category analysis
-   Radar chart visualization
-   Improvement recommendations
-   Exportable results

------------------------------------------------------------------------

# Technology Stack

## Frontend

-   HTML5
-   CSS3
-   Vanilla JavaScript ES Modules

Frontend structure:

    css/
    ├── main.css
    ├── components.css
    ├── layout.css
    └── animations.css

    js/
    ├── app.js
    ├── utils.js
    │
    ├── core/
    │   ├── api.js
    │   ├── engine.js
    │   ├── state.js
    │   └── storage.js
    │
    └── ui/
        ├── dashboard.js
        ├── interview.js
        ├── landing.js
        ├── router.js
        └── setup.js

------------------------------------------------------------------------

## Backend

The backend is built using Python standard libraries.

Responsibilities:

-   Serve frontend files
-   Handle AI communication
-   Protect API credentials
-   Proxy requests to OpenRouter

Main files:

    server.py
    backend-config.json

------------------------------------------------------------------------

## AI Integration

The project uses:

-   OpenRouter Chat Completions API
-   Qwen model: `qwen/qwen3.7-plus`

The API key is stored on the backend side and is never exposed in
frontend code.

------------------------------------------------------------------------

# Application Architecture

    User
     |
     v
    Browser Interface
     |
     v
    JavaScript Application
     |
     +----------------+
     |                |
     v                v
    UI Modules     Core Engine
                      |
                      v
                  API Handler
                      |
                      v
                Python Backend
                      |
                      v
                OpenRouter AI

------------------------------------------------------------------------

# Setup Instructions

## 1. Clone the Repository

``` bash
git clone <repository-url>
```

Navigate to the project:

``` bash
cd interviewpilot
```

------------------------------------------------------------------------

## 2. Configure API Key

### Getting an OpenRouter API Key

InterviewPilot AI uses OpenRouter to access AI models. To obtain an API key:

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign in or create a new account
3. Open the API Keys section
4. Create a new API key
5. Copy the generated key

Edit:

    backend-config.json

Example:

``` json
{
    "openrouter_api_key": "YOUR_OPENROUTER_API_KEY",
    "openrouter_model": "qwen/qwen3.7-plus"
}
```
6. Paste it into the `openrouter_api_key` field inside `backend-config.json`
------------------------------------------------------------------------

## 3. Start the Server

Run:

``` bash
python server.py
```

------------------------------------------------------------------------

## 4. Open the Application

Visit:

    http://localhost:8080

Do not open `index.html` directly using `file://` because the
application uses JavaScript modules and browser media APIs.

------------------------------------------------------------------------

# Project Flow

## Interview Setup

The user selects:

-   Position
-   Difficulty
-   Interview type

------------------------------------------------------------------------

## Question Generation

The request flow:

    Setup
     |
     v
    Interview Engine
     |
     v
    API Module
     |
     v
    Python Backend
     |
     v
    OpenRouter AI
     |
     v
    Generated Questions

------------------------------------------------------------------------

## Interview Session

Users can:

-   View questions
-   Listen to questions
-   Type answers
-   Speak answers
-   Track progress
-   Submit responses

------------------------------------------------------------------------

## AI Evaluation

Answer processing flow:

    User Answer
     |
     v
    AI Evaluation
     |
     v
    Score + Feedback
     |
     v
    Final Report

------------------------------------------------------------------------

# Folder Structure

    interviewpilot/

    ├── index.html
    ├── server.py
    ├── backend-config.json
    │
    ├── assets/
    │   └── logo.svg
    │
    ├── css/
    │   ├── main.css
    │   ├── components.css
    │   ├── layout.css
    │   └── animations.css
    │
    └── js/
        ├── app.js
        ├── utils.js
        │
        ├── core/
        │   ├── api.js
        │   ├── engine.js
        │   ├── state.js
        │   └── storage.js
        │
        └── ui/
            ├── dashboard.js
            ├── interview.js
            ├── landing.js
            ├── router.js
            └── setup.js

------------------------------------------------------------------------

# Important Files

## server.py

Runs the local backend server and manages AI API communication.

## api.js

Handles:

-   AI requests
-   Prompt generation
-   Response processing

## engine.js

Controls:

-   Interview lifecycle
-   Question progression
-   Answer submission
-   Report generation

## state.js

Stores the current interview state.

## interview.js

Controls:

-   Interview interface
-   Voice features
-   Camera preview
-   Timers
-   Feedback display

## dashboard.js

Displays the final interview results and visualizations.

------------------------------------------------------------------------

# Limitations

-   Voice activity detection is a lightweight implementation.
-   Camera and microphone processing are local browser features.
-   AI responses may occasionally require JSON correction.

------------------------------------------------------------------------

# Future Improvements

Potential improvements include:

-   User accounts
-   Cloud interview history
-   Advanced analytics
-   Multiple AI provider support
-   Real-time conversational AI interviewer
-   More advanced voice analysis

------------------------------------------------------------------------

# Hackathon Team Contribution
## Team

This project was built by:

- MADANI ALAOUI YOUNESS : Frontend Development & UI/UX, Backend 
- AIT MANNA IMANE : Logic & AI Integration

Special shout-out to **[AIT MANNA IMANE](https://github.com/ait2005manna-pixel)** for being an amazing hackathon partner! 
## Frontend/Backend Development

Responsible for:

-   User interface
-   Interview screens
-   Dashboard design
-   Animations
-   Browser interactions
-   Interview engine

## Logic and AI Integration

Responsible for:

-   AI communication
-   State management
-   Evaluation system
-   Report generation

------------------------------------------------------------------------

# License

This project was developed as a hackathon prototype for educational and
demonstration purposes.
