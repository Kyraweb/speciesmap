"""
speciesmap.org — Admin interface
Simple password-protected HTML admin for manual species data entry.
Sits under /admin in the API.
"""

from fastapi import APIRouter, Request, Form, Query, HTTPException
from fastapi.responses import HTMLResponse
from app.database import get_connection
import os

router = APIRouter()

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
ADMIN_USER = os.getenv("ADMIN_USER", "admin")


def auth_check(password: str):
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Admin not configured — set ADMIN_PASSWORD env var")
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")


ADMIN_CSS = """
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f0ece0; --bg-card: #e8e4d8; --bg-input: #faf8f2;
    --text: #2a2418; --muted: #a09080; --rust: #b05828;
    --sage: #6a9848; --border: rgba(0,0,0,0.1);
    --font: system-ui, -apple-system, sans-serif;
  }
  body { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; }
  nav {
    background: var(--bg-card); border-bottom: 0.5px solid var(--border);
    padding: 0 24px; height: 52px; display: flex; align-items: center; gap: 20px;
  }
  .logo { font-size: 15px; color: var(--text); font-weight: 400; }
  .logo b { color: var(--rust); font-weight: 400; }
  .nav-tag { font-size: 10px; background: var(--rust); color: white; padding: 2px 7px; border-radius: 10px; letter-spacing: 0.5px; }
  .container { max-width: 900px; margin: 32px auto; padding: 0 24px; }
  h2 { font-size: 18px; font-weight: 400; color: var(--text); margin-bottom: 20px; }
  .card { background: var(--bg-card); border-radius: 8px; border: 0.5px solid var(--border); padding: 20px; margin-bottom: 20px; }
  label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px; }
  input, textarea, select {
    width: 100%; background: var(--bg-input); border: 0.5px solid var(--border);
    border-radius: 5px; padding: 8px 10px; font-size: 13px; color: var(--text);
    font-family: var(--font); outline: none;
  }
  input:focus, textarea:focus { border-color: var(--rust); }
  textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
  .btn {
    padding: 8px 18px; border-radius: 5px; font-size: 12px;
    cursor: pointer; border: none; font-family: var(--font);
  }
  .btn-primary { background: var(--rust); color: white; }
  .btn-secondary { background: var(--bg-input); color: var(--text); border: 0.5px solid var(--border); }
  .btn:hover { opacity: 0.88; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .field { margin-bottom: 14px; }
  .badge { display: inline-block; font-size: 9px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
  .badge-CR { background: #fde8e8; color: #c02020; }
  .badge-EN { background: #fdeede; color: #c05010; }
  .badge-VU { background: #fdf8dc; color: #a08010; }
  .badge-LC { background: #eaf3de; color: #3a6818; }
  .badge-NT { background: #f5f5dc; color: #806010; }
  .species-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .species-table th { text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); border-bottom: 0.5px solid var(--border); }
  .species-table td { padding: 8px 10px; border-bottom: 0.5px solid var(--border); }
  .species-table tr:hover td { background: rgba(0,0,0,0.02); }
  .missing { color: #c05010; font-size: 10px; }
  .has { color: var(--sage); font-size: 10px; }
  .edit-link { color: var(--rust); text-decoration: none; font-size: 11px; }
  .edit-link:hover { text-decoration: underline; }
  .alert { background: #eaf3de; border: 0.5px solid #6a9848; border-radius: 5px; padding: 10px 14px; font-size: 12px; color: #3a6818; margin-bottom: 16px; }
  .photo-preview { max-width: 120px; max-height: 90px; border-radius: 5px; object-fit: cover; margin-top: 8px; display: block; }
  .login-wrap { max-width: 360px; margin: 80px auto; }
  .search-bar { display: flex; gap: 10px; margin-bottom: 20px; }
  .search-bar input { flex: 1; }
  .stat-pills { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .stat-pill { background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 6px; padding: 10px 16px; font-size: 13px; }
  .stat-pill .num { font-size: 20px; color: var(--sage); font-family: Georgia, serif; display: block; }
  .stat-pill .lbl { font-size: 10px; color: var(--muted); }
</style>
"""


