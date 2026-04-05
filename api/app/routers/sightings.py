from fastapi import APIRouter, Query
from app.database import get_connection

router = APIRouter()


@router.get("/sightings")
def get_sightings(
    continent:  str = Query("North America"),
    class_:     str = Query(None, alias="class"),
    species_id: str = Query(None),
    limit:      int = Query(2000),
):
    """
    Sightings for map display.
    When species_id provided — returns all sightings for that species (fast, small result).
    When class only — returns random sample limited to `limit`.
    """
    conn = get_connection()
    cur  = conn.cursor()

    query = """
        SELECT
            si.id,
            si.species_id,
            COALESCE(
                NULLIF(TRIM(s.common_name), ''),
                SPLIT_PART(s.scientific_name, ' ', 1) || ' ' ||
                SPLIT_PART(s.scientific_name, ' ', 2)
            ) AS display_name,
            s.common_name,
            s.scientific_name,
            s.class,
            s.iucn_status,
            ST_X(si.location::geometry) AS lng,
            ST_Y(si.location::geometry) AS lat,
            si.observed_at,
            si.country,
            si.individual_count
        FROM sightings si
        JOIN species s ON s.id = si.species_id
        WHERE si.continent = %s
    """
    params = [continent]

    if species_id:
        # Specific species — return all sightings, no random limit needed
        query += " AND si.species_id = %s"
        params.append(species_id)
    else:
        if class_:
            query += " AND s.class = %s"
            params.append(class_)
        # Random sample for general view
        query += " ORDER BY RANDOM() LIMIT %s"
        params.append(limit)

    cur.execute(query, params)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


@router.get("/sightings/continent-summary")
def get_continent_summary():
    """Total sightings per continent — used on landing page."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT continent, COUNT(*) as total
        FROM sightings
        WHERE continent IS NOT NULL
        GROUP BY continent
        ORDER BY total DESC
    """)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results
