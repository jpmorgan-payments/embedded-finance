from langchain_openai import ChatOpenAI
from browser_use import Agent
import asyncio
from dotenv import load_dotenv
from test_data import businessDetails
load_dotenv()

# a11y_testing_agent.py - Automated Accessibility (a11y) Testing Agent
website = "https://embedded-finance-dev.com/ep/onboarding?scenario=scenario8&fullScreen=true"

# Prompt for the agent
a11y_task = f"""
ROLE: You are an Accessibility Testing AI Agent.

OBJECTIVE: Conduct an accessibility test of {website} to identify issues that may impact users with disabilities.

IMPORTANT: Perform the test step-by-step, page by page. For each page, complete all relevant accessibility checks and document your findings before proceeding to the next page.

Use the following business details to complete any onboarding or KYC steps as required during the test:
```json
{businessDetails}
```

PROCEDURE:

1. Test keyboard navigation:
   - Tab through all interactive elements on key pages
   - Verify visible focus indicators
   - Test all functionality without using a mouse
   - Check for keyboard traps or inaccessible elements

2. Test screen reader compatibility:
   - Enable VoiceOver (Mac) or NVDA (Windows)
   - Navigate through key pages and verify all content is announced
   - Check for appropriate alt text on images
   - Verify form fields have proper labels
   - Test dynamic content updates

3. Test color contrast and visual presentation:
   - Check text contrast against backgrounds
   - Verify information is not conveyed by color alone
   - Test the site at 200% zoom
   - Verify the site works in high contrast mode

4. Test form and interactive elements:
   - Verify clear error messages
   - Check for appropriate input validation
   - Test timeout warnings and session management
   - Verify multimedia has captions or transcripts

5. Check against WCAG 2.1 AA standards:
   - Verify semantic HTML structure
   - Check for proper heading hierarchy
   - Test ARIA implementations
   - Verify appropriate landmark regions

Document all issues with screenshots, steps to reproduce, and references to relevant WCAG criteria.
"""

async def main():
    agent = Agent(
        task=a11y_task,
        llm=ChatOpenAI(model="gpt-4.1-mini"),
        save_conversation_path="logs/conversation_accessibility"  # Save chat logs
    )
    history = await agent.run()
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    with open(f"logs/accessibility_history_{timestamp}.txt", "w") as file:
        file.write(f"Accessibility Test for: {website}\n\n")
        file.write("Visited URLs:\n" + str(history.urls()))
        file.write("\nScreenshot Paths:\n" + str(history.screenshots()))
        file.write("\nExecuted Actions:\n" + str(history.action_names()))
        file.write("\nExtracted Content:\n" + str(history.extracted_content()))
        file.write("\nErrors:\n" + str(history.errors()))
        file.write("\nModel Actions:\n" + str(history.model_actions()))

if __name__ == "__main__":
    asyncio.run(main()) 