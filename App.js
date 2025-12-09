
// Detectar contenedor 
const container =
    document.getElementById("films-container") ||
    document.getElementById("people-container") ||
    document.getElementById("locations-container") ||
    document.getElementById("vehicles-container");

// El Input de la barra de Busqueda 
const searchInput = document.getElementById("searchInput");
const tipoFiltro = document.getElementById("tipoFiltro");

// Identificar página actual según el nombre del archivo 
const page = window.location.pathname.split("/").pop();

// Mapa de rutas 
const apiConfig = {
    "Peliculas.html": {
        url: "https://ghibliapi.vercel.app/films",
        titleKey: "title",
        imageKey: "image",
        idKey: "id",                  // AÑADIMOS ESTO
        detailPage: "PeliculaDetalle.html" // NUEVO
    },
    "Personajes.html": {
        url: "https://ghibliapi.vercel.app/people",
        titleKey: "name",
        imageKey: null                // Se asignará dinámicamente
    },
    "Localizaciones.html": {
        url: "https://ghibliapi.vercel.app/locations",
        titleKey: "name",
        imageKey: null
    },
    "Vehiculos.html": {
        url: "https://ghibliapi.vercel.app/vehicles",
        titleKey: "name",
        imageKey: null
    }
};

// Ruta del JSON (como está en la misma carpeta, usa ruta relativa)
const PERSON_IMAGES_URL = "./personajes-imagenes-por-id.json";

// Datos en memoria para filtrar sin recargar
let allFilms = [];    // Guardar películas
let filmsById = {};    // Mapa id  título (NUEVO: útil para personajes)
let allPeople = [];    // Guardar personajes normalizados (NUEVO)
let peopleImageMap = null; // NUEVO: guardar map de imágenes de personajes

// Ejecutar API 
loadData();

// Obtener datos desde API 
async function loadData() {
    const config = apiConfig[page];
    if (!config) {
        console.warn("Página no registrada en App.js:", page);
        return;
    }

    if (!container) {
        console.warn("No se encontró contenedor para:", page);
        return;
    }

    try {
        const response = await fetch(config.url);
        const data = await response.json();

        // Guardar películas SOLO si estamos en Peliculas.html 
        if (page === "Peliculas.html") {
            allFilms = data;
            // Mapa id del título (nwevo)
            filmsById = {};
            data.forEach(f => { filmsById[f.id] = f.title; });
            // Render inicial (sin imageMap)
            renderCards(data, config, null);
            return;
        }

        // Personajes: cargar imageMap y normalizar campos (NUEVO)
        let imageMap = null;
        if (page === "Personajes.html") {
            // 1) Imagen por id desde JSON local
            try {
                const imgRes = await fetch(PERSON_IMAGES_URL);
                const imgJson = await imgRes.json();
                imageMap = (imgJson && imgJson.images) ? imgJson.images : null;
                peopleImageMap = imageMap; // NUEVO: guardar globalmente
            } catch (e) {
                console.warn("No se pudo cargar el mapa de imágenes, uso NOT_FOUND_IMG:", e);
                peopleImageMap = null; // NUEVO
            }

            // 2) Cache de películas (idt ítulo) por si se quiere filtrar por pelí
            if (!Object.keys(filmsById).length) {
                try {
                    const filmsRes = await fetch(apiConfig["Peliculas.html"].url);
                    const filmsJson = await filmsRes.json();
                    filmsById = {};
                    filmsJson.forEach(f => { filmsById[f.id] = f.title; });
                } catch (e) {
                    console.warn("No se pudieron cachear títulos de películas:", e);
                }
            }

            // 3) especies id nombre
            let speciesById = {};
            try {
                const sRes = await fetch("https://ghibliapi.vercel.app/species");
                const sJson = await sRes.json();
                sJson.forEach(sp => { speciesById[sp.id] = sp.name; });
            } catch (e) {
                console.warn("No se pudieron cargar species:", e);
            }

            // 4) Normalizar personajes con textos simples (NUEVO)
            allPeople = data.map(p => {
                // species texto
                let species_name = "";
                if (typeof p.species === "string" && p.species.trim() !== "") {
                    const m = p.species.match(/\/species\/([^/]+)/);
                    const spId = m ? m[1] : p.species;
                    species_name = speciesById[spId] || "";
                }
                //  títulos de las pelis
                let film_titles = [];
                if (Array.isArray(p.films)) {
                    film_titles = p.films
                        .map(url => {
                            const m = url.match(/\/films\/([^/]+)/);
                            const fid = m ? m[1] : url;
                            return filmsById[fid] || "";
                        })
                        .filter(Boolean);
                }
                return {
                    ...p,
                    species_name,                // NUEVO
                    film_titles,                 // NUEVO
                    film_title: film_titles.join(" | ") // NUEVO
                };
            });

            // Render inicial con imageMap (y también lo guardamos en peopleImageMap)
            renderCards(data, config, imageMap);
            return;
        }

        // Otras páginas
        renderCards(data, config, null);

    } catch (error) {
        console.error("Error al cargar API:", error);
    }
}

