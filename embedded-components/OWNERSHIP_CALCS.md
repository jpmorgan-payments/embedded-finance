# Beneficial Ownership Calculation Examples

This document provides examples of how to calculate beneficial ownership percentages through chains of companies to determine if someone meets the 25% threshold for being considered a beneficial owner.

> **Note:** These calculations are for educational purposes to help users understand beneficial ownership requirements. The system does not automatically calculate these percentages - users must determine beneficial ownership status themselves.

## Understanding the 25% Rule

A **beneficial owner** is any individual who, directly or indirectly, owns or controls 25% or more of the equity interests of a legal entity.

### Key Concepts

- **Direct Ownership**: An individual directly owns shares in the business being onboarded
- **Indirect Ownership**: An individual owns shares through one or more intermediate entities (companies)
- **Ownership Chain**: The path from an individual through intermediate companies to the target business
- **Multiplication Rule**: Multiply ownership percentages at each level of the chain

---

## Example Characters & Company Structure

These examples use the same characters from our system:

- **Central Perk Coffee & Cookies** - The business being onboarded (target company)
- **Monica Geller** - Direct owner
- **Ross Geller** - Indirect owner (through one intermediate company)
- **Rachel Green** - Indirect owner (through two intermediate companies)
- **Chandler Bing** - Additional examples below
- **Joey Tribbiani** - Additional examples below
- **Phoebe Buffay** - Additional examples below

---

## Calculation Examples

### Example 1: Direct Ownership (Simple) ✅ Meets 25% Threshold

**Monica Geller → Central Perk Coffee & Cookies**

```
Monica owns 30% of Central Perk Coffee & Cookies directly

Calculation:
Beneficial Ownership = 30%

Result: ✅ Monica is a beneficial owner (≥ 25%)
```

---

### Example 2: One-Level Indirect Ownership ✅ Meets 25% Threshold

**Ross Geller → Central Perk Coffee → Central Perk Coffee & Cookies**

```
Ross owns 50% of Central Perk Coffee
Central Perk Coffee owns 60% of Central Perk Coffee & Cookies

Calculation:
Step 1: Ross's ownership of Central Perk Coffee = 50%
Step 2: Central Perk Coffee's ownership of target = 60%
Step 3: Ross's beneficial ownership = 50% × 60% = 30%

Result: ✅ Ross is a beneficial owner (≥ 25%)
```

**Visual Representation:**

```
Ross Geller (50%)
    ↓
Central Perk Coffee (60%)
    ↓
Central Perk Coffee & Cookies
    ↓
Final ownership: 30%
```

---

### Example 3: Two-Level Indirect Ownership ✅ Meets 25% Threshold

**Rachel Green → Cookie Co. → Central Perk Cookie → Central Perk Coffee & Cookies**

```
Rachel owns 80% of Cookie Co.
Cookie Co. owns 50% of Central Perk Cookie
Central Perk Cookie owns 70% of Central Perk Coffee & Cookies

Calculation:
Step 1: Rachel's ownership of Cookie Co. = 80%
Step 2: Cookie Co.'s ownership of Central Perk Cookie = 50%
Step 3: Central Perk Cookie's ownership of target = 70%
Step 4: Rachel's beneficial ownership = 80% × 50% × 70% = 28%

Result: ✅ Rachel is a beneficial owner (≥ 25%)
```

**Visual Representation:**

```
Rachel Green (80%)
    ↓
Cookie Co. (50%)
    ↓
Central Perk Cookie (70%)
    ↓
Central Perk Coffee & Cookies
    ↓
Final ownership: 28%
```

---

### Example 4: High Initial Ownership, Low Final ❌ Does NOT Meet Threshold

**Chandler Bing → Bing Enterprises → Central Perk Coffee & Cookies**

```
Chandler owns 100% of Bing Enterprises
Bing Enterprises owns 20% of Central Perk Coffee & Cookies

Calculation:
Step 1: Chandler's ownership of Bing Enterprises = 100%
Step 2: Bing Enterprises' ownership of target = 20%
Step 3: Chandler's beneficial ownership = 100% × 20% = 20%

Result: ❌ Chandler is NOT a beneficial owner (< 25%)
```

**Why this matters:** Even if you own 100% of an intermediate company, if that company only owns a small percentage of the target, you don't meet the threshold.

---

### Example 5: Long Chain with Dilution ❌ Does NOT Meet Threshold

**Joey Tribbiani → Joey's Holdings → Tribiani Corp → Coffee Ventures → Central Perk Coffee & Cookies**

```
Joey owns 90% of Joey's Holdings
Joey's Holdings owns 60% of Tribiani Corp
Tribiani Corp owns 50% of Coffee Ventures
Coffee Ventures owns 40% of Central Perk Coffee & Cookies

Calculation:
Step 1: Joey's ownership of Joey's Holdings = 90%
Step 2: Joey's Holdings' ownership of Tribiani Corp = 60%
Step 3: Tribiani Corp's ownership of Coffee Ventures = 50%
Step 4: Coffee Ventures' ownership of target = 40%
Step 5: Joey's beneficial ownership = 90% × 60% × 50% × 40% = 10.8%

Result: ❌ Joey is NOT a beneficial owner (< 25%)
```

