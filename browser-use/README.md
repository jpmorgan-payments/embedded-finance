# browser-use

This directory contains agents and scripts for automated browser-based testing and UX/UI analysis using the [browser-use](https://docs.browser-use.com/quickstart) Python package.

## Quickstart

### 1. Prerequisites

- **Python 3.11+** is required.
- [uv](https://github.com/astral-sh/uv) (recommended for fast virtualenv and dependency management)
- [Playwright](https://playwright.dev/python/) for browser automation

### 2. Setup Instructions (Windows/PowerShell)

```powershell
# 1. (Optional) Add uv to your PATH if not already available
$env:Path = "C:\Users\<your-user>\.local\bin;$env:Path"

# 2. Create a virtual environment with Python 3.11
uv venv --python 3.11

# 3. Activate the virtual environment
.venv\Scripts\activate

# 4. Install dependencies
uv pip install browser-use

# 5. Install Playwright browsers
uv run playwright install
```

### 3. Environment Variables

Create a `.env` file in this directory with your API keys (if using LLMs):

```
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## UX/UI Testing Agents Overview

This directory provides **four distinct agents** to cover all major aspects of modern UX/UI testing for onboarding and KYC flows:

- **UX Testing Agent (`ux_testing_agent.py`)**: Performs a comprehensive user experience review, focusing on usability, clarity, delight, and best practices. It analyzes each screen, identifies UX issues, and suggests improvements based on industry standards.
- **Accessibility (a11y) Testing Agent (`a11y_testing_agent.py`)**: Conducts automated accessibility testing, checking for keyboard navigation, screen reader compatibility, color contrast, and compliance with WCAG 2.1 AA standards.
- **Functional Testing Agent (`functional_testing_agent.py`)**: Tests the functional correctness of the onboarding/KYC flow, including UI element behavior, data validation, error handling, and user journeys across browsers.
- **Responsiveness Testing Agent (`responsiveness_testing_agent.py`)**: Evaluates the responsive design of the application across a wide range of device sizes and orientations, ensuring content and navigation work well on mobile, tablet, and desktop.

Each agent generates detailed logs and actionable reports in the `logs/` directory.

---

### 4. Running Agents

To run any agent, use the following command (replace the filename as needed):

```powershell
python ux_testing_agent.py
python a11y_testing_agent.py
python functional_testing_agent.py
python responsiveness_testing_agent.py
```

Logs and reports will be saved in the `logs/` directory.

---

## Reference

- Official Quickstart: [docs.browser-use.com/quickstart](https://docs.browser-use.com/quickstart)
- [browser-use PyPI](https://pypi.org/project/browser-use/)
- [Playwright Python Docs](https://playwright.dev/python/)

---

## Files

- `ux_testing_agent.py` — Automated UX review agent for onboarding/KYC flows
- `a11y_testing_agent.py` — Accessibility (a11y) testing agent
- `functional_testing_agent.py` — Functional testing agent for UI, validation, and user journeys
- `responsiveness_testing_agent.py` — Responsive design testing agent
- `test_data.py` — Shared test data for agents

---

## Troubleshooting

- If `uv` is not recognized, install it with `pip install uv` or see [uv installation guide](https://github.com/astral-sh/uv#installation).
- Ensure Python 3.11 is available in your PATH.
- For Playwright issues, see [Playwright troubleshooting](https://playwright.dev/python/docs/troubleshooting).
