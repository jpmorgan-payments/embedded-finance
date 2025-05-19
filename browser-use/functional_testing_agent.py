from langchain_openai import ChatOpenAI
from browser_use import Agent
import asyncio
from dotenv import load_dotenv
from test_data import businessDetails
load_dotenv()

# functional_testing_agent.py - Automated Functional Testing Agent
# This agent tests the functional aspects of the onboarding/KYC flow for the embedded finance platform.
# Focus: UI elements, data validation, error handling, user journeys, and cross-browser compatibility.

website = "https://embedded-finance-dev.com/ep/onboarding?scenario=scenario8&fullScreen=true"

# Prompt for the agent
functional_task = f"""
ROLE: You are a Functional Testing AI Agent.


OBJECTIVE: Test the functional aspects of the onboarding and KYC flow for the embedded finance platform at {website}.


PROCEDURE:

Test Data for All Flows:
-----------------------
Use the following business and personal details for all data entry and validation steps:

{businessDetails}

-----------------------

1. Test all UI elements on each screen:
   - Buttons, forms, dropdowns, checkboxes, radio buttons, navigation links
   - Verify that all elements are visible, enabled, and function as intended

2. Data entry and validation:
   - Enter valid and invalid data in all forms
   - Verify client-side and server-side validation
   - Test error handling and messaging for incorrect or missing input
   - Check for clear, actionable error messages

3. Performance checks:
   - Observe and document any slow loading or lag during interactions
   - Note any performance issues under normal usage

4. Critical user journeys:
   - Complete onboarding from start to 'Link Bank Account' CTA
   - Update account or business details after onboarding
   - Upload and submit required documents (if applicable)

5. Cross-browser compatibility:
   - Test core functionality on Chrome, Firefox, and Safari
   - Document any rendering or functionality differences

6. For each test, document:
   - Test case description
   - Expected behavior
   - Actual behavior
   - Screenshots of issues encountered
   - Severity rating (Critical, High, Medium, Low)

7. Final Report:
   - After all tests, produce a comprehensive report organized by feature and user journey.
   - Include a summary of key findings, prioritized issues, and actionable recommendations for the development team.
"""

async def main():
    agent = Agent(
        task=functional_task,
        llm=ChatOpenAI(model="gpt-4.1-mini"),
        save_conversation_path="logs/conversation_functional"  # Save chat logs
    )
    history = await agent.run()
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    with open(f"logs/functional_history_{timestamp}.txt", "w", encoding="utf-8") as file:
        file.write(f"Functional Test for: {website}\n\n")
        file.write("Visited URLs:\n" + str(history.urls()))
        file.write("\nScreenshot Paths:\n" + str(history.screenshots()))
        file.write("\nExecuted Actions:\n" + str(history.action_names()))
        file.write("\nExtracted Content:\n" + str(history.extracted_content()))
        file.write("\nErrors:\n" + str(history.errors()))
        file.write("\nModel Actions:\n" + str(history.model_actions()))

if __name__ == "__main__":
    asyncio.run(main()) 