# FactCheck Agent

A web application that automatically verifies factual claims found inside PDF documents.

Upload a PDF, and the system will:

* Extract important factual claims
* Search the live web for supporting evidence
* Verify whether each claim is accurate
* Flag misleading or outdated information
* Provide corrected facts when available

This project was built as part of a Product Management Trainee assessment focused on AI-powered fact verification.

## Live Demo

🌐 https://check-facts.vercel.app/

## GitHub Repository

📂 https://github.com/shobhit7781/Check-Facts

## Problem Statement

Marketing reports, research documents, business presentations, and AI-generated content often contain:

* Outdated statistics
* Incorrect percentages
* Wrong dates
* Hallucinated AI outputs
* Misleading factual claims

Manually checking every statement is time-consuming.

FactCheck Agent acts as a verification layer that automatically checks claims against current information available on the web.

## Features

### PDF Upload

Upload any PDF document through a simple web interface.

### Automatic Claim Extraction

The system identifies verifiable claims such as:

* Statistics
* Percentages
* Financial figures
* Dates
* Technical facts
* Company-related information

### Live Fact Verification

Each extracted claim is verified using real-time web search.

### Smart Classification

#### ✅ Verified

The claim matches reliable current information.

#### ⚠️ Inaccurate

The claim is partially correct but contains outdated or incorrect values.

#### ❌ False

No reliable evidence supports the claim.

### Correct Fact Suggestions

When a claim is inaccurate or false, the system attempts to provide the latest verified information.

### Interactive Results Dashboard

Users receive:

* Verification status
* Explanation
* Corrected information
* Summary statistics

## How It Works

### Step 1: Upload PDF

The user uploads a PDF document.

### Step 2: Extract Text

PDF.js extracts text directly in the browser.

### Step 3: Identify Claims

Llama 3.3 70B identifies important factual claims from the document.

### Step 4: Verify Claims

Groq Compound performs live web-based verification.

### Step 5: Generate Report

The application returns a structured report containing:

* Verified claims
* Inaccurate claims
* False claims
* Correct facts

## Technology Stack

### Frontend

* HTML
* CSS
* Vanilla JavaScript
* PDF.js

### AI Models

#### Claim Extraction

* Llama 3.3 70B Versatile

#### Fact Verification

* Groq Compound
* Built-in Web Search

### Deployment

* Vercel

## Project Structure

```text
Check-Facts/
│
├── index.html
├── api/
│   └── chat.js
├── package.json
└── README.md
```

## Running Locally

### Clone Repository

```bash
git clone https://github.com/shobhit7781/Check-Facts.git
cd Check-Facts
```

### Install Vercel CLI

```bash
npm install -g vercel
```

### Add Environment Variable

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
```

### Start Development Server

```bash
vercel dev
```

Open:

```text
http://localhost:3000
```

## Deployment

The application is deployed on Vercel.

### Deployment Steps

1. Push project to GitHub.
2. Import repository into Vercel.
3. Add `GROQ_API_KEY` as an Environment Variable.
4. Deploy.

The application will be available through a public URL.

## Example Workflow

### Input PDF Claim

> Twitter has 330 million monthly active users.

### Output

**Verdict:** Inaccurate

**Explanation:** Current reporting methods differ and this statistic is no longer considered accurate.

**Correct Fact:** X primarily reports monetizable daily active users rather than monthly active users.

## Assessment Requirements Covered

* ✅ PDF Upload Interface
* ✅ Automated Claim Extraction
* ✅ Live Web Verification
* ✅ Verified / Inaccurate / False Classification
* ✅ Correct Fact Suggestions
* ✅ Public Deployment
* ✅ GitHub Repository
* ✅ User-Friendly Interface

## Known Limitations

* The application checks up to 10 claims per document.
* Extremely large PDFs may not have every claim analyzed.
* Verification quality depends on available web sources.
* Some specialized claims may require manual review.

## Future Improvements

* Source citations for every verification result
* Confidence scores for claims
* Downloadable verification reports
* Support for DOCX and web URLs
* Bulk document processing
* Overall document trust score

## Author

**Shobhit Arora**

GitHub: https://github.com/shobhit7781/Check-Facts

Live Application: https://check-facts.vercel.app/

Built using Groq, PDF.js, JavaScript, and Vercel.
