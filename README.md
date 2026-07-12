# A.R.C. — Augmented Research Construct

A professional Mac research application for organizing academic work with MLA citations, multi-source bibliography import, and interactive mind map visualization.

## Features

### Multiple Papers
- Create and manage **separate research projects** for each paper
- Switch between papers from the **Papers** tab or header
- Each paper keeps its own sources, topics, outline, and mind map

### Research Mind Map
- Visual network connecting your **thesis or question** to 7 research sections
- Citations auto-place around assigned sections
- Drag, zoom, pan, and minimap navigation

### Bibliography Import
- **Multiple file upload** — drop or select many files at once
- **Bulk paste** — paste an entire works-cited list
- **Formats supported:** `.txt`, `.bib`, `.csv`, `.ris`
- Preview before import with deduplication
- Manual single-source entry and MLA paste parsing

### MLA Citation Engine
- MLA 9th edition Works Cited generation
- In-text citation preview per source
- Alphabetical sorting

### Settings (bottom-right gear icon)
- Text size: Small / Medium / Large / XL
- Sidebar width: Narrow / Normal / Wide
- Toggle minimap, grid, animations, compact mode
- Auto-fit mind map on changes

### Export
- Works Cited page (.txt)
- Full research project (.json)
- Structured paper outline (clipboard)

## Quick Start

```bash
cd /Users/om/Projects/stark-research
npm install
npm run dev          # Browser at http://localhost:5173
npm run dev:electron # Native Mac window
npm run build:mac    # Build .dmg installer
```

## Workflow

1. Open the app and set your **project name** and **thesis or question**
2. **Upload bibliography** — drag multiple `.bib`/`.txt` files or paste a full works-cited list
3. Review the import preview, then click **Import All Sources**
4. **Assign sections** to each source from the left panel
5. Explore the **mind map** to see your research structure
6. Switch to **Works Cited** for formatted MLA output
7. **Export** when ready

## Bibliography File Examples

**works-cited.txt** (blank line between entries):
```
Smith, John. "Climate Effects on Agriculture." Environmental Review, vol. 12, no. 3, 2024, pp. 45-67.

Johnson, Mary. Sustainable Policy. Oxford UP, 2023.
```

**sources.bib** (standard BibTeX)

**export.ris** (Zotero / Mendeley RIS export)

**library.csv** with headers: `author,title,year,journal`

## Tech Stack

- React 19 + TypeScript + Vite
- Electron (native Mac app)
- React Flow (mind map)
- Zustand (persisted state)
- Tailwind CSS 4

## Data

All research data is stored locally in your browser/Electron storage. Nothing is sent to external servers.
