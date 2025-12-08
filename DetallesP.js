// DetallesP.js

// 1) Obtener el ID desde la URL y exponerlo de forma consistente
const params = new URLSearchParams(window.location.search);
const peliculaId = params.get("id");

// 2) Contenedor donde va la tarjeta de la película
const container = document.getElementById("detalle-container");

// 3) API local (backend)
const API_URL = "http://localhost:3000"; // asegúrate que el API esté corriendo

// 4) Función para generar nombre anónimo con número
function generarNombreAnonimo() {
    const numero = Math.floor(Math.random() * 9000) + 1000; // 1000–9999
    return `Anónimo#${numero}`;
}

// 5) Cargargo detalle de la película (API Ghibli)
async function loadMovieDetail() {
    if (!peliculaId) {
        container && (container.innerHTML = "<p>ID de película no proporcionado.</p>");
        return;
    }

    try {
        const response = await fetch(`https://ghibliapi.vercel.app/films/${peliculaId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const movie = await response.json();
        renderMovieDetail(movie);
    } catch (err) {
        console.error("Error al cargar los detalles:", err);
        container && (container.innerHTML = "<p>Error cargando detalles.</p>");
    }
}

// 6) Renderizar tarjeta
function renderMovieDetail(movie) {
    container.innerHTML = `
        <div class="detalle-card">
            <img class="detalle-img" src="${movie.movie_banner || movie.image || ''}" alt="${movie.title}">
            <div class="detalle-info">
                <h1>${movie.title}</h1>
                <p><strong>Descripción:</strong> ${movie.description}</p>
                <p><strong>Director:</strong> ${movie.director}</p>
                <p><strong>Año de estreno:</strong> ${movie.release_date}</p>
                <p><strong>Duración:</strong> ${movie.running_time} min</p>
                <p><strong>Puntuación:</strong> ${movie.rt_score} ★</p>
                <button id="volverBtn" class="volver-btn">⬅ Volver</button>
            </div>
        </div>

        <section class="comentarios-section">
            <h2>Comentarios</h2>
            <textarea id="comentarioTexto" placeholder="Escribe tu comentario..."></textarea>
            <button id="btnComentar">Enviar Comentario</button>

            <h3>Comentarios recientes:</h3>
            <div id="listaComentarios"></div>
        </section>
    `;

    // Agregar funcionalidad al botón volver (ya que ahora existe en el DOM)
    const volver = document.getElementById("volverBtn");
    if (volver) volver.addEventListener("click", () => history.back());
}

// 7) Cargar comentarios desde la API local
async function cargarComentarios() {
    if (!peliculaId) return;

    const lista = document.getElementById("listaComentarios");
    if (!lista) return;

    lista.innerHTML = "Cargando comentarios...";

    try {
        const res = await fetch(`${API_URL}/comentarios/${peliculaId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        lista.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
            lista.innerHTML = "<p>Sin comentarios aún.</p>";
            return;
        }

        data.forEach(c => {
            const div = document.createElement("div");
            div.classList.add("comentario");

            // formatear fecha legible si viene en formato ISO
            let fechaTexto = c.fecha ? new Date(c.fecha).toLocaleString() : "";

            div.innerHTML = `
                <strong>${c.anonimo}</strong>
                <p>${c.comentario}</p>
                <small>${fechaTexto}</small>
                <hr>
            `;

            lista.appendChild(div);
        });

    } catch (err) {
        console.error("Error cargando comentarios:", err);
        lista.innerHTML = "<p>Error al cargar comentarios.</p>";
    }
}

// 8) Enviar comentario (se registra anonimo#xxxx)
async function enviarComentario() {
    const input = document.getElementById("comentarioTexto");
    if (!input) return alert("Elemento de comentario no encontrado en la página.");

    const texto = input.value.trim();
    if (texto === "") {
        alert("Escribe primero el comentario mijo XD ");
        return;
    }

    const anonimo = generarNombreAnonimo();

    try {
        const res = await fetch(`${API_URL}/comentarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pelicula_id: peliculaId,
                anonimo: anonimo,
                comentario: texto
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const respuesta = await res.json();
        console.log("POST respuesta:", respuesta);

        input.value = "";
        cargarComentarios();
    } catch (err) {
        console.error("Error al enviar comentario:", err);
        alert("No se pudo enviar el comentario. Revisa la consola.");
    }
}

// 9) Esperar al DOM y luego inicializar (evita nulls)
document.addEventListener("DOMContentLoaded", () => {
    // cargar detalle (esto inyecta el HTML del formulario y contenedores)
    loadMovieDetail().then(() => {
        // después de renderizar el detalle, podemos vincular el botón
        // (esperamos corto para garantizar que el HTML ya esté en el DOM)
        setTimeout(() => {
            // vincular evento al botón enviar
            const btn = document.getElementById("btnComentar");
            if (btn) btn.addEventListener("click", enviarComentario);

            // cargar comentarios
            cargarComentarios();
        }, 50);
    });
});
