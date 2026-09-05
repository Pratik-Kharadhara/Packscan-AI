"""Streamlit entry point.

Phase 1 intentionally contains no analysis workflow. Future UI code will call the
analysis pipeline and display its structured result without implementing OCR or rules.
"""

import streamlit as st

st.set_page_config(page_title="PACKSCAN AI", page_icon="📦", layout="wide")
st.title("PACKSCAN AI")
st.caption("AI-assisted packaged commodity compliance screening")
st.info("Foundation complete. The analysis workflow will be added in later phases.")
