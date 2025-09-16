# Character Drawing Pipeline v5 - Final Version

**Date:** 2025-09-10  
**Status:** Archived  
**Source:** `character_drawing_pipeline_all_steps_2025-09-10 (1).txt`

This is the final, most comprehensive version of the character drawing pipeline with all 4 steps and complete documentation.

## Character Drawing → Prompt Pipeline (All Steps)

### Step 1 — Structured Analysis (Internal)

**Role:** Internal analysis (for AI + facilitators). Produces a neutral, structured breakdown of the drawing.  
**Output is written for human readability but not shown to the child.**  
**Leads into:** Step 2, by generating the Needs Clarification list.

**Goal:** Capture every feature faithfully, without leading, and preserve all possible roles.

#### 1. Part Cluster Detection
- Scan for recurring groupings of shapes that function together (e.g., container + smaller forms).
- Record neutrally as part clusters, not labeled as heads/faces/arms.
- Preserve exact counts of shapes and clusters.

#### 2. Shape Analysis
For each shape:
- Shape ID (A, B, C…)
- Raw description (circle, oval, rectangle, zigzag, etc.)
- Count (exact, no merging)
- Relative position (above/below/inside/left/right)
- Connection (attached to, contained within, extending from, etc.)
- Possible interpretations (2–4) with confidence scores (1–10)
- Compound Interpretations: If a shape may serve multiple roles at once, record as a combined possibility instead of reducing to one.

#### 3. Connections Map
- Describe how shapes and clusters attach or relate.
- Capture hierarchies (A → B → C).
- Note ambiguous or unclear attachments.

#### 4. Ambiguities
- List all features with low confidence (≤6/10) or multiple/compound interpretations.
- Mark these as Needs Clarification.

#### 5. Distinctive Features
- Highlight unusual or defining traits (symmetry, repetition, floating parts, textures).
- Use neutral, structural language.

#### 6. Creative Context
- Short neutral assessment of mood, style, or intent (playful, scary, magical, mechanical).
- Grounded in observed evidence.

#### 7. Character Type (Grounded Guess)
- Suggest 2–3 possible types (robot, fruit-creature, hybrid, etc.) with confidence scores.
- Do not normalize to human defaults.

#### 8. Summary
- Two lists:
  - Clearly Identified (≥7/10 confidence)
  - Needs Clarification (≤6/10 or compound)
- Draft description using only high-confidence features; flag ambiguous ones.

### Step 2 — Kid-Friendly Clarification Questions (User-Facing)

**Role:** External interaction with the child.  
**Leads into:** Step 3, by producing the Resolved Features / Powers / Personality / Setting that replace all ambiguities.

**Goal:** Resolve ambiguities in a fun, simple way for the child, and capture those answers in a structured format so they can be integrated into the Final Draft Description.

#### Rules

1. **Feature Reference**
   - Always reference by Shape ID + position (e.g., "Shape A, the rectangle at the top").
   - Never use vague terms like "this part."

2. **Question Style**
   - Enthusiastic, positive, curious.
   - Simple, age-appropriate language for ages 6–10.
   - Each question = one ambiguous feature.

3. **Answer Choices**
   - Provide 6–8 options.
   - Order: most likely → compound (if flagged in Step 1) → playful/imaginative → "Something else."
   - Keep answers short (1–5 words).
   - Group loosely by function (body part, object, accessory, decoration).

4. **Integration Rule**
   - After the child answers, record results immediately in structured form:
     - Resolved Feature: Shape ID → Chosen Interpretation(s) (single or multiple).
   - This structured record is the bridge into Step 3.

5. **Extra Questions**
   - After clarifications, ask about:
     - Powers
     - Personality
     - Setting
   - Record results under:
     - Resolved Powers
     - Resolved Personality
     - Resolved Setting

### Step 3 — Lineart Prompt Generation (Internal)

**Role:** Internal integration step (AI + facilitator).  
**Leads into:** Image generation for lineart, and optionally Step 4.

**Goal:** Produce a precise DALL·E prompt for black-and-white outline art.

#### Integration Step (mandatory and critical)
- All ambiguities from Step 1 must be replaced with answers from Step 2.
- Merge clarifications from Resolved Features directly into the analysis.
- Replace ambiguous items in Needs Clarification with confirmed answers.
- If a feature has multiple resolved roles, preserve them together in the description rather than reducing to one.
- Update the Summary → Tentative Draft Description into a Final Draft Description with no ambiguities.
- Add Resolved Powers / Personality / Setting as extra context.
- This integration is the bridge step: without it, the Final Draft Description cannot be trusted and the Lineart Prompt cannot be generated.

#### Lineart Prompt Rules
- Must include all elements in exact counts, positions, and connections from the Final Draft Description.
- Use black-and-white outlines only — no shading, no colors, no textures.
- Style: professional lineart, clean outlines, consistent thickness.
- Output label: Lineart Prompt.

### Step 4 — Final Illustration Prompt (Optional, Internal)

**Role:** Internal (AI + facilitator).  
**Leads into:** Image generation for the finished illustration.

**Goal:** Create a polished, vibrant, professional version of the character.

- Start from the Final Draft Description.
- Add:
  - Kid-friendly polished style with vibrant colors.
  - Metallic, magical, or organic textures if relevant.
  - Visual hints of powers, personality, and setting (from Step 2 answers).
- Keep background supportive, not distracting.
- Highlight imaginative, playful mood consistent with the child's intent.
