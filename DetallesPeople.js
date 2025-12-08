
// 1) Obtener el ID desde la URL
const params = new URLSearchParams(window.location.search);
const personajeId = params.get("id");

// 2) Contenedor donde va el detalle del personaje
const container = document.getElementById("detalle-container");

// 3) Ruta del JSON local con imágenes (tu archivo existente)
const PERSON_IMAGES_URL = "./personajes-imagenes-por-id.json";
const NOT_FOUND_IMG = "not-found.jpg";

// 4) Cargar detalle del personaje
async function loadPersonDetail() {
  if (!personajeId) {
    if (container) container.innerHTML = "<p>ID de personaje no proporcionado.</p>";
    return;
  }

  try {
    // 4.1) Traer datos del personaje
    const res = await fetch(`https://ghibliapi.vercel.app/people/${personajeId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const person = await res.json();

    // 4.2) Traer la imagen desde el JSON local (misma que usas en Personajes.html)
    let imgSrc = NOT_FOUND_IMG;
    try {
      const imgRes = await fetch(PERSON_IMAGES_URL);
      if(imgRes.ok){
      const imgJson = await imgRes.json();
        if(imgJson?.images && imgJson.images[personajeId]){
          imgSrc = imgJson.images[personajeId];
        }
    }
    } catch (e) {
      console.warn("No se pudo cargar el mapa de imágenes, usando fallback:", e);
    }

    // 4.3) Traer títulos de películas donde aparece (opcional)
    let filmTitles = [];
    try {
      if (Array.isArray(person.films)) {
        const filmPromises = person.films.map(async (filmUrl) => {
          const fRes = await fetch(filmUrl);
          const filmData = await fRes.json();
          return filmData.title;
        });
        filmTitles = await Promise.all(filmPromises);
      }
    } catch (e) {
      console.warn("No se pudieron cargar los títulos de películas:", e);
    }

    // 4.4) Traer nombre de especie
    let speciesName = "N/D";
    try {
      if (person.species && typeof person.species === "string" && person.species.trim() !== "") {
        const sRes = await fetch(person.species);
        if (sRes.ok) {
          const speciesObj = await sRes.json();
          // La API de species expone el nombre en `name`
          speciesName = speciesObj?.name ?? "N/D";
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar la especie:", e);
    }

    renderPersonDetail(person, imgSrc, filmTitles, speciesName);
  } catch (err) {
    console.error("Error al cargar los detalles:", err);
    if (container) container.innerHTML = "<p>Error cargando detalles.</p>";
  }
}

// 5) Renderizar la tarjeta del personaje
function renderPersonDetail(person, imgSrc, filmTitles, speciesName) {
  if (!container) return;

  // Campos con fallback
  const name = person?.name ?? "Sin nombre";
  const gender = person?.gender ?? "N/D";
  const age = person?.age ?? "N/D";
  const eye = person?.eye_color ?? "N/D";
  const hair = person?.hair_color ?? "N/D";

  const filmsListHTML = (filmTitles && filmTitles.length)
    ? `<ul>${filmTitles.map(t => `<li>${t}</li>`).join("")}</ul>`
    : `<p>No se encontraron películas.</p>`;

  container.innerHTML = `
    <div class="detalle-card">
      <img src="${imgSrc}" alt="${name}" class="detalle-img">
      <div class="detalle-info">
        <h1>${name}</h1>
        <p><strong>Género:</strong> ${gender}</p>
        <p><strong>Edad:</strong> ${age}</p>
        <p><strong>Color de ojos:</strong> ${eye}</p>
        <p><strong>Color de cabello:</strong> ${hair}</p>
        <p><strong>Especie:</strong> ${speciesName}</p>

        <h2>Películas</h2>
        ${filmsListHTML}

        <button id="volverBtn" class="volver-btn">⬅ Volver</button>
      </div>
    </div>
  `;

  // 6) Botón volver
  const volver = document.getElementById("volverBtn");
  if (volver) volver.addEventListener("click", () => history.back());
}

// 8) Iniciar
loadPersonDetail();
