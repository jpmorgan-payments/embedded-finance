# UX Testing Prompt - Comprehensive Guide

This document contains ready-to-use prompts, detailed checklists, and instructions for conducting comprehensive UX testing of embedded finance components.

## Quick Start - Copy & Paste Prompts

### Full Testing Prompt

Use this prompt to run a complete UX testing session:

```
Please conduct comprehensive UX testing for the following embedded finance components using browser automation tools:

Components to test:
1. Linked Accounts: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=linked-accounts&theme=Empty
2. Recipients: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=recipients&theme=Empty
3. Make Payment: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=make-payment&theme=Empty
4. Transactions: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=transactions&theme=Empty
5. Accounts: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=accounts&theme=Empty

Testing Requirements:

PHASE 1: Visual UX/UI Analysis
- Navigate to each component URL
- Take screenshots of initial state
- Capture accessibility snapshots
- Document: Page structure, visual hierarchy, button styles, typography, spacing, footer styling, overall design consistency

PHASE 2: Interactive Element Testing
- Click all buttons (CTAs, view/details, manage menus)
- Explore all modals/dialogs that open
- Test all forms (fill fields, test validation)
- Test dropdowns and menus
- Document what happens for each interaction
- Take screenshots at key interaction points

PHASE 3: Technical Analysis
For each component:
- Capture console logs (all messages, errors, warnings)
- Monitor network requests (endpoints, methods, responses)
- Collect performance metrics: Navigation timing, resource loading times, memory usage, total load time
- Document: Console errors and warnings, failed network requests, slow requests (>1s), performance bottlenecks

PHASE 4: Cross-Component Analysis
- Compare UI patterns across components
- Compare UX patterns across components
- Identify inconsistencies
- Document all findings

Output: Update UX_TESTING_REPORT.md in the date-based folder (e.g., embedded-components/docs/ux-testing/2025-12-02/) with all findings organized by component and technical analysis.
```

### Quick Testing Prompt (Single Component)

```
Test the [COMPONENT_NAME] component at [URL] with the following:

1. Visual analysis (screenshot + snapshot)
2. Click all interactive elements
3. Capture console logs
4. Monitor network requests
5. Collect performance metrics
6. Document findings in UX_TESTING_REPORT.md
```

### Technical Testing Only Prompt

```
Conduct technical analysis for [COMPONENT_NAME] at [URL]:

1. Capture all console messages (logs, errors, warnings)
2. Monitor all network requests (document endpoints, methods, status codes)
3. Collect performance metrics:
   - Navigation timing API data
   - Resource timing data
   - Memory usage
4. Document technical issues and recommendations
```

### Performance Testing Prompt

```
Run performance analysis for [COMPONENT_NAME] at [URL]:

1. Measure page load time
2. Measure time to interactive
3. Measure resource load times
4. Check memory usage
5. Identify performance bottlenecks
6. Compare against performance budgets
7. Document recommendations
```

---

## Detailed Testing Checklist

### Phase 1: Initial Component Analysis

For each component:

1. **Navigate to component URL**
2. **Take screenshot** of initial state (save to `screenshots/` folder)
3. **Capture accessibility snapshot**
4. **Document:**
   - Page structure
   - Visual hierarchy
   - Button styles and colors
   - Typography
   - Spacing and layout
   - Footer styling

### Phase 2: Interactive Element Testing

For each component:

1. **Click all buttons:**
   - Primary CTAs
   - Secondary actions
   - View/Details buttons
   - Manage/More actions menus
   - Form submission buttons

2. **Explore modals/dialogs:**
   - Document structure
   - Test all interactive elements
   - Test close functionality
   - Test keyboard navigation
   - Take screenshots of modal states

3. **Test forms:**
   - Fill out all fields
   - Test validation
   - Test field interactions
   - Test tab switching (if applicable)

4. **Test dropdowns/menus:**
   - Open and close
   - Select options
   - Test keyboard navigation

### Phase 3: Technical Analysis

For each component:

1. **Console Logs:**
   - Capture all console messages
   - Document warnings
   - Document errors
   - Document info messages
   - Save console logs to `console-logs/` folder

2. **Network Requests:**
   - Monitor all network calls
   - Document API endpoints
   - Document request/response patterns
   - Identify failed requests
   - Document loading states
   - Save network data to `network-requests/` folder

3. **Performance Metrics:**
   - Page load time
   - Time to interactive
   - Render time
   - Network request timing
   - Resource loading times
   - Save performance data to `performance/` folder

### Phase 4: Cross-Component Analysis

1. **Compare UI patterns:**
   - Button styles
   - Color usage
   - Typography
   - Spacing
   - Modal/dialog patterns

2. **Compare UX patterns:**
   - Navigation flows
   - Form patterns
   - Error handling
   - Loading states
   - Success states

3. **Identify inconsistencies:**
   - Document all inconsistencies
   - Prioritize by impact
   - Suggest improvements

---

