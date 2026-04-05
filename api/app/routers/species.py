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
        AND sp.class = ANY(%s)
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
    """
    Fast class counts using hex_biodiversity summary table.
    Avoids full sightings table scan.
    """
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT
            'Mammalia'  AS class,
            SUM(mammal_count)    AS species_count,
            SUM(CASE WHEN mammal_count > 0 THEN sighting_count * mammal_count::float / NULLIF(species_count,0) ELSE 0 END)::bigint AS sighting_count
        FROM hex_biodiversity WHERE continent = %s
        UNION ALL
        SELECT
            'Reptilia'  AS class,
            SUM(reptile_count)   AS species_count,
            SUM(CASE WHEN reptile_count > 0 THEN sighting_count * reptile_count::float / NULLIF(species_count,0) ELSE 0 END)::bigint AS sighting_count
        FROM hex_biodiversity WHERE continent = %s
        UNION ALL
        SELECT
            'Amphibia'  AS class,
            SUM(amphibian_count) AS species_count,
            SUM(CASE WHEN amphibian_count > 0 THEN sighting_count * amphibian_count::float / NULLIF(species_count,0) ELSE 0 END)::bigint AS sighting_count
        FROM hex_biodiversity WHERE continent = %s
    """, [continent, continent, continent])
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

    cur.execute("""
        SELECT
            sp.id, sp.scientific_name, sp.class, sp.order_name,
            sp.family, sp.genus, sp.iucn_status,
            COALESCE(
                NULLIF(TRIM(sp.common_name), ''),
                SPLIT_PART(sp.scientific_name, ' ', 1) || ' ' ||
                SPLIT_PART(sp.scientific_name, ' ', 2)
            ) AS display_name,
            sp.common_name,
            COUNT(si.id) as sighting_count,
            MIN(si.observed_at) as first_seen,
            MAX(si.observed_at) as last_seen
        FROM species sp
        JOIN sightings si ON si.species_id = sp.id
        WHERE sp.id = %s AND si.continent = %s
        GROUP BY sp.id
    """, [species_id, continent])
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
    return { "detail": detail, "trend": trend, "seasonal": seasonal }
