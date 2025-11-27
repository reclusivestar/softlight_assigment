# **Softlight — Figma → HTML/CSS Converter**

### _Take-Home Assignment — Tanmay Kumar_

This project converts a Figma design into a static HTML/CSS representation.
It is designed to be **generalizable**, handling arbitrary Figma mocks rather than hardcoding logic for a single design.

The system fetches a Figma file via the REST API, transforms its node tree into a simplified internal UI representation, and then generates clean HTML and CSS that closely resemble the visual layout.

---

# **Installation & Usage**

## **Prerequisites**

- **Node.js 18+**
- A **Figma Personal Access Token** with `file_read` permissions
  (Create one at [https://www.figma.com/developers/api#auth-access-tokens](https://www.figma.com/developers/api#auth-access-tokens))

Your token must be available as an environment variable:

```
FIGMA_TOKEN=your_token_here
```

You can store this in a `.env` file at the project root:

```
# .env
FIGMA_TOKEN=YOUR_FIGMA_TOKEN
```

---

## **1. Install dependencies**

```bash
npm install
```

---

## **2. Run the converter**

The CLI accepts:

```
npm start <FIGMA_FILE_KEY> [FRAME_NAME]
```

### **Example: Convert a Figma file**

```bash
npm start AbCdEfGhIjKlMnOpQrStUvWx
```

### **Example: Convert a specific frame by name**

```bash
npm start AbCdEfGhIjKlMnOpQrStUvWx "Login Screen"
```

If the frame name is omitted, the converter automatically finds the **first FRAME** in the file.

---

## **3. View the output**

After running the command, the tool generates:

```
output/
  index.html
  styles.css
```

Open `output/index.html` in your browser to see the result.

---

# **Approach Overview**

## **1. Fetching the Figma File**

The CLI accepts a Figma file key extracted from any Figma URL and retrieves the document using:

```
GET https://api.figma.com/v1/files/:fileKey
```

- A frame name may optionally be passed; if not, the **first FRAME anywhere in the document** is used.
- The fetch is performed once, and the resulting JSON is passed through the transformer pipeline.

---

## **2. Transforming Figma Nodes → UI Tree**

Figma’s node model contains many design-only fields that do not directly map to HTML/CSS.
The transformer reduces the full Figma node into a compact, layout-centric structure:

```
{
  id,
  name,
  type,
  layout: { ... },
  style: { ... },
  children: [...]
}
```

### Key behaviors:

- **absoluteBoundingBox** is used to compute pixel-accurate positions.

- **Auto layout** is translated into `display: flex` with:

  - direction
  - padding
  - spacing/gaps
  - justify/align rules

- **Children are sorted visually** (top to bottom) so the DOM structure mirrors the design hierarchy.

- **Text nodes** preserve font size, weight, alignment, and spacing.

- **Shapes and frames** become generic containers for styling.

This internal UI tree is intentionally minimal—only properties required for CSS generation are retained.

---

## **3. Generating Static HTML**

HTML is produced by recursively walking the UI tree.

- `<div>` is used for frames, rectangles, groups, and shape nodes.
- `<p>` is used for text nodes.
- Each node is given a unique class:
  **`.node-<figma-id>`**
- A `data-name="<original Figma name>"` attribute is added for readability and debugging.

The resulting HTML maintains the structure of the Figma hierarchy without inline styles.

---

## **4. Generating CSS**

The CSS generator converts layout and style information into standalone CSS rules.

Supported features include:

- Absolute vs. relative positioning
- Auto layout → Flexbox
- Widths, heights, padding, gaps
- Solid fills → `background`
- Linear gradients
- Borders and border-radius
- Drop shadows
- Typography (font family, weight, size, alignments)

Defaults:

- `<p>` margins are reset to eliminate browser inconsistencies.
- Flex centering is applied when Figma visually centers text within a container.

---

## **5. Scrollable Root**

Because many mobile mocks exceed desktop viewport height, the top-level wrapper is scrollable:

```css
.root {
  overflow: auto;
  max-height: 100vh;
}
```

---

# **Project Structure**

```
src/
  index.ts          -> CLI entry (fetches Figma file)
  figmaClient.ts    -> API fetch wrapper
  transformer.ts    -> Figma nodes → internal UI tree
  htmlGenerator.ts  -> UI tree → HTML output
  cssGenerator.ts   -> UI tree → CSS rules
  types.ts          -> Strongly typed UI structures

output/
  index.html
  styles.css
```

---

# **Design Philosophy**

### **Generalizable**

No logic is tailored to the provided mock. The code works on any Figma file as long as its structure is valid.

### **Pixel-Oriented Fidelity**

We rely on Figma’s absolute metrics wherever possible.

### **Clean, Readable Output**

HTML preserves Figma’s structure and naming.
CSS keeps node styles isolated and predictable.

### **Non-Destructive**

We avoid guessing or inventing styling rules unless absolutely necessary.

---

# **Limitations**

This converter focuses on producing a **static HTML/CSS representation** of a Figma frame.
While it supports a wide range of layout and styling features, several limitations come from the nature of Figma’s data model and the scope of the assignment.

---

## **Layout & Positioning**

- **Text metrics (baseline, ascent, descent)** are not exposed through the Figma API.
  Browser text rendering may differ slightly, especially for vertically centered text.

- **Auto Layout is partially supported**. Properties like direction, gaps, padding, and alignment are mapped to flexbox, but:

  - Hug/Fill behavior is approximated
  - Min/max width/height rules are not translated
  - Wrapping (`layoutWrap`) is not implemented
  - Per-child alignment overrides are ignored

- **Constraints** (left/right/top/bottom resizing rules) are not translated into responsive CSS.

- **Z-ordering** is approximate.
  Children are sorted visually by their Y-position, not strict Figma layer order; overlapping elements may appear in front/behind incorrectly.

- **Only a single page and single frame** are exported.
  Multi-screen files require running the tool multiple times.

---

## **Styling & Visual Fidelity**

- **Rotation and transforms** (`relativeTransform`, `rotation`) are not applied.
  Elements are positioned using axis-aligned bounding boxes without rotation.

- **Vector paths, icons, and boolean operations** are flattened to rectangular boxes with fills/strokes.
  Complex shapes, miter joins, caps, and stroke geometry are not reproduced.

- **Stroke alignment** (`INSIDE`, `OUTSIDE`, `CENTER`) is not reflected in CSS; all borders are centered.
  Multiple strokes and dash patterns are not supported.

- **Gradients**: linear gradients are supported; radial/angular/image fills are not.

- **Effects**: blurs, blend modes, inner shadows, overlays, and complex compositing are not supported.

- **Images** are not rendered.
  Nodes referencing image fills or image patterns are output as empty containers.

- **Fonts**: only family/size/weight/letter spacing are applied.
  Custom font files, font loading, and exact metrics cannot be replicated automatically.

---

## **Text & Typography**

- **Mixed styling** inside a single text node (e.g., bold word in the middle) is not preserved; everything becomes one `<p>` with uniform style.

- **Text decoration** (underline, strikethrough) and advanced OpenType features are not exported.

- **Line-height differences** between Figma and browsers may cause small visual shifts.

---

## **Interactivity & Component Logic**

This tool exports **static HTML/CSS only**.

- No click/hover/press behaviors
- No animations
- No keyboard interactions
- No component logic or state transitions
- No toggling or conditionally visible elements

Figma variants (hover, active, disabled, loading) are exported **as-is**, with no dynamic switching.

Prototype interactions (navigation, overlays, flows) are not represented in code.

---

## **Responsiveness & Semantics**

- Output is **pixel-perfect**, sized to the Figma frame.
  No responsive CSS or media queries are generated.

- HTML elements are **not semantic**.
  All UI elements map to `<div>` and `<p>` without ARIA roles, labels, or accessibility metadata.

- Interactive components (buttons, inputs, links) have no inherent semantics and behave like static blocks.

---

## **Performance & Scale**

- Each Figma node maps to its own DOM element and CSS class.
  Very large files (hundreds/thousands of nodes) may produce large outputs.

- Deeply nested Figma structures produce deeply nested HTML.
  This can make the output more verbose than necessary.

---

# **Summary**

These limitations arise from the inherent difference between **design artifacts** and **functional interfaces**.
The tool intentionally prioritizes **visual fidelity**, **generalizability**, and **clarity of output** over dynamic behavior or full parity with Figma’s rendering engine.
