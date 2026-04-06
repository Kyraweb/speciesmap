from fastapi import APIRouter, Query
from app.database import get_connection
import httpx

router = APIRouter()

TARGET_CLASSES = ['Mammalia', 'Reptilia', 'Amphibia']
ADMIN_PASSWORD = "speciesmap2024"  # Change in production via env var


@router.get("/species/counts")
def get_species_counts(continent: str = Query("North America")):
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
            sp.photo_url,
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
            sp.family, sp.genus, sp.iucn_status, sp.common_name,
            sp.photo_url, sp.description, sp.wikipedia_url,
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

    cur.execute("""
        SELECT EXTRACT(YEAR FROM observed_at)::INT AS year, COUNT(*) AS count
        FROM sightings
        WHERE species_id = %s AND continent = %s AND observed_at IS NOT NULL
        GROUP BY year ORDER BY year
    """, [species_id, continent])
    trend = cur.fetchall()

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


@router.get("/species/{species_id}/photo")
async def get_species_photo(species_id: str):
    """
    Fetch photo from iNaturalist if not already stored.
    Returns photo_url for the species.
    """
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("SELECT photo_url, scientific_name FROM species WHERE id = %s", [species_id])
    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return {"photo_url": None}

    # Return cached URL if we have it
    if row["photo_url"]:
        cur.close()
        conn.close()
        return {"photo_url": row["photo_url"]}

    # Fetch from iNaturalist
    scientific_name = row["scientific_name"]
    photo_url = None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.inaturalist.org/v1/taxa",
                params={"q": scientific_name, "per_page": 1, "rank": "species"}
            )
            data = resp.json()
            results = data.get("results", [])
            if results and results[0].get("default_photo"):
                photo = results[0]["default_photo"]
                photo_url = photo.get("medium_url") or photo.get("url")
    except Exception:
        pass

    # Cache it in the DB
    if photo_url:
        cur.execute(
            "UPDATE species SET photo_url = %s WHERE id = %s",
            [photo_url, species_id]
        )
        conn.commit()

    cur.close()
    conn.close()
    return {"photo_url": photo_url}


@router.get("/species/{species_id}/hexes")
def get_species_hexes(species_id: str, continent: str = Query("North America")):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT DISTINCT h3_index FROM sightings
        WHERE species_id = %s AND continent = %s AND h3_index IS NOT NULL
    """, [species_id, continent])
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results
