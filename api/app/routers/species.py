from fastapi import APIRouter, Query, HTTPException
from app.database import get_connection

router = APIRouter()


@router.get("/species")
def get_species(
    continent: str = Query("North America"),
    class_: str  = Query(None, alias="class"),
    iucn_status: str = Query(None),
    limit: int   = Query(100),
):
    """
    List species with optional filters.
    continent — maps to sightings.continent pre-computed column
    class     — Mammalia, Aves, Reptilia, Amphibia
    iucn_status — CR, EN, VU, NT, LC
    """
    conn = get_connection()
    cur  = conn.cursor()

    query = """
        SELECT DISTINCT
            s.id,
            s.scientific_name,
            s.common_name,
            s.class,
            s.iucn_status
        FROM species s
        JOIN sightings si ON si.species_id = s.id
        WHERE si.continent = %s
    """
    params = [continent]

    if class_:
        query += " AND s.class = %s"
        params.append(class_)

    if iucn_status:
        query += " AND s.iucn_status = %s"
        params.append(iucn_status)

    query += " ORDER BY s.common_name LIMIT %s"
    params.append(limit)

    cur.execute(query, params)
    results = cur.fetchall()
    cur.close()
    conn.close()

    return results


@router.get("/species/{species_id}")
def get_species_detail(species_id: str):
    """Full detail for a single species including conservation history."""
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        SELECT
            s.*,
            COALESCE(
                json_agg(
                    json_build_object('year', h.year, 'status', h.status)
                    ORDER BY h.year
                ) FILTER (WHERE h.id IS NOT NULL),
                '[]'
            ) AS status_history
        FROM species s
        LEFT JOIN conservation_status_history h ON h.species_id = s.id
        WHERE s.id = %s
        GROUP BY s.id
    """, [species_id])

    result = cur.fetchone()
    cur.close()
    conn.close()

    if not result:
        raise HTTPException(status_code=404, detail="Species not found")

    return result
