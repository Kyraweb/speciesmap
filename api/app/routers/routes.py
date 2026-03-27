from fastapi import APIRouter, Query
from app.database import get_connection

router = APIRouter()


@router.get("/routes")
def get_migration_routes(
    continent: str = Query("North America"),
    species_id: str = Query(None),
):
    """Migration routes as GeoJSON LineStrings for MapLibre animation."""
    conn = get_connection()
    cur  = conn.cursor()

    query = """
        SELECT
            mr.id,
            mr.name,
            mr.season,
            s.common_name,
            s.scientific_name,
            s.class,
            ST_AsGeoJSON(mr.route)::json AS geometry
        FROM migration_routes mr
        JOIN species s ON s.id = mr.species_id
        WHERE mr.continent = %s
    """
    params = [continent]

    if species_id:
        query += " AND mr.species_id = %s"
        params.append(species_id)

    cur.execute(query, params)
    results = cur.fetchall()
    cur.close()
    conn.close()

    return results
