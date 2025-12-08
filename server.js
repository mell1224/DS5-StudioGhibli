const express = require("express");
const cors = require("cors");
const { getConnection, sql } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
//      LISTAR COMENTARIOS
// =======================
app.get("/comentarios/:peliculaId", async (req, res) => {
    const { peliculaId } = req.params;

    const pool = await getConnection();
    const result = await pool.request()
        .input("peliculaId", sql.VarChar, peliculaId)
        .query(`
            SELECT anonimo, comentario, fecha
            FROM comentarios
            WHERE pelicula_id = @peliculaId
            ORDER BY fecha DESC
        `);

    res.json(result.recordset);
});

// =======================
//      INSERTAR COMENTARIO
// =======================
app.post("/comentarios", async (req, res) => {
    const { pelicula_id, anonimo, comentario } = req.body;

    const pool = await getConnection();
    await pool.request()
        .input("pelicula_id", sql.VarChar, pelicula_id)
        .input("anonimo", sql.VarChar, anonimo)
        .input("comentario", sql.Text, comentario)
        .query(`
            INSERT INTO comentarios (pelicula_id, anonimo, comentario)
            VALUES (@pelicula_id, @anonimo, @comentario)
        `);

    res.json({ mensaje: "Comentario guardado" });
});

app.listen(3000, () => {
    console.log("API corriendo en http://localhost:3000");
});