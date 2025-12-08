const sql = require("mssql");
// CONFIGURACIÓN SEGÚN SQL SERVER
const config = {
    user: "sa",
    password: "kevin2237",
    server: "KHYPNOSIA\\MSSQLSERVERDEV",  // o tu servidor
    database: "WebDSV",
    options: {
        trustServerCertificate: true
    }
};

async function getConnection() {
    try {
        const pool = await sql.connect(config);
        return pool;
    } catch (error) {
        console.log("Error de conexión:", error);
    }
}

module.exports = { sql, getConnection };
