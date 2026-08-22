"""
White Owl Data Analyst Module
Pandas dataset inspection, statistical profiling, safe query translation, and Plotly visualization.
"""

import io
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

class DataAnalyzer:
    """Handles dataset ingestion, data health profiling, schema summaries, and interactive charts."""

    @staticmethod
    def load_dataset(file_bytes: bytes, filename: str) -> pd.DataFrame:
        """Loads a CSV or Excel file into a pandas DataFrame."""
        name_lower = filename.lower()
        if name_lower.endswith(".csv"):
            try:
                return pd.read_csv(io.BytesIO(file_bytes))
            except UnicodeDecodeError:
                return pd.read_csv(io.BytesIO(file_bytes), encoding="latin1")
        elif name_lower.endswith((".xlsx", ".xls")):
            return pd.read_excel(io.BytesIO(file_bytes))
        else:
            raise ValueError("Unsupported file format. Please upload a .csv, .xlsx, or .xls file.")

    @staticmethod
    def get_summary(df: pd.DataFrame) -> Dict[str, Any]:
        """Generates comprehensive dataset health and structure metrics."""
        num_rows, num_cols = df.shape
        missing_series = df.isnull().sum()
        total_missing = int(missing_series.sum())
        missing_pct = round((total_missing / (num_rows * num_cols)) * 100, 2) if num_rows * num_cols > 0 else 0

        dtypes_dict = {col: str(dtype) for col, dtype in df.dtypes.items()}
        missing_dict = {col: int(count) for col, count in missing_series.items()}

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=["object", "category", "string"]).columns.tolist()
        datetime_cols = df.select_dtypes(include=["datetime"]).columns.tolist()

        # Basic numerical statistics preview
        desc_df = df.describe().round(2).to_dict() if len(numeric_cols) > 0 else {}

        return {
            "rows": num_rows,
            "columns": num_cols,
            "column_names": list(df.columns),
            "dtypes": dtypes_dict,
            "missing_counts": missing_dict,
            "total_missing": total_missing,
            "missing_pct": missing_pct,
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "datetime_columns": datetime_cols,
            "describe": desc_df
        }

    @staticmethod
    def build_dataset_context(df: pd.DataFrame, max_rows: int = 8) -> str:
        """Builds a condensed text summary of the dataset for LLM query synthesis."""
        summary = DataAnalyzer.get_summary(df)
        head_sample = df.head(max_rows).to_string(index=False)
        
        info_lines = [
            f"Shape: {summary['rows']} rows x {summary['columns']} columns",
            f"Columns: {', '.join(summary['column_names'])}",
            f"Numeric Columns: {', '.join(summary['numeric_columns']) if summary['numeric_columns'] else 'None'}",
            f"Categorical Columns: {', '.join(summary['categorical_columns']) if summary['categorical_columns'] else 'None'}",
            f"Missing Values: {summary['total_missing']} cells ({summary['missing_pct']}%)",
            "",
            "--- FIRST 8 ROWS SAMPLE ---",
            head_sample
        ]
        return "\n".join(info_lines)

    @staticmethod
    def prepare_analysis_prompt(user_query: str, df: pd.DataFrame) -> str:
        """Prepares a prompt for data interpretation and insights."""
        context = DataAnalyzer.build_dataset_context(df)
        return f"""
You are the White Owl Data Analyst Engine.
You have been provided with the schema and head sample of an uploaded dataset:

[DATASET PROFILE]:
{context}

[USER QUESTION]:
{user_query}

[INSTRUCTIONS]:
1. Provide a rigorous, accurate analytical answer based on the columns, distributions, and sample data.
2. If computing exact metrics, explain the logic clearly (e.g. formula or aggregation steps).
3. If recommending visualizations, specify the chart type, X-axis column, Y-axis column, and grouping/color dimension.
4. Highlight any data hygiene issues, outliers, or anomalies observable.
5. Format numbers with standard commas and decimals for clean readability.
"""

    @staticmethod
    def create_chart(
        df: pd.DataFrame,
        chart_type: str,
        x_col: str,
        y_col: Optional[str] = None,
        color_col: Optional[str] = None,
        title: Optional[str] = None
    ) -> go.Figure:
        """Generates interactive Plotly figures tailored to the White Owl dark aesthetic."""
        template = "plotly_dark"
        owl_colors = ["#e50914", "#ffffff", "#666666", "#b30000", "#d9d9d9", "#333333", "#ff4d4d"]
        
        chart_title = title or f"{chart_type.capitalize()} of {y_col if y_col else x_col}"
        
        if chart_type == "bar":
            if y_col:
                fig = px.bar(df, x=x_col, y=y_col, color=color_col, title=chart_title,
                             color_discrete_sequence=owl_colors, template=template)
            else:
                counts = df[x_col].value_counts().reset_index()
                counts.columns = [x_col, "Count"]
                fig = px.bar(counts, x=x_col, y="Count", title=f"Frequency Count: {x_col}",
                             color_discrete_sequence=owl_colors, template=template)
        elif chart_type == "line":
            fig = px.line(df, x=x_col, y=y_col, color=color_col, title=chart_title,
                          color_discrete_sequence=owl_colors, template=template)
        elif chart_type == "scatter":
            fig = px.scatter(df, x=x_col, y=y_col, color=color_col, title=chart_title,
                             color_discrete_sequence=owl_colors, template=template)
        elif chart_type == "histogram":
            fig = px.histogram(df, x=x_col, color=color_col, title=chart_title,
                               color_discrete_sequence=owl_colors, template=template)
        elif chart_type == "pie":
            if y_col:
                fig = px.pie(df, names=x_col, values=y_col, title=chart_title,
                             color_discrete_sequence=owl_colors, template=template)
            else:
                counts = df[x_col].value_counts().reset_index()
                counts.columns = [x_col, "Count"]
                fig = px.pie(counts, names=x_col, values="Count", title=f"Distribution: {x_col}",
                             color_discrete_sequence=owl_colors, template=template)
        elif chart_type == "box":
            fig = px.box(df, x=x_col, y=y_col, color=color_col, title=chart_title,
                         color_discrete_sequence=owl_colors, template=template)
        else:
            fig = px.bar(df, x=x_col, y=y_col, title=chart_title, template=template)

        fig.update_layout(
            paper_bgcolor="#1a1a1a",
            plot_bgcolor="#0b0b0b",
            font=dict(color="#ffffff", family="sans-serif"),
            margin=dict(l=40, r=40, t=50, b=40)
        )
        return fig
