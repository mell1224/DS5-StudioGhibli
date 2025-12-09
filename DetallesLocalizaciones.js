// 1) Obtener el ID desde la URL
const params = new URLSearchParams(window.location.search);
const locationId = params.get("id");

// 2) Contenedor donde va la información de detalle
const container = document.getElementById("detalle-container");

// 3) Archivo local con imágenes
const LOC_IMAGES_URL = "./Localizacion-img-id.json"; // archivo real
const NOT_FOUND_IMG = "Logo.png"; // fallback existente

// 4) Cargar datos de la localización
async function loadLocationDetail() {
  if (!locationId) {
    if (container) container.innerHTML = "<p>No se proporcionó ID de localización.</p>";
    console.warn('No se proporcionó id en la URL');
    return;
  }

  try {
    // 4.1 Traer detalle desde API
    const res = await fetch(`https://ghibliapi.vercel.app/locations/${locationId}`);
    if (!res.ok) throw new Error("Error cargando localización");
    const loc = await res.json();

    // 4.2 Obtener imagen desde JSON local
    let imgSrc = NOT_FOUND_IMG;
    try {
      console.log("Cargando mapa de imágenes desde:", LOC_IMAGES_URL);
      const imgRes = await fetch(LOC_IMAGES_URL);
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        const candidate = imgData?.images?.[locationId];
        if (candidate && candidate.trim() !== "") {
          imgSrc = candidate;
        } else {
          console.warn("No se encontró imagen para id:", locationId);
        }
      } else {
        console.warn("Error al cargar JSON de imágenes (status=", imgRes.status, ")");
      }
    } catch (e) {
      console.warn("No se pudo cargar imagen local:", e);
    }

    // 4.3 Obtener títulos de películas de la localización
    let films = [];
    try {
      if (Array.isArray(loc.films)) {
        const promises = loc.films.map(async url => {
          const f = await fetch(url);
          const movie = await f.json();
          return movie.title;
        });

        films = await Promise.all(promises);
      }
    } catch (e) {
      console.warn("Error cargando películas:", e);
    }

    renderLocationDetail(loc, imgSrc, films);

  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Error cargando detalles.</p>";
  }
}

// 5) Renderizar en pantalla
function renderLocationDetail(loc, imgSrc, filmTitles) {
  const { name, climate, terrain, surface_water } = loc;

  const filmsHTML = filmTitles.length
    ? `<ul>${filmTitles.map(t => `<li>${t}</li>`).join("")}</ul>`
    : `<p>No se encontraron películas.</p>`;

  container.innerHTML = `
    <div class="detalle-card">
      <img src="${imgSrc}" alt="${name}" class="detalle-img">

      <div class="detalle-info">
        <h1>${name}</h1>
        <p><strong>Clima:</strong> ${climate ?? "N/D"}</p>
        <p><strong>Terreno:</strong> ${terrain ?? "N/D"}</p>
        <p><strong>Agua superficial:</strong> ${surface_water ?? "N/D"}</p>

        <h2>Películas donde aparece</h2>
        ${filmsHTML}

        <button id="volverBtn" class="volver-btn">⬅ Volver</button>
      </div>
    </div>
  `;

  document.getElementById("volverBtn").addEventListener("click", () => history.back());
}

// 6) Ejecutar
loadLocationDetail();
