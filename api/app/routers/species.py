from fastapi import APIRouter, Query
from app.database import get_connection

router = APIRouter()

TARGET_CLASSES = ['Mammalia', 'Reptilia', 'Amphibia']


@router.get("/species/counts")
def get_species_counts(continent: str = Query("North America")):
    """Instant class counts from pre-computed stats table."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT
            sp.class,
            COUNT(DISTINCT scs.species_id) AS species_count,
            SUM(scs.sighting_count)        AS sighting_count
        FROM species_continent_stats scs
        JOIN species sp ON sp.id = scs.species_id
        WHERE scs.continent = %s
        AND sp.class = ANY(%s)
        GROUP BY sp.class
        ORDER BY sighting_count DESC
    """, [continent, TARGET_CLASSES])
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


@router.get("/species")
def get_species(
    continent:   str = Query("North America"),
    class_:      str = Query(None, alias="class"),
    iucn_status: str = Query(None),
    search:      str = Query(None),
    limit:       int = Query(200),
):
    """Fast species list via pre-computed species_continent_stats."""
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
            scs.sighting_count
        FROM species sp
        JOIN species_continent_stats scs
            ON scs.species_id = sp.id
            AND scs.continent = %s
        WHERE sp.class = ANY(%s)
    """
    params = [continent, TARGET_CLASSES]

    if class_:
        query += " AND sp.class = %s"
        params.append(class_)

    if iucn_status:
        query += " AND sp.iucn_status = %s"
        params.append(iucn_status)

    if search:
        query += " AND (sp.common_name ILIKE %s OR sp.scientific_name ILIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY scs.sighting_count DESC LIMIT %s"
    params.append(limit)

    cur.execute(query, params)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


@router.get("/species/{species_id}")
def get_species_detail(
    species_id: str,
    continent:  str = Query("North America"),
):
    conn = get_connection()
    cur  = conn.cursor()

    # Get species info + sighting count from fast table
    cur.execute("""
        SELECT
            sp.id,
            sp.scientific_name,
            sp.class,
            sp.order_name,
            sp.family,
            sp.genus,
            sp.iucn_status,
            sp.common_name,
            COALESCE(
                NULLIF(TRIM(sp.common_name), ''),
                SPLIT_PART(sp.scientific_name, ' ', 1) || ' ' ||
                SPLIT_PART(sp.scientific_name, ' ', 2)
            ) AS display_name,
            scs.sighting_count
        FROM species sp
        LEFT JOIN species_continent_stats scs
            ON scs.species_id = sp.id AND scs.continent = %s
        WHERE sp.id = %s
    """, [continent, species_id])
    detail = cur.fetchone()

    # Yearly trend
    cur.execute("""
        SELECT EXTRACT(YEAR FROM observed_at)::INT AS year, COUNT(*) AS count
        FROM sightings
        WHERE species_id = %s AND continent = %s AND observed_at IS NOT NULL
        GROUP BY year ORDER BY year
    """, [species_id, continent])
    trend = cur.fetchall()

    # Monthly seasonal
    cur.execute("""
        SELECT EXTRACT(MONTH FROM observed_at)::INT AS month, COUNT(*) AS count
        FROM sightings
        WHERE species_id = %s AND continent = %s AND observed_at IS NOT NULL
        GROUP BY month ORDER BY month
    """, [species_id, continent])
    seasonal = cur.fetchall()

    cur.close()
    conn.close()
    return {"detail": detail, "trend": trend, "seasonal": seasonal}


@router.get("/species/{species_id}/hexes")
def get_species_hexes(
    species_id: str,
    continent:  str = Query("North America"),
):
    """Which hexes contain this species — for map highlighting."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT DISTINCT h3_index
        FROM sightings
        WHERE species_id = %s
        AND continent = %s
        AND h3_index IS NOT NULL
    """, [species_id, continent])
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results
