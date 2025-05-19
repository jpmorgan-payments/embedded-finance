from langchain_openai import ChatOpenAI
from browser_use import Agent
import asyncio
from dotenv import load_dotenv
load_dotenv()

# responsiveness_testing_agent.py - Automated Responsiveness Testing Agent
# This agent tests the responsive design of the onboarding/KYC flow for the embedded finance platform.
# FOR RESPONSIVENESS TESTING: Do NOT fill out any forms. Only navigate through all key screens/steps and produce a final report.

website = "https://embedded-finance-dev.com/ep/onboarding?scenario=scenario8&fullScreen=true"

# Prompt for the agent
responsiveness_task = f"""
ROLE: You are a Responsive Design Testing AI Agent.

OBJECTIVE: Test the responsive design of the onboarding and KYC flow for the embedded finance platform at {website} across various device types and screen sizes.

IMPORTANT: For responsiveness testing, you do NOT need to fill out any forms or enter data. Only navigate through all key screens/steps and produce a final report.

PROCEDURE:

1. Test the following key screens/steps:
   - Onboarding Start
   - Business Details
   - Owners and Key Roles
   - Operational Details
   - Review and Attest
   - Link Bank Account

2. For each screen, test the following screen sizes and orientations:
   - Mobile: 320px, 375px, 414px (portrait and landscape)
   - Tablet: 768px, 1024px (portrait and landscape)
   - Desktop: 1366px, 1920px

3. For each combination, evaluate:
   - Content visibility and readability
   - Navigation usability
   - Image and media scaling
   - Form layout (do not fill forms, just check layout)
   - Touch targets and interactive elements
   - Load time and performance

4. Test specific responsive features:
   - Hamburger menu functionality on mobile
   - Collapsible sections
   - Image carousels/sliders
   - Tables or complex data representations
   - Modal windows and popups

5. Documentation:
   - Document all issues with screenshots, device information, and recommended fixes
   - Prioritize issues based on severity and frequency of user encounter

6. Final Report:
   - After reviewing all screens and screen sizes, produce a comprehensive report organized by screen and device type.
   - Include a summary of key findings, prioritized issues, and actionable recommendations for the development team.
"""

async def main():
    agent = Agent(
        task=responsiveness_task,
        llm=ChatOpenAI(model="gpt-4.1-mini"),
        save_conversation_path="logs/conversation_responsiveness"  # Save chat logs
    )
    history = await agent.run()
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    with open(f"logs/responsiveness_history_{timestamp}.txt", "w", encoding="utf-8") as file:
        file.write(f"Responsiveness Test for: {website}\n\n")
        file.write("Visited URLs:\n" + str(history.urls()))
        file.write("\nScreenshot Paths:\n" + str(history.screenshots()))
        file.write("\nExecuted Actions:\n" + str(history.action_names()))
        file.write("\nExtracted Content:\n" + str(history.extracted_content()))
        file.write("\nErrors:\n" + str(history.errors()))
        file.write("\nModel Actions:\n" + str(history.model_actions()))

if __name__ == "__main__":
    asyncio.run(main()) 