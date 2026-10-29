---
target: Snap screen and recipe results screen
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\snap-cook\\app\\app\\recipes.tsx"
target_fingerprint: "sha256:bf8cfafb36fa98e01c2d63bfbe0c5fd2744dba4dd4cd67d35a5de4318d7b47a2"
target_path: "D:\\snap-cook\\app\\app\\recipes.tsx"
timestamp: 2026-10-29T15-51-58Z
slug: app-app-recipes-tsx
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Scanned photo thumbnail anchors state, but empty spacer in right header looks unfinished |
| 2 | Match System / Real World | 3 | Real-world kitchen need: cards don't distinguish on-hand items from missing pantry additions |
| 3 | User Control and Freedom | 3 | Scan again is easy, but users cannot edit or add missed detected ingredients |
| 4 | Consistency and Standards | 3 | Beautiful shared 24px card system; slight asymmetry in top header action bar |
| 5 | Error Prevention | 3 | Clean empty state when 0 recipes, but no warning if scan yielded 0 detected items |
| 6 | Recognition Rather Than Recall | 3 | Photo thumbnail anchors memory, but recipe cards don't show match percentages |
| 7 | Flexibility and Efficiency | 2 | No fast sorting by cooking time, calories, or difficulty on the results list |
| 8 | Aesthetic and Minimalist Design | 3 | High vertical density pushes Recipe #2 and #3 below the fold on mobile |
| 9 | Error Recovery | 4 | Immediate rescan button and safe back navigation preserving session |
| 10 | Help and Documentation | 3 | Clear subtitles and taglines, though no tips on improving vision scan accuracy |
| **Total** | | **30/40** | **Good** |

### Design Specificity Verdict

**LLM assessment**: Highly grounded culinary flow. The intake-to-results progression feels authored specifically for the "what's in my fridge" kitchen moment: camera capture with live animated scanline -> thumbnail verification -> detected ingredient tags -> 3 tailored recipes with calories, cooking time, and servings. It is unmistakably SnapCook AI. However, the experience leaves the user as a passive consumer of AI output: if the vision model misidentifies or misses an ingredient on the counter, the user cannot refine the ingredient list, and the cards don't disclose whether extra pantry items are required.

**Deterministic scan**: not applicable (native platform)

**Visual overlays**: not applicable (native platform)

### Overall Impression

The camera-to-results journey is fluid, purposeful, and visually cohesive with "The Kitchen Atelier" design language. The biggest opportunities lie in closing the feedback loop between detected ingredients and recipe selection: letting users tweak detected items and highlighting missing ingredients so they can choose a recipe with zero grocery surprises.

### What's Working

1. **Scanned Photo Anchor**: Displaying the user's actual photo thumbnail alongside "Found 3 custom recipes" immediately validates that the recommendations are bespoke to their kitchen counter.
2. **Comprehensive Recipe Badges**: Recipe cards surface calories, prep time, difficulty, and servings right away via `RecipeMetaChips`, giving cooks quick comparison metrics.
3. **Frictionless Rescan & Favorite Flow**: 1-tap "Scan Again" button in the summary card and instant heart button on each card make saving and iterating fast.

### Priority Issues

- **[P1] Missing On-Hand vs. Pantry Addition Distinction on Cards**
  - **Why it matters**: Home cooks choose recipes based on whether they have 100% of the ingredients right now. Current cards list 3 arbitrary preview ingredients without showing whether additional pantry staples are required.
  - **Fix**: Add a match chip to each card (e.g., "All 5 ingredients on hand" or "Needs 1 pantry staple: Olive oil") directly above the ingredient preview tags.
  - **Suggested command**: `/impeccable clarify app/components/RecipeCard.tsx`

- **[P1] Inability to Add or Refine Detected Ingredients**
  - **Why it matters**: Kitchen lighting and cluttered fridge shelves mean AI vision can miss an item (e.g., missed garlic or eggs). Currently, users cannot edit or add an ingredient to recalculate; they must rescan or manually adapt.
  - **Fix**: Add a "+ Add" chip button to the detected ingredients row that opens an inline text input to supplement the detected ingredients list.
  - **Suggested command**: `/impeccable harden app/app/recipes.tsx`

- **[P2] Excessive Vertical Stacking Pushes Recipes Below the Fold**
  - **Why it matters**: Scanned Photo Summary Card + Detected Ingredients Card + Recipe #1 consume over 550pt of vertical height. On standard phone viewports, Recipe #2 and #3 are pushed entirely off-screen, making users feel they only got one option unless they scroll.
  - **Fix**: Consolidate the photo thumbnail and detected ingredients into a sleek, unified horizontal summary section, reducing vertical pre-card height by ~40%.
  - **Suggested command**: `/impeccable layout app/app/recipes.tsx`

- **[P2] Header Asymmetry & Missing Fast Sort/Filter**
  - **Why it matters**: The header has an empty 40px right spacer (`<View className="w-10" />`), while users have no quick way to sort by fastest cooking time (e.g., 15 min vs 45 min) or lowest calories when in a rush.
  - **Fix**: Replace the empty spacer with a quick sort/filter popover or toggle (Fastest, Lowest Cal, Best Match).
  - **Suggested command**: `/impeccable clarify app/app/recipes.tsx`

### Persona Red Flags

**Casey (Distracted Mobile User)**: Recipe cards are tall (~220pt), so only Recipe #1 is visible without scrolling. With messy kitchen hands, having to scroll multiple pages to compare 3 choices is cumbersome.

**Jordan (First-Timer)**: Jordan doesn't know if the recipes require specialized ingredients they don't have. They have to open each recipe detail view one by one to check.

**Alex (Power User)**: If the photo missed onions on the cutting board, Alex has no way to quickly add "Onion" and regenerate without starting the entire flow from scratch.

### Minor Observations

- In `RecipeCard.tsx`, the bottom row displays `{ingredients.length} ingredients · {instructions.length} steps · View >`. This duplicates information already partially conveyed in the meta chips.
- In `recipes.tsx`, the detected ingredients tags use `bg-amber-50/80` with dark amber borders, which is visually warm but slightly clashes with the dominant emerald primary theme.

### Questions to Consider

- What if the 3 recipe options were presented as a swipeable horizontal carousel or a more compact comparison list with expandable details?
- Should tapping any detected ingredient chip allow removing it (e.g. if the user doesn't want to use their last tomato)?