// Renderizar tarjetas 
const NOT_FOUND_IMG = "not-found.jpg"; // centraliza el fallback
function renderCards(data, config, imageMap) {
    container.innerHTML = "";

    data.forEach(item => {
        // Saca el título según la clave 
        const title = item[config.titleKey];

        // Elegir imagen según la página 
        let imageSrc = NOT_FOUND_IMG;

        if (page === "Personajes.html") {
            // usar el imageMap que nos llega, o el global si es re-render
            const mapToUse = imageMap || peopleImageMap; // NUEVO
            if (mapToUse) {
                const mapped = mapToUse[item.id];
                if (typeof mapped === "string" && /^https?:\/\//i.test(mapped)) {
                    imageSrc = mapped;
                } else {
                    console.warn("Imagen faltante/incorrecta para id:", item.id, "→", mapped);
                }
            }
        } else if (config.imageKey) {
            const direct = item[config.imageKey];
            if (typeof direct === "string" && /^https?:\/\//i.test(direct)) {
                imageSrc = direct;
            } else if (direct) {
                console.warn("imageKey no válido para:", title, "→", direct);
            }
        }

        // Construir la tarjeta con nodos (sin innerHTML para la imagen porq se daña todou)
        const card = document.createElement("div");
        card.classList.add("card");

        const img = document.createElement("img");
        img.src = imageSrc;   // asignar la URL al atributo src
        img.alt = title;

        const h2 = document.createElement("h2");
        h2.textContent = title;

        card.appendChild(img);
        card.appendChild(h2);

        //Crear el Evento de Clik de las Tarjetas 
        if (page === "Peliculas.html" && apiConfig["Peliculas.html"].detailPage) {
            card.addEventListener("click", () => {
                window.location.href = `${apiConfig["Peliculas.html"].detailPage}?id=${item.id}`; // AÑADIMOS ESTO
            });
        }

        // CLICK: Personajes → detalle de personaje 
        if (page === "Personajes.html") {
            card.addEventListener("click", () => {
                window.location.href = `PersonajeDetalle.html?id=${item.id}`; // NUEVO
            });
        }

        container.appendChild(card);
    });
}

// Estado del filtro especial
let filtroEspecial = null; // null = no usar filtro especial (usa el general)

// Listeners del select y del input 
if (tipoFiltro) {
    tipoFiltro.addEventListener("change", () => {
        filtroEspecial = tipoFiltro.value === "none" ? null : tipoFiltro.value;
        aplicarFiltros();
    });
}

// Filtro de búsqueda 
if (searchInput) {
    searchInput.addEventListener("input", () => {
        aplicarFiltros();
    });
}

// Función para aplicar filtro 
function aplicarFiltros() {
    const texto = (searchInput?.value || "").toLowerCase();

    //  PELÍCULAS (lógica de antes)
    if (page === "Peliculas.html") {
        // SIN filtro especial: usar el buscador por título
        if (filtroEspecial === null) {
            const cards = document.querySelectorAll(".card");
            cards.forEach(card => {
                const title = card.querySelector("h2").textContent.toLowerCase();
                card.style.display = title.includes(texto) ? "block" : "none";
            });
            return;
        }

        // CON filtro especial : filtrar el JSON
        const campo = filtroEspecial; // release_date, director, rt_score
        const filtradas = allFilms.filter(pelicula => {
            const valor = (pelicula[campo] ?? "").toString().toLowerCase();
            return valor.includes(texto);
        });
        renderCards(filtradas, apiConfig["Peliculas.html"], null);
        return;
    }

    // PERSONAJES (nombre o campos normalizados de text compicao a entendible)
    if (page === "Personajes.html") {
        const campo = (tipoFiltro?.value || "none");

        // none → filtrar por nombre directamente en las tarjetas
        if (campo === "none") {
            const cards = document.querySelectorAll(".card");
            cards.forEach(card => {
                const title = card.querySelector("h2").textContent.toLowerCase();
                card.style.display = title.includes(texto) ? "block" : "none";
            });
            return;
        }

        // Filtrar sobre arreglo normalizado (age/gender/species_name/eye_color/film_title)
        const base = Array.isArray(allPeople) ? allPeople : [];
        const filtradas = base.filter(p => {
            const valor = (p[campo] ?? "").toString().toLowerCase();
            return valor.includes(texto);
        });

        // IMPORTANTE: re-render con el imageMap global para que no se pierdan imágenes
        renderCards(filtradas, apiConfig["Personajes.html"], peopleImageMap); // NUEVO
    }
    //para Barra de Busqueda de 
     if (page === "Localizaciones.html") {
        // SIN filtro especial: usar el buscador por título
        if (filtroEspecial === null) {
            const cards = document.querySelectorAll(".card");
            cards.forEach(card => {
                const title = card.querySelector("h2").textContent.toLowerCase();
                card.style.display = title.includes(texto) ? "block" : "none";
            });
            return;
        }
    }    
}

// Sirve para Oculatr los Filtros 
document.addEventListener("DOMContentLoaded", () => {
    const btnFiltros = document.getElementById("btnFiltros");
    const filtroMenu = document.getElementById("filtroMenu");
    if (btnFiltros && filtroMenu) {
        btnFiltros.addEventListener("click", () => {
            filtroMenu.classList.toggle("oculto");
        });
    }
});

    // Boton Instagram
    const btnIG = document.getElementById("btnIG");

    btnIG.addEventListener("click", () => {
        window.open("https://www.instagram.com/studioghibli_ds5?igsh=aHl6bjNjcHgxaXI%3D&utm_source=qr", "_blank");
    });
    // Boton Google
    const btnGL = document.getElementById("btnGL");

    btnGL.addEventListener("click", () => {
        window.open("https://www.google.com", "_blank");
    });
