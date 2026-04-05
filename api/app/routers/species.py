from fastapi import APIRouter, Query
from app.database import get_connection

router = APIRouter()

TARGET_CLASSES = ['Mammalia', 'Reptilia', 'Amphibia']


@router.get("/species")
def get_species(
    continent:   str = Query("North America"),
    class_:      str = Query(None, alias="class"),
    iucn_status: str = Query(None),
    search:      str = Query(None),
    limit:       int = Query(200),
):
    """
    Fast species list using pre-computed species_continent_stats table.
    Avoids full sightings scan.
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
            scs.sighting_count
        FROM species sp
        JOIN species_continent_stats scs
            ON scs.species_id = sp.id AND scs.continent = %s
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


@router.get("/species/counts")
def get_species_counts(continent: str = Query("North America")):
    """Fast class counts from species_continent_stats."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT
            sp.class,
            COUNT(DISTINCT scs.species_id) as species_count,
            SUM(scs.sighting_count)        as sighting_count
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


@router.get("/species/{species_id}")
def get_species_detail(
    species_id: str,
    continent:  str = Query("North America"),
):
    """Full species detail with trend and seasonal charts."""
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        SELECT
            sp.id, sp.scientific_name, sp.class, sp.order_name,
            sp.family, sp.genus, sp.iucn_status, sp.common_name,
            COALESCE(
                NULLIF(TRIM(sp.common_name), ''),
                SPLIT_PART(sp.scientific_name, ' ', 1) || ' ' ||
                SPLIT_PART(sp.scientific_name, ' ', 2)
            ) AS display_name,
            scs.sighting_count,
            si_range.first_seen,
            si_range.last_seen
        FROM species sp
        JOIN species_continent_stats scs
            ON scs.species_id = sp.id AND scs.continent = %s
        LEFT JOIN (
            SELECT species_id,
                   MIN(observed_at) as first_seen,
                   MAX(observed_at) as last_seen
            FROM sightings
            WHERE species_id = %s AND continent = %s
            GROUP BY species_id
        ) si_range ON si_range.species_id = sp.id
        WHERE sp.id = %s
    """, [continent, species_id, continent, species_id])
    detail = cur.fetchone()

    cur.execute("""
        SELECT EXTRACT(YEAR FROM observed_at)::INT as year, COUNT(*) as count
        FROM sightings
        WHERE species_id = %s AND continent = %s AND observed_at IS NOT NULL
        GROUP BY year ORDER BY year
    """, [species_id, continent])
    trend = cur.fetchall()

    cur.execute("""
        SELECT EXTRACT(MONTH FROM observed_at)::INT as month, COUNT(*) as count
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
    """Which hexes contain sightings of this species — for map highlighting."""
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
