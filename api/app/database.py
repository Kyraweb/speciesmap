import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    """
    Returns a psycopg2 connection with RealDictCursor as default cursor.
    Results come back as dicts — e.g. {"id": 1, "common_name": "Grizzly Bear"}
    Same pattern as whaledata.org.
    """
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=psycopg2.extras.RealDictCursor
    )