@router.get("/admin", response_class=HTMLResponse)
def admin_login():
    return f"""<!DOCTYPE html><html><head><title>speciesmap admin</title>{ADMIN_CSS}</head><body>
<nav><div class="logo">species<b>map</b></div><span class="nav-tag">admin</span></nav>
<div class="container">
  <div class="login-wrap">
    <div class="card">
      <h2>Admin login</h2>
      <form method="post" action="/admin/dashboard">
        <div class="field">
          <label>Password</label>
          <input type="password" name="password" required autofocus/>
        </div>
        <button class="btn btn-primary" type="submit">Sign in →</button>
      </form>
    </div>
  </div>
</div>
</body></html>"""


@router.post("/admin/dashboard", response_class=HTMLResponse)
def admin_dashboard(
    password: str = Form(...),
    search: str = Form(""),
    class_filter: str = Form(""),
):
    auth_check(password)
    conn = get_connection()
    cur  = conn.cursor()

    # Stats
    cur.execute("SELECT COUNT(*) as total FROM species WHERE class = ANY(%s)", [['Mammalia', 'Reptilia', 'Amphibia']])
    total = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) as c FROM species WHERE class = ANY(%s) AND (common_name IS NULL OR common_name = '')", [['Mammalia', 'Reptilia', 'Amphibia']])
    missing_names = cur.fetchone()["c"]

    cur.execute("SELECT COUNT(*) as c FROM species WHERE class = ANY(%s) AND (photo_url IS NULL OR photo_url = '')", [['Mammalia', 'Reptilia', 'Amphibia']])
    missing_photos = cur.fetchone()["c"]

    cur.execute("SELECT COUNT(*) as c FROM species WHERE class = ANY(%s) AND (description IS NULL OR description = '')", [['Mammalia', 'Reptilia', 'Amphibia']])
    missing_desc = cur.fetchone()["c"]

    # Species list
    query = """
        SELECT
            sp.id, sp.scientific_name, sp.common_name, sp.class,
            sp.iucn_status, sp.photo_url, sp.description,
            COALESCE(scs.sighting_count, 0) as sighting_count
        FROM species sp
        LEFT JOIN (
            SELECT species_id, SUM(sighting_count) as sighting_count
            FROM species_continent_stats
            GROUP BY species_id
        ) scs ON scs.species_id = sp.id
        WHERE sp.class = ANY(%s)
    """
    params = [['Mammalia', 'Reptilia', 'Amphibia']]

    if search:
        query += " AND (sp.scientific_name ILIKE %s OR sp.common_name ILIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])

    if class_filter:
        query += " AND sp.class = %s"
        params.append(class_filter)

    query += " ORDER BY sighting_count DESC LIMIT 50"
    cur.execute(query, params)
    species_list = cur.fetchall()
    cur.close()
    conn.close()

    rows = ""
    for sp in species_list:
        iucn    = sp["iucn_status"] or "—"
        badge   = f'<span class="badge badge-{iucn}">{iucn}</span>' if sp["iucn_status"] else "—"
        photo   = '<span class="has">✓</span>' if sp["photo_url"] else '<span class="missing">missing</span>'
        desc    = '<span class="has">✓</span>' if sp["description"] else '<span class="missing">missing</span>'
        name    = sp["common_name"] or f'<span class="missing">{sp["scientific_name"]}</span>'
        scount  = f'{sp["sighting_count"]:,}' if sp["sighting_count"] else "0"
        rows += f"""<tr>
            <td>{name}</td>
            <td style="font-style:italic;color:#a09080;font-size:11px">{sp["scientific_name"]}</td>
            <td>{sp["class"]}</td>
            <td>{badge}</td>
            <td>{photo}</td>
            <td>{desc}</td>
            <td>{scount}</td>
            <td><a class="edit-link" href="/admin/edit/{sp["id"]}?pw={password}">Edit →</a></td>
        </tr>"""

    return f"""<!DOCTYPE html><html><head><title>speciesmap admin</title>{ADMIN_CSS}</head><body>
<nav>
  <div class="logo">species<b>map</b></div>
  <span class="nav-tag">admin</span>
  <span style="margin-left:auto;font-size:11px;color:var(--muted)">{total:,} species</span>
</nav>
<div class="container">
  <div class="stat-pills">
    <div class="stat-pill"><span class="num">{total:,}</span><span class="lbl">Total species</span></div>
    <div class="stat-pill"><span class="num" style="color:#c05010">{missing_names:,}</span><span class="lbl">Missing common names</span></div>
    <div class="stat-pill"><span class="num" style="color:#c05010">{missing_photos:,}</span><span class="lbl">Missing photos</span></div>
    <div class="stat-pill"><span class="num" style="color:#c05010">{missing_desc:,}</span><span class="lbl">Missing descriptions</span></div>
  </div>

  <form method="post" action="/admin/dashboard" class="search-bar">
    <input type="hidden" name="password" value="{password}"/>
    <input type="text" name="search" placeholder="Search by name..." value="{search}"/>
    <select name="class_filter">
      <option value="">All classes</option>
      <option value="Mammalia" {"selected" if class_filter == "Mammalia" else ""}>Mammals</option>
      <option value="Reptilia" {"selected" if class_filter == "Reptilia" else ""}>Reptiles</option>
      <option value="Amphibia" {"selected" if class_filter == "Amphibia" else ""}>Amphibians</option>
    </select>
    <button class="btn btn-primary" type="submit">Search</button>
    <a href="/admin" class="btn btn-secondary" style="text-decoration:none;display:flex;align-items:center">Logout</a>
  </form>

  <div class="card" style="padding:0;overflow:hidden">
    <table class="species-table">
      <thead><tr>
        <th>Common name</th><th>Scientific name</th><th>Class</th>
        <th>IUCN</th><th>Photo</th><th>Description</th><th>Sightings</th><th></th>
      </tr></thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
  <p style="font-size:11px;color:var(--muted)">Showing top 50 results by sighting count</p>
</div>
</body></html>"""


