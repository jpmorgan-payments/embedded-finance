from langchain_openai import ChatOpenAI
from browser_use import Agent
import asyncio
from dotenv import load_dotenv
from test_data import businessDetails
load_dotenv()

# Prompt for the agent
ux_task = f"""
ROLE: You are a Senior UX Expert AI Agent.

OBJECTIVE: Conduct a thorough, modern user experience (UX) review of the user onboarding and KYC process. Your goal is to navigate the entire flow to the screen presenting an active 'Link a Bank Account' Call to Action (CTA). For each screen, identify UX and interaction issues, and propose improvements justified by the latest industry best practices and research. Focus exclusively on user experience, usability, clarity, and delight. Do not analyze accessibility, functional correctness, or responsiveness.

PROCEDURE:

1. Navigate & Attempt Full Onboarding Completion:
    * Access: https://embedded-finance-dev.com/ep/onboarding?scenario=scenario8&fullScreen=true
    * Use the provided `businessDetails` to progress through all onboarding and KYC stages:
        ```json
        {businessDetails}
        ```
    * Primary Aim: Reach the screen where the 'Link a Bank Account' CTA is active and enabled. This is your endpoint.
    * Interaction Protocol (Mandatory for EACH screen):
        * Thoroughly scroll and explore the entire page content and all visible interactive elements before taking any other action or providing input.
        * Proceed logically through the flow. If critical elements (e.g., a 'Link Account' button) are initially disabled, monitor them and act only when they become enabled after you've completed necessary prior steps.
        * If you become irreversibly stuck or blocked despite correct input, document the screen, the issue, and the state of the application, then proceed to reporting. Do not retry indefinitely.

2. Screen-Specific UX Analysis (Perform Concurrently for EACH screen):
    * For each distinct screen encountered:
        * Identify the screen's main purpose (e.g., 'Identity Verification', 'Business Details').
        * For every usability or interaction flaw, detail:
            * Issue: Concise description of the problem.
            * Severity: (Blocker, Major, Minor, Cosmetic)
            * Impact: (User frustration, conversion risk, confusion, etc.)
            * Suggestion: Your specific recommended change.
            * Justification: Cite a relevant industry best practice or guideline (e.g., Nielsen's Heuristics, Norman's Laws, Material Design, Apple HIG, microcopy best practices, etc.).
            * Evidence: Screenshot, reference, or example (if possible).
        * Check for:
            * Microcopy clarity, error prevention, progressive disclosure, and feedback
            * Consistency, discoverability, and delight moments
            * Inclusivity (language, imagery, flows)
        * Note any positive UX moments (delight, clarity, speed, etc.)

3. Client-Side Validation & Error Handling Testing (After Main Flow):
    * Revisit key input forms and test validation logic by inputting incorrect, incomplete, or boundary-value data.
    * For each test: Note the field, input data, observed system response (e.g., error message, lack of feedback), and suggest improvements for validation feedback, citing best practices.
    * Check for inline validation, error message clarity, and prevention of user errors.

4. Final Report Generation:
    * Compile your report after either reaching the 'Link Bank Account' active CTA or determining you are blocked.
    * Organize findings by screen: Include all UX and validation issues, with suggestions, justifications, severity, and evidence.
    * Clearly state whether the defined endpoint was reached. If blocked, specify where and why.
    * Summarize positive UX moments and best-in-class patterns observed.
    * Provide a prioritized action list (quick wins, high-impact, blockers).
    * Ensure the report is actionable for development, design, and product teams.
    * Reference all relevant guidelines and research for each recommendation.
"""

async def main():
    agent = Agent(
        task=ux_task,
        llm=ChatOpenAI(model="gpt-4.1-mini"),
        save_conversation_path="logs/conversation"  # Save chat logs
    )
    history = await agent.run()
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    with open(f"logs/history_{timestamp}.txt", "w") as file:
        file.write("Access (some) useful information:\n")
        file.write("Visited URLs:\n" + str(history.urls()))              # List of visited URLs
        file.write("\nScreenshot Paths:\n" + str(history.screenshots()))       # List of screenshot paths
        file.write("\nExecuted Actions:\n" + str(history.action_names()))      # Names of executed actions
        file.write("\nExtracted Content:\n" + str(history.extracted_content())) # Content extracted during execution
        file.write("\nErrors:\n" + str(history.errors()))           # Any errors that occurred
        file.write("\nModel Actions:\n" + str(history.model_actions()))     # All actions with their parameters

asyncio.run(main())