from fastapi import APIRouter, Query
from app.database import get_connection

router = APIRouter()


def clean_scientific_name(name):
    """Strip author and year from scientific name for display.
    'Zoraena Kirby, 1890' -> 'Zoraena'
    'Anax junius' -> 'Anax junius'
    """
    if not name:
        return name
    # Remove author/year — anything after a comma
    parts = name.split(',')
    clean = parts[0].strip()
    return clean


@router.get("/sightings")
def get_sightings(
    continent: str   = Query("North America"),
    class_: str      = Query(None, alias="class"),
    iucn_status: str = Query(None),
    species_id: str  = Query(None),
    limit: int       = Query(2000),
):
    """
    Sightings as GeoJSON-ready records for MapLibre.
    display_name: common_name if available, else cleaned scientific name
    """
    conn = get_connection()
    cur  = conn.cursor()

    query = """
        SELECT
            si.id,
            si.species_id,
            COALESCE(
                NULLIF(s.common_name, ''),
                split_part(s.scientific_name, ',', 1)
            )                          AS display_name,
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

    if class_:
        query += " AND s.class = %s"
        params.append(class_)

    if iucn_status:
        query += " AND s.iucn_status = %s"
        params.append(iucn_status)

    if species_id:
        query += " AND si.species_id = %s"
        params.append(species_id)

    query += " ORDER BY RANDOM() LIMIT %s"
    params.append(limit)

    cur.execute(query, params)
    results = cur.fetchall()
    cur.close()
    conn.close()

    return results