@router.get("/admin/edit/{species_id}", response_class=HTMLResponse)
def admin_edit_get(species_id: str, pw: str = Query(...)):
    auth_check(pw)
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("SELECT * FROM species WHERE id = %s", [species_id])
    sp = cur.fetchone()
    cur.close()
    conn.close()

    if not sp:
        return "<h1>Species not found</h1>"

    photo_preview = f'<img src="{sp["photo_url"]}" class="photo-preview" alt="photo"/>' if sp["photo_url"] else ""

    return f"""<!DOCTYPE html><html><head><title>Edit {sp["scientific_name"]}</title>{ADMIN_CSS}</head><body>
<nav>
  <div class="logo">species<b>map</b></div>
  <span class="nav-tag">admin</span>
  <span style="margin-left:12px;font-size:12px;color:var(--muted)">Editing: {sp["scientific_name"]}</span>
</nav>
<div class="container">
  <a href="javascript:history.back()" style="font-size:12px;color:var(--rust);text-decoration:none">← Back to list</a>

  <div class="card" style="margin-top:16px">
    <h2 style="margin-bottom:6px">{sp.get("common_name") or sp["scientific_name"]}</h2>
    <p style="font-size:12px;font-style:italic;color:var(--muted);margin-bottom:20px">{sp["scientific_name"]} · {sp["class"]}</p>

    <form method="post" action="/admin/edit/{species_id}">
      <input type="hidden" name="password" value="{pw}"/>

      <div class="row">
        <div class="field">
          <label>Common name</label>
          <input type="text" name="common_name" value="{sp.get("common_name") or ""}" placeholder="e.g. Red Fox"/>
        </div>
        <div class="field">
          <label>IUCN Status</label>
          <select name="iucn_status">
            <option value="">Unknown</option>
            {"".join(f'<option value="{s}" {"selected" if sp.get("iucn_status") == s else ""}>{s}</option>' for s in ["CR","EN","VU","NT","LC","DD","NE"])}
          </select>
        </div>
      </div>

      <div class="field">
        <label>Photo URL</label>
        <input type="url" name="photo_url" value="{sp.get("photo_url") or ""}" placeholder="https://..."/>
        {photo_preview}
      </div>

      <div class="field">
        <label>Wikipedia URL</label>
        <input type="url" name="wikipedia_url" value="{sp.get("wikipedia_url") or ""}" placeholder="https://en.wikipedia.org/wiki/..."/>
      </div>

      <div class="field">
        <label>Description / Overview</label>
        <textarea name="description" rows="5" placeholder="A brief scientific description of this species, its habitat, behaviour and range...">{sp.get("description") or ""}</textarea>
      </div>

      <div class="row">
        <div class="field">
          <label>Order</label>
          <input type="text" name="order_name" value="{sp.get("order_name") or ""}"/>
        </div>
        <div class="field">
          <label>Family</label>
          <input type="text" name="family" value="{sp.get("family") or ""}"/>
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label>Genus</label>
          <input type="text" name="genus" value="{sp.get("genus") or ""}"/>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-primary" type="submit">Save changes</button>
        <a href="javascript:history.back()" class="btn btn-secondary" style="text-decoration:none">Cancel</a>
      </div>
    </form>
  </div>
</div>
</body></html>"""


