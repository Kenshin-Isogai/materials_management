# Data Prep Tools

This directory contains standalone data-preparation utilities.

- These tools are supplier-format-dependent (for example, quotation PDF layouts).
- They are intentionally **not** part of the backend runtime (`app/`).
- Run them manually only when needed for data maintenance tasks.

Current tool:
- `extract_thorlabs_descriptions.py`
  - Extracts item descriptions from Thorlabs quotation PDFs.
  - Updates `item_lists/thorlabs_items_1st.csv`.

Example run from `backend/`:

```powershell
uv run python data_prep_tools\extract_thorlabs_descriptions.py
```
