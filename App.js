// Detectar contenedor
const container = document.getElementById("films-container") ||
    document.getElementById("people-container") ||
    document.getElementById("locations-container") ||
    document.getElementById("vehicles-container");

//El Input de la barra de Busqueda     
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
        idKey: "id",              // AÑADIMOS ESTO
        detailPage: "PeliculaDetalle.html"  // NUEVO
    },
    "Personajes.html": {
        url: "https://ghibliapi.vercel.app/people",
        titleKey: "name",
        imageKey: null // Se asignará dinámicamente
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
<<<<<<< Updated upstream
const LOCATION_IMAGES_URL = "./Localizacion-img-id.json"; // nombre real del fichero
=======
const LOCATION_IMAGES_URL = "./Localizacion-img-id.json"; 
>>>>>>> Stashed changes

// condicional por si no tiene pagina registrada
if (!apiConfig[page]) {
    console.warn("Página no registrada en App.js");
}

// Obtener datos desde API
async function loadData() {
    const config = apiConfig[page];
    if(!config){
        console.warn("Página no registrada en App.js");
        return;
    }

    try {
    const response = await fetch(config.url);
    const data = await response.json();
    
    // Mapa de imágenes solo para Personajes
    let imageMap = null;
    if (page === "Personajes.html") {
      const imgRes = await fetch(PERSON_IMAGES_URL); // ./personajes-imagenes-por-id.json
      const imgJson = await imgRes.json();           // { images: { "<id>": "https://..." } }
      imageMap = imgJson?.images || null;
    }
    if (page === "Localizaciones.html") {
        const imgRes = await fetch(LOCATION_IMAGES_URL); // ./personajes-imagenes-por-id.json
        const imgJson = await imgRes.json();           // { images: { "<id>": "https://..." } }
      imageMap = imgJson?.images || null;
    }
        
         // Guardar películas SOLO si estamos en Peliculas.html
        if (page === "Peliculas.html") {
            allFilms = data;
        }
        // Se actualiza la llamada al render, agregué imageMap
        renderCards(data, config, imageMap);

    } catch (error) {
        console.error("Error al cargar API:", error);
    }
}

// Renderizar tarjetas
const NOT_FOUND_IMG = "Logo.png"; // usar logo como fallback si no existe not-found.jpg
function renderCards(data, config,imageMap) {
    if (!container) {
        console.error("Contenedor no encontrado para la página:", page);
        return;
    }
    container.innerHTML = "";

    // Recorre cada item de "data"
    data.forEach(item => {
        // Saca el título según la clave
        const title = item[config.titleKey];
        
// Elegir imagen según la página
    let imageSrc = NOT_FOUND_IMG;
    if (page === "Personajes.html" && imageMap) {
      imageSrc = imageMap[item.id] || NOT_FOUND_IMG;
    }
    else if (page ==="Localizaciones.html" && imageMap) {
    imageSrc = imageMap[item.id] || NOT_FOUND_IMG;
    }
     else if (config.imageKey) {
    imageSrc = item[config.imageKey] || NOT_FOUND_IMG;
}

        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            <img src="${imageSrc}" alt="${title}">
            <h2>${title}</h2>
        `;
                //Crear el Evento de Click de las Tarjetas

        if (page === "Peliculas.html" && config.detailPage) {
            card.addEventListener("click", () => {
                window.location.href = `${config.detailPage}?id=${item.id}`;
            });
        }

        // CLICK: Personajes → detalle de personaje
        if (page === "Personajes.html") {
            card.addEventListener("click", () => {
                window.location.href = `PersonajeDetalle.html?id=${item.id}`;
            });
        }

        // CLICK: Localizaciones → detalle de localización
        if (page === "Localizaciones.html") {
            card.addEventListener("click", () => {
                window.location.href = `LocalizacionDetalle.html?id=${item.id}`;
            });
        }

        container.appendChild(card);
    });
}
let filtroEspecial = null; // null = no usar filtro especial (usa el general)


if (page === "Peliculas.html" && tipoFiltro) {

    tipoFiltro.addEventListener("change", () => {
        filtroEspecial = tipoFiltro.value === "none" ? null : tipoFiltro.value;
        aplicarFiltros();
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            aplicarFiltros();
        });
    }
}

// Filtro de búsqueda
if (searchInput) {
     searchInput.addEventListener("input", () => {
        aplicarFiltros();
    });
}

// Función para aplicar filtro
function aplicarFiltros() {

    if (page !== "Peliculas.html") return;

    const texto = searchInput.value.toLowerCase();

    // SIN filtro especial → usar el buscador por título
    if (filtroEspecial === null) {

        const cards = document.querySelectorAll(".card");

        cards.forEach(card => {
            const title = card.querySelector("h2").textContent.toLowerCase();
            card.style.display = title.includes(texto) ? "block" : "none";
        });

        return; 
    }

    // CON filtro especial → filtrar el JSON
    const campo = filtroEspecial;

    const filtradas = allFilms.filter(pelicula => {
        const valor = pelicula[campo].toString().toLowerCase();
        return valor.includes(texto);
    });

    renderCards(filtradas, apiConfig["Peliculas.html"], null);
    
}
// Sirve para Oculatr los Filtros 
document.addEventListener("DOMContentLoaded", () => {

    const btnFiltros = document.getElementById("btnFiltros");
    const filtroMenu = document.getElementById("filtroMenu");

    btnFiltros.addEventListener("click", () => {
        filtroMenu.classList.toggle("oculto");
    });

});


// Ejecutar API
loadData();
