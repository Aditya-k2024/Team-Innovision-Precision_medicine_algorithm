# PharmaGuard 🧬

> **Precision Medicine, Powered by Genomics & AI**

![PharmaGuard Banner](https://img.shields.io/badge/PharmaGuard-Precision_Medicine-6366f1?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi) ![Groq AI](https://img.shields.io/badge/AI-Groq_Llama3-f59e0b?style=for-the-badge)

### 🚀 **Live Demo:** [https://pharmaguard-frontend.onrender.com/](https://pharmaguard-frontend.onrender.com/)

PharmaGuard is a comprehensive pharmacogenomic (PGx) clinical decision support system. It parses patient genetic data (VCF files), identifies critical variants in drug-metabolizing enzymes (CYP450, TPMT, etc.), and predicts potential adverse drug reactions using established CPIC guidelines and AI-driven insights.

## 🎯 Problem Statement: Precision Medicine Algorithm
<!-- Add detailed problem statement here -->

## 🎥 Demo Video
<!-- Add LinkedIn/Live video link here -->
- **LinkedIn Post:**- https://www.linkedin.com/posts/aditya-kumar-107a9532a_rift2026-pharmaguard-pharmacogenomics-activity-7430417008665468929-r_NO?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFMZE1cBx9U4YR03u0PQwT6pzJZOjSjdHmM
  
- **Video:**- https://drive.google.com/file/d/1oW_knxn73hvpCBRl10GOswcdJx3WM2mA/view?usp=sharing

## ✨ Features

- **⚡ Real-time VCF Parsing**: Instant browser-based parsing of large VCF variant files.
- **💊 Multi-Drug Analysis**: Screen against a curated database of high-risk medications (Warfarin, Clopidogrel, Statins, etc.).
- **🤖 AI Clinical Insights**: Generates plain-English explanations of complex gene-drug interactions using Llama 3 via Groq.
- **📊 Advanced Visualization**:
  - **Radar Charts**: Compare risk profiles across multiple drugs.
  - **Gene Maps**: Interactive chromosome ideograms showing variant locations.
  - **Metabolic Pathways**: Visual diagrams of drug metabolism (Drug → Enzyme → Metabolite).
- **⚠️ Drug-Drug Interactions**: Detects shared CYP pathways to prevent competitive inhibition risks.
- **📄 Clinical Reports**: Generate standard PDF reports for medical records.
- **🎨 Premium UX**: Dynamic DNA background, dark/light mode, guided onboarding tour, and keyboard shortcuts.

## 🏗️ Tech Stack

### Frontend (Port 3000)
- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Vanilla CSS (Performance focused, Glassmorphism design)
- **Visualization**: Chart.js, Custom SVG components
- **State/Logic**: Custom Hooks (`useAnalysis`, `useKeyboardShortcuts`)

### Backend (Port 8000)
- **Framework**: FastAPI (Python 3.9)
- **Genomics**: `PyVCF` for parsing, Custom variant matcher
- **Validation**: Pydantic models
- **Testing**: Pytest

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **AI Inference**: Groq Cloud API (Llama 3-70b-versatile)

## 🚀 Getting Started

### Option A: Docker (Recommended)

The easiest way to run the full stack.

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/pharmaguard.git
    cd pharmaguard
    ```

2.  **Set API Key**
    Export your Groq API key:
    ```bash
    export GROQ_API_KEY=gsk_your_actual_key_here
    ```

3.  **Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```

4.  **Open App**
    Visit [http://localhost:3000](http://localhost:3000)

### Option B: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
# Create .env.local with your key: GROQ_API_KEY=gsk_...
npm run dev
```

## 🧬 Supported Genes & Drugs

PharmaGuard currently screens for variants in key pharmacogenes including:

| Gene | Key Drugs Affected |
|------|-------------------|
| **CYP2C9** | Warfarin, Phenytoin |
| **VKORC1** | Warfarin (Sensitivity) |
| **CYP2C19** | Clopidogrel (Plavix), Citalopram |
| **CYP2D6** | Codeine, Tamoxifen, Tricyclics |
| **SLCO1B1** | Simvastatin (Myopathy risk) |
| **DPYD** | Fluorouracil (5-FU), Capecitabine |
| **TPMT** | Azathioprine, Mercaptopurine |
| **HLA-B** | Abacavir (Hypersensitivity), Carbamazepine |

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + U` | Upload VCF File |
| `Ctrl + Enter` | Run Analysis |
| `Ctrl + D` | Download Results (JSON) |
| `Ctrl + T` | Toggle Dark/Light Theme |

## 📂 Project Structure

```
pharmaguard/
├── backend/                 # Python FastAPI Service
│   ├── app/
│   │   ├── main.py          # API Entry point
│   │   ├── pharma_engine.py # Core Risk Logic
│   │   └── vcf_parser.py    # VCF Parsing Logic
│   ├── tests/               # Pytest suite
│   └── Dockerfile
├── frontend/                # Next.js Application
│   ├── src/
│   │   ├── app/             # App Router Pages
│   │   ├── components/      # UI Components (RadarChart, GeneMap, etc.)
│   │   └── hooks/           # Custom React Hooks
│   ├── public/              # Static assets
│   └── Dockerfile
├── docker-compose.yml       # Orchestration
└── README.md                # Documentation
```

## 🤝 Contributing

Contributions are welcome! Please run the test suite before submitting a PR:

- **Backend**: `pytest`
- **Frontend**: `npm run lint`


## 👥 Team

- **Aditi Priya** - Full Stack Developer
- **Deepak Raj** - Full Stack Developer
- **Vaibhav Gupta** - AI/ML Engineer
- **Aditya Kumar** - AI/ML Engineer


## 📜 License

MIT License. See [LICENSE](./LICENSE) for details.


