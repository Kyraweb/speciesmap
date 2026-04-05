from fastapi import APIRouter, Query
from app.database import get_connection

router = APIRouter()


@router.get("/species")
def get_species(
    continent:   str = Query("North America"),
    class_:      str = Query(None, alias="class"),
    iucn_status: str = Query(None),
    search:      str = Query(None),
    limit:       int = Query(200),
):
    """
    Species list with sighting counts.
    Supports class filter, IUCN filter, and text search.
    Returns display_name (common if available, else cleaned scientific).
    """
    conn = get_connection()
    cur  = conn.cursor()

    query = """
        SELECT
            sp.id,
            sp.scientific_name,
            sp.class,
            sp.order_name,
            sp.family,
            sp.iucn_status,
            COALESCE(
                NULLIF(TRIM(sp.common_name), ''),
                SPLIT_PART(sp.scientific_name, ' ', 1) || ' ' ||
                SPLIT_PART(sp.scientific_name, ' ', 2)
            ) AS display_name,
            sp.common_name,
            COUNT(si.id) as sighting_count
        FROM species sp
        JOIN sightings si ON si.species_id = sp.id
        WHERE si.continent = %s
    """
    params = [continent]

    if class_:
        query += " AND sp.class = %s"
        params.append(class_)

    if iucn_status:
        query += " AND sp.iucn_status = %s"
        params.append(iucn_status)

    if search:
        query += " AND (sp.common_name ILIKE %s OR sp.scientific_name ILIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += """
        GROUP BY sp.id, sp.scientific_name, sp.class, sp.order_name,
                 sp.family, sp.iucn_status, sp.common_name
        ORDER BY sighting_count DESC
        LIMIT %s
    """
    params.append(limit)

    cur.execute(query, params)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


@router.get("/species/counts")
def get_species_counts(continent: str = Query("North America")):
    """Species and sighting counts per class — for sidebar display."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT
            sp.class,
            COUNT(DISTINCT sp.id)  as species_count,
            COUNT(si.id)           as sighting_count
        FROM species sp
        JOIN sightings si ON si.species_id = sp.id
        WHERE si.continent = %s
        GROUP BY sp.class
        ORDER BY sighting_count DESC
    """, [continent])
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


@router.get("/species/{species_id}")
def get_species_detail(
    species_id: str,
    continent:  str = Query("North America"),
):
    """Full species detail — for the detail panel."""
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        SELECT
            sp.*,
            COALESCE(
                NULLIF(TRIM(sp.common_name), ''),
                SPLIT_PART(sp.scientific_name, ' ', 1) || ' ' ||
                SPLIT_PART(sp.scientific_name, ' ', 2)
            ) AS display_name,
            COUNT(si.id) as sighting_count,
            MIN(si.observed_at) as first_seen,
            MAX(si.observed_at) as last_seen
        FROM species sp
        JOIN sightings si ON si.species_id = sp.id
        WHERE sp.id = %s AND si.continent = %s
        GROUP BY sp.id
    """, [species_id, continent])
    detail = cur.fetchone()

    # Temporal trend
    cur.execute("""
        SELECT
            EXTRACT(YEAR FROM observed_at)::INT as year,
            COUNT(*) as count
        FROM sightings
        WHERE species_id = %s
        AND continent = %s
        AND observed_at IS NOT NULL
        GROUP BY year
        ORDER BY year
    """, [species_id, continent])
    trend = cur.fetchall()

    # Seasonal activity
    cur.execute("""
        SELECT
            EXTRACT(MONTH FROM observed_at)::INT as month,
            COUNT(*) as count
        FROM sightings
        WHERE species_id = %s
        AND continent = %s
        AND observed_at IS NOT NULL
        GROUP BY month
        ORDER BY month
    """, [species_id, continent])
    seasonal = cur.fetchall()

    cur.close()
    conn.close()

    return {
        "detail":   detail,
        "trend":    trend,
        "seasonal": seasonal,
    }