**Visual Representation:**

```
Joey Tribbiani (90%)
    ↓
Joey's Holdings (60%)
    ↓
Tribiani Corp (50%)
    ↓
Coffee Ventures (40%)
    ↓
Central Perk Coffee & Cookies
    ↓
Final ownership: 10.8%
```

**Key Insight:** Long ownership chains can significantly dilute ownership, even with high percentages at each level.

---

### Example 6: Right at the Threshold ✅ Meets 25% Threshold (Exactly)

**Phoebe Buffay → Smelly Cat Productions → Central Perk Coffee & Cookies**

```
Phoebe owns 50% of Smelly Cat Productions
Smelly Cat Productions owns 50% of Central Perk Coffee & Cookies

Calculation:
Step 1: Phoebe's ownership of Smelly Cat Productions = 50%
Step 2: Smelly Cat Productions' ownership of target = 50%
Step 3: Phoebe's beneficial ownership = 50% × 50% = 25%

Result: ✅ Phoebe is a beneficial owner (= 25% exactly)
```

**Important:** The threshold is "25% or more" - exactly 25% counts as meeting the requirement.

---

### Example 7: Multiple Paths to Ownership (Advanced)

In some cases, an individual may own shares in the target company through multiple paths. In these cases, **add the percentages from each path**.

**Monica Geller with Multiple Paths:**

```
Path 1 (Direct):
Monica owns 15% of Central Perk Coffee & Cookies directly
= 15%

Path 2 (Through Geller Family Trust):
Monica owns 80% of Geller Family Trust
Geller Family Trust owns 20% of Central Perk Coffee & Cookies
= 80% × 20% = 16%

Total Beneficial Ownership:
15% (direct) + 16% (indirect) = 31%

Result: ✅ Monica is a beneficial owner (≥ 25%)
```

---

## Quick Reference: Common Scenarios

| Scenario                  | Example Calculation               | Meets 25%? |
| ------------------------- | --------------------------------- | ---------- |
| Direct: 30%               | 30%                               | ✅ Yes     |
| Direct: 20%               | 20%                               | ❌ No      |
| 50% → 60%                 | 0.50 × 0.60 = 30%                 | ✅ Yes     |
| 100% → 20%                | 1.00 × 0.20 = 20%                 | ❌ No      |
| 80% → 50% → 70%           | 0.80 × 0.50 × 0.70 = 28%          | ✅ Yes     |
| 90% → 60% → 50% → 40%     | 0.90 × 0.60 × 0.50 × 0.40 = 10.8% | ❌ No      |
| Direct 15% + Indirect 16% | 15% + 16% = 31%                   | ✅ Yes     |

---

## Tips for Users

1. **Start with the individual**: Begin your calculation from the beneficial owner candidate
2. **Follow each link in the chain**: Multiply ownership percentages at each level
3. **Watch for dilution**: Each additional layer in the ownership chain can reduce the final percentage
4. **Don't forget multiple paths**: If someone owns through multiple routes, add those percentages together
5. **The math is multiplication**: Each "→" in the chain means multiply the percentages
6. **Round carefully**: Small differences can determine if someone meets the 25% threshold

---

## Common Mistakes to Avoid

❌ **Mistake 1**: Adding percentages in a chain instead of multiplying

```
Wrong: 50% + 60% = 110% ❌
Right: 50% × 60% = 30% ✅
```

❌ **Mistake 2**: Forgetting to convert percentages to decimals

```
Wrong: 50 × 60 = 3,000% ❌
Right: 0.50 × 0.60 = 0.30 = 30% ✅
```

❌ **Mistake 3**: Assuming 100% ownership of an intermediate company means you own the target

```
Wrong: I own 100% of Company A, so I own whatever Company A owns ❌
Right: If I own 100% of Company A, and Company A owns 20% of the target,
       then I own 20% of the target (which doesn't meet the 25% threshold) ✅
```

❌ **Mistake 4**: Not adding multiple ownership paths

```
Wrong: Only counting the direct ownership of 15% ❌
Right: Adding direct ownership (15%) + indirect ownership (16%) = 31% ✅
```

---

## Regulatory Context

These calculations are based on beneficial ownership requirements from:

- **FinCEN's Customer Due Diligence (CDD) Rule** (31 CFR 1010.230)
- **Corporate Transparency Act (CTA)** beneficial ownership reporting requirements

The 25% ownership threshold is a regulatory requirement designed to identify individuals who have significant control or ownership of legal entities for anti-money laundering (AML) and counter-terrorism financing (CTF) purposes.

---

## Need Help?

If you're unsure whether someone meets the beneficial ownership threshold:

1. Draw out the ownership structure visually
2. Calculate each path from the individual to your business
3. Add up ownership from all paths
4. If the total is 25% or more, they are a beneficial owner

**When in doubt, consult with your legal or compliance team.**
