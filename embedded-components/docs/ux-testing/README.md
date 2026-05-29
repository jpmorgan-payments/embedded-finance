# UX Testing Documentation

This folder contains comprehensive UX testing documentation and reusable prompts for testing embedded finance components.

## Files

### `TESTING_PROMPT.md`

Comprehensive testing guide containing:

- Ready-to-use copy-paste prompts for different testing scenarios
- Detailed testing checklists
- Browser tool commands reference
- Performance metrics JavaScript code
- Testing workflow and automation notes
- Report structure templates

### Date-Based Folders (e.g., `2025-12-02/`)

Each testing session is organized in a date-based folder containing:

- **UX_TESTING_REPORT.md** - Complete testing report
- **screenshots/** - Visual captures from testing
- **console-logs/** - Browser console data
- **network-requests/** - Network request logs
- **performance/** - Performance metrics
- **README.md** - Session-specific documentation

## Quick Start

To run a complete UX test, use the prompt from `TESTING_PROMPT.md`:

```
Please conduct comprehensive UX testing for the following embedded finance components...
```

## Testing Components

1. **Linked Accounts** - External bank account management
2. **Recipients** - Payment recipient management
3. **Make Payment** - Payment form and workflow
4. **Transactions** - Transaction history and details
5. **Accounts** - Account overview and details

## Testing Scope

Each test includes:

1. **Visual Analysis**
   - Screenshots
   - Layout documentation
   - UI pattern analysis

2. **Interactive Testing**
   - Button clicks
   - Modal exploration
   - Form testing
   - Menu interactions

3. **Technical Analysis**
   - Console logs
   - Network requests
   - Performance metrics
   - Error detection

4. **Cross-Component Analysis**
   - Pattern consistency
   - Inconsistency identification
   - Recommendations

## Browser Tools Used

- Navigation and interaction
- Screenshot capture
- Console log collection
- Network request monitoring
- Performance metrics collection

## Report Updates

The report is updated with each testing iteration. Key sections:

- **Component Analysis** - Individual component findings
- **Technical Analysis** - Console, network, and performance data
- **Critical Inconsistencies** - Cross-component issues
- **Recommended Improvements** - Prioritized action items
- **Design System Recommendations** - Long-term improvements

## Usage

1. Review `TESTING_PROMPT.md` for ready-to-use prompts and detailed procedures
2. Run tests using browser automation tools
3. Create a new date-based folder for your testing session (e.g., `2025-12-02/`)
4. Save all assets (screenshots, logs, network data) to organized subfolders
5. Update `UX_TESTING_REPORT.md` in the date folder with findings
6. Reference `TESTING_PROMPT.md` for checklists and templates

## Folder Structure

```
ux-testing/
├── TESTING_PROMPT.md          # Comprehensive testing guide
├── README.md                   # This file
└── YYYY-MM-DD/                 # Date-based testing sessions
    ├── README.md               # Session-specific documentation
    ├── UX_TESTING_REPORT.md    # Main testing report
    ├── screenshots/            # Visual captures
    ├── console-logs/           # Console data
    ├── network-requests/       # Network data
    └── performance/           # Performance metrics
```

## Notes

- All testing is conducted on the demo environment
- Performance metrics are from mocked environment (MSW)
- Production performance may differ
- Console logs show development-level verbosity
- Each testing session should be organized in its own date-based folder