@router.post("/admin/edit/{species_id}", response_class=HTMLResponse)
def admin_edit_post(
    species_id:   str,
    password:     str  = Form(...),
    common_name:  str  = Form(""),
    iucn_status:  str  = Form(""),
    photo_url:    str  = Form(""),
    wikipedia_url: str = Form(""),
    description:  str  = Form(""),
    order_name:   str  = Form(""),
    family:       str  = Form(""),
    genus:        str  = Form(""),
):
    auth_check(password)
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        UPDATE species SET
            common_name   = NULLIF(TRIM(%s), ''),
            iucn_status   = NULLIF(TRIM(%s), ''),
            photo_url     = NULLIF(TRIM(%s), ''),
            wikipedia_url = NULLIF(TRIM(%s), ''),
            description   = NULLIF(TRIM(%s), ''),
            order_name    = NULLIF(TRIM(%s), ''),
            family        = NULLIF(TRIM(%s), ''),
            genus         = NULLIF(TRIM(%s), '')
        WHERE id = %s
    """, [
        common_name, iucn_status, photo_url, wikipedia_url,
        description, order_name, family, genus, species_id
    ])
    conn.commit()

    cur.execute("SELECT scientific_name FROM species WHERE id = %s", [species_id])
    sp = cur.fetchone()
    cur.close()
    conn.close()

    return f"""<!DOCTYPE html><html><head><title>Saved</title>{ADMIN_CSS}</head><body>
<nav><div class="logo">species<b>map</b></div><span class="nav-tag">admin</span></nav>
<div class="container" style="max-width:600px">
  <div class="alert" style="margin-top:32px">
    ✓ Changes saved for <strong>{sp["scientific_name"] if sp else species_id}</strong>
  </div>
  <div style="display:flex;gap:10px">
    <a href="/admin/edit/{species_id}?pw={password}" class="btn btn-primary" style="text-decoration:none">Continue editing</a>
    <a href="javascript:history.back()" class="btn btn-secondary" style="text-decoration:none">Back to list</a>
  </div>
</div>
</body></html>"""
