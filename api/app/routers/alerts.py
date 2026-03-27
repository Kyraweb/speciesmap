from fastapi import APIRouter
from pydantic import BaseModel
from app.database import get_connection
from datetime import datetime

router = APIRouter()


class ContactForm(BaseModel):
    name: str
    email: str
    message: str


@router.post("/alerts/contact")
def submit_contact(form: ContactForm):
    """Contact form endpoint — same pattern as whaledata.org."""
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        INSERT INTO etl_runs (status, error_message, started_at)
        VALUES ('contact', %s, %s)
    """, [
        f"FROM: {form.name} <{form.email}> — {form.message}",
        datetime.utcnow()
    ])

    conn.commit()
    cur.close()
    conn.close()

    return {"status": "ok", "message": "Message received"}
