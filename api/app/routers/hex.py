from fastapi import APIRouter, Query
from app.database import get_connection

router = APIRouter()


@router.get("/hex/biodiversity")
def get_hex_biodiversity(
    continent: str = Query("North America"),
    class_: str    = Query(None, alias="class"),
):
    conn = get_connection()
    cur  = conn.cursor()

    if class_:
        cur.execute("""
            SELECT
                si.h3_index,
                COUNT(DISTINCT si.species_id) as species_count,
                COUNT(*) as sighting_count,
                COUNT(DISTINCT CASE WHEN sp.iucn_status IN ('CR','EN','VU')
                      THEN si.species_id END) as threatened_count
            FROM sightings si
            JOIN species sp ON sp.id = si.species_id
            WHERE si.continent = %s
            AND sp.class = %s
            AND si.h3_index IS NOT NULL
            GROUP BY si.h3_index
            ORDER BY sighting_count DESC
        """, [continent, class_])
    else:
        cur.execute("""
            SELECT
                h3_index,
                species_count,
                sighting_count,
                threatened_count,
                mammal_count,
                bird_count,
                reptile_count,
                amphibian_count,
                biodiversity_score
            FROM hex_biodiversity
            WHERE continent = %s
            ORDER BY biodiversity_score DESC
        """, [continent])

    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


@router.get("/hex/stats/overview")
def get_hex_stats(continent: str = Query("North America")):
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT
            COUNT(*) as hex_count,
            SUM(species_count) as total_species_records,
            SUM(sighting_count) as total_sightings,
            SUM(threatened_count) as total_threatened,
            MAX(biodiversity_score) as max_score,
            AVG(biodiversity_score) as avg_score
        FROM hex_biodiversity
        WHERE continent = %s
    """, [continent])
    stats = cur.fetchone()
    cur.close()
    conn.close()
    return stats


@router.get("/stats/global")
def get_global_stats():
    """Global platform stats for landing page."""
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("SELECT COUNT(*) as total FROM sightings")
    sightings = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) as total FROM species")
    species = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(DISTINCT continent) as total FROM sightings WHERE continent IS NOT NULL")
    continents = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) as total FROM hex_biodiversity")
    hexes = cur.fetchone()["total"]

    cur.close()
    conn.close()

    return {
        "sightings":   sightings,
        "species":     species,
        "continents":  continents,
        "hexes":       hexes,
        "classes":     3,
        "data_sources": 4,
    }


@router.get("/hex/{h3_index}")
def get_hex_detail(h3_index: str, continent: str = Query("North America")):
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("SELECT * FROM hex_biodiversity WHERE h3_index = %s", [h3_index])
    summary = cur.fetchone()

    cur.execute("""
        SELECT
            sp.common_name,
            sp.scientific_name,
            sp.class,
            sp.iucn_status,
            COUNT(*) as sighting_count,
            MAX(si.observed_at) as last_seen
        FROM sightings si
        JOIN species sp ON sp.id = si.species_id
        WHERE si.h3_index = %s
        GROUP BY sp.id, sp.common_name, sp.scientific_name, sp.class, sp.iucn_status
        ORDER BY sighting_count DESC
        LIMIT 20
    """, [h3_index])
    species = cur.fetchall()

    cur.execute("""
        SELECT period, class, species_count, sighting_count
        FROM hex_temporal WHERE h3_index = %s
        ORDER BY period, class
    """, [h3_index])
    temporal = cur.fetchall()

    cur.execute("""
        SELECT month, class, sighting_count
        FROM hex_seasonal WHERE h3_index = %s
        ORDER BY month, class
    """, [h3_index])
    seasonal = cur.fetchall()

    cur.close()
    conn.close()

    return {
        "summary":  summary,
        "species":  species,
        "temporal": temporal,
        "seasonal": seasonal,
    }