## Browser Tool Commands Reference

### Navigation

- `browser_navigate` - Navigate to URL
- `browser_wait_for` - Wait for page load or text
- `browser_snapshot` - Capture accessibility snapshot

### Interaction

- `browser_click` - Click element
- `browser_type` - Type into input
- `browser_select_option` - Select dropdown option
- `browser_hover` - Hover over element
- `browser_drag` - Drag and drop

### Data Collection

- `browser_console_messages` - Get console logs
- `browser_network_requests` - Get network requests
- `browser_evaluate` - Run JavaScript for performance metrics
- `browser_take_screenshot` - Capture visual state

### Performance Metrics JavaScript

```javascript
// Navigation timing
const perfData = window.performance.getEntriesByType('navigation')[0];
const navTiming = {
  dns: perfData.domainLookupEnd - perfData.domainLookupStart,
  tcp: perfData.connectEnd - perfData.connectStart,
  request: perfData.responseStart - perfData.requestStart,
  response: perfData.responseEnd - perfData.responseStart,
  domProcessing: perfData.domComplete - perfData.domInteractive,
  load: perfData.loadEventEnd - perfData.loadEventStart,
  total: perfData.loadEventEnd - perfData.fetchStart,
};

// Resource timing
const resources = window.performance.getEntriesByType('resource');
const resourceTiming = resources.map((r) => ({
  name: r.name.split('/').pop(),
  type: r.initiatorType,
  duration: r.duration,
  size: r.transferSize || 0,
}));

// Memory (if available)
const memory = performance.memory
  ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576),
      total: Math.round(performance.memory.totalJSHeapSize / 1048576),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
    }
  : null;
```

---

## Testing Workflow

1. **Navigate** to component URL
2. **Wait** for page load (2-3 seconds)
3. **Capture** initial state (snapshot + screenshot)
4. **Collect** console logs
5. **Collect** network requests
6. **Measure** performance metrics
7. **Interact** with all buttons/elements
8. **Capture** state after each interaction
9. **Save assets** to date-based folder structure
10. **Document** findings in report

---

## Performance Metrics to Collect

### Navigation Timing

- DNS lookup time
- TCP connection time
- Request time
- Response time
- DOM processing time
- Load event time

### Resource Timing

- Resource load times
- Resource sizes
- Cache hit/miss rates

### User Timing

- Custom performance marks
- Time to interactive
- First contentful paint
- Largest contentful paint

---

## Network Analysis Checklist

- [ ] Document all API endpoints called
- [ ] Note request methods (GET, POST, etc.)
- [ ] Document request payloads
- [ ] Document response structures
- [ ] Identify failed requests (4xx, 5xx)
- [ ] Note slow requests (>1s)
- [ ] Document authentication patterns
- [ ] Note CORS issues
- [ ] Document caching behavior

---

## Console Analysis Checklist

- [ ] Capture all console.log messages
- [ ] Document console.warn messages
- [ ] Document console.error messages
- [ ] Note React/component warnings
- [ ] Document deprecation warnings
- [ ] Note accessibility warnings
- [ ] Document performance warnings

---

## Testing Script Template

```markdown
## Component: [Component Name]

### Initial State
- URL: [URL]
- Screenshot: screenshots/[component-name]-initial.png
- Load time: [time]
- Console errors: [count]
- Network requests: [count]

### Interactive Testing
- Buttons clicked: [list]
- Modals opened: [list]
- Forms filled: [list]
- Issues found: [list]

### Technical Analysis
- Console logs: console-logs/[component-name]-logs.txt
- Network calls: network-requests/[component-name]-requests.json
- Performance: performance/[component-name]-metrics.json

### Issues Identified
1. [Issue description]
2. [Issue description]
```

---

## Report Structure

For each component, document:

1. **Visual Analysis**
   - Screenshot reference (link to `screenshots/` folder)
   - Layout description
   - UI patterns observed

2. **Interactive Testing**
   - Buttons clicked
   - Modals opened
   - Forms tested
   - Issues found

3. **Technical Analysis**
   - Console logs summary (link to `console-logs/` folder)
   - Network requests summary (link to `network-requests/` folder)
   - Performance metrics (link to `performance/` folder)
   - Technical issues

4. **Issues & Recommendations**
   - List all issues
   - Prioritize by severity
   - Provide recommendations

---

## Automation Notes

When using browser automation tools:

1. **Always wait for page load** before taking snapshots (2-3 seconds)
2. **Capture console logs** before and after interactions
3. **Monitor network** during all interactions
4. **Take screenshots** at key interaction points
5. **Document timing** for all operations
6. **Save all assets** to organized folder structure

---

## Notes

- Always wait 2-3 seconds after navigation for page load
- Capture console logs before and after interactions
- Monitor network during all interactions
- Take screenshots at key points
- Document timing for all operations
- Compare metrics across components for consistency
- Save all assets (screenshots, logs, network data) to date-based folder structure
