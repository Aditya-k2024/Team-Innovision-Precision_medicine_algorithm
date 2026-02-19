# PharmaGuard: Pharmacogenomic Risk Prediction System

A **Precision Medicine Algorithm** that parses VCF (Variant Call Format) files, cross-references pharmacogenomic variants against a curated drug–gene interaction database, and predicts patient-specific drug risks with AI-powered clinical explanations.

## Architecture

```
┌─────────────────────┐      ┌──────────────────────────┐
│   Next.js Frontend  │      │   Python FastAPI Backend  │
│   (Port 3000)       │─────▶│   (Port 8000)            │
│                     │      │                          │
│  • File Upload      │      │  • VCF v4.2 Parser       │
│  • Drug Selector    │      │  • Pharma Engine          │
│  • Results Panel    │      │  • Drug-Gene Database     │
│  • Groq LLM        │      └──────────────────────────┘
└─────────────────────┘
```

## Quick Start

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
# Add your Groq API key to .env.local
npm run dev
```

### 3. Open [http://localhost:3000](http://localhost:3000)

## Supported Drugs & Genes

| Drug | Gene(s) |
|------|---------|
| Warfarin | CYP2C9, VKORC1 |
| Clopidogrel | CYP2C19 |
| Codeine | CYP2D6 |
| Simvastatin | SLCO1B1 |
| Fluorouracil | DPYD |
| Azathioprine | TPMT |
| Irinotecan | UGT1A1 |
| Tacrolimus | CYP3A5 |
| Abacavir | HLA-B |
| Carbamazepine | HLA-B |

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Vanilla CSS
- **Backend**: Python 3, FastAPI, Pydantic
- **AI**: Groq API (Llama 3.3 70B)
