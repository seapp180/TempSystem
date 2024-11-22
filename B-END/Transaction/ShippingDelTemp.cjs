const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.delInvTepm = async function (req, res) {
    let connect;
    const P_SITE = req.query.P_SITE
    const P_SO = req.query.P_SO
    const P_LINE = req.query.P_LINE
    try {
        connect = await ConnectOracleDB("INV");
        let query = ``;
        query = ``;
        query = ` DELETE FROM INV.INV_TEMP T WHERE T.IVT_SITE = :1 AND T.IVT_SO = :2 AND T.IVT_LINE = :3 `;
        await connect.execute(query, [P_SITE, P_SO, P_LINE]);
        await connect.commit();
        res.status(200).send('');

    } catch (err) {
        if (connect) {
            try {
                await connect.rollback();
                res.status(404).send({ err: err.message });
                console.log(err.message)
            } catch (rollbackErr) {
                console.error("Error occurred during rollback: ", rollbackErr.message);
                res.status(500).send("Error occurred during rollback: ", rollbackErr.message);
                console.log(rollbackErr.message)
            }
        }
    } finally {
        if (connect) {
            try {
                await connect.close();
            } catch (closeErr) {
                console.error("Error occurred during closing connection: ", closeErr.message);
                res.status(500).send("Error occurred during closing connection: ", closeErr.message);
            }
        }
    }

};

module.exports.getDatatemp = async function (req, res) {
    const P_SO = req.query.P_SO;
    const P_LINE = req.query.P_LINE;

    try {

        const connect = await ConnectOracleDB("INV");
        let query = "";
        query += `  SELECT T.IVT_SITE, `;
        query += `         T.IVT_SO, `;
        query += `         T.IVT_LINE, `;
        query += `         T.IVT_USER_ID, `;
        query += `         TO_CHAR(T.IVT_DUE_DATE,'DD/MM/YYYY') AS IVT_DUE_DATE, `;
        query += `         T.IVT_SHIP_TO, `;
        query += `         T.IVT_BILL_TO, `;
        query += `         T.IVT_MODE, `;
        query += `         T.IVT_CUST_PO, `;
        query += `         TO_CHAR(T.IVT_MOD_DATE,'DD/MM/YYYY') AS IVT_MOD_DATE `;
        query += `    FROM INV_TEMP T `;
        query += `   WHERE 1 = 1 `;
        query += `     AND (T.IVT_SO = '${P_SO}' OR '${P_SO}' IS NULL) `;
        query += `     AND (T.IVT_LINE = '${P_LINE}' OR '${P_LINE}' IS NULL) `;
        query += `   ORDER BY T.IVT_SITE, T.IVT_SO, T.IVT_LINE `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            ivt_site: row[0],
            ivt_so: row[1],
            ivt_line: row[2],
            ivt_create_by: row[3],
            ivt_so_due: row[4],
            ivt_ship_to: row[5],
            ivt_bill_to: row[6],
            ivt_mode: row[7],
            f_cus_po: row[8],
            f_create_date: row[9],
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};