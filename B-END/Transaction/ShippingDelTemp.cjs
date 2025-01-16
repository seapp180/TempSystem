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

module.exports.getDataForBillTo = async function (req, res) {
    const P_BILL_TO = req.query.P_BILL_TO;
    const P_DATE_FRM = req.query.P_DATE_FRM;
    const P_DATE_TO = req.query.P_DATE_TO;
    const P_INV_NO = req.query.P_INV_NO;

    try {

        const connect = await ConnectOracleDB("INV");
        let query = "";
        query += `  SELECT TO_CHAR(T.IVH_INV_DATE,'DD/MM/YYYY') AS INV_DATE, `;
        query += `         T.IVH_INV_NO AS INV_NO, `;
        query += `         TO_CHAR(CAST(SUBSTR(T.IVH_REMARK6, INSTR(T.IVH_REMARK6, '=') + 1) AS DECIMAL),'FM999,999,990.00') AS INV_TOT_AMT_OLD, `;
        query += `         TO_CHAR(CAST(SUBSTR(T.IVH_REMARK7, INSTR(T.IVH_REMARK7, '=') + 1) AS DECIMAL),'FM999,999,990.00') AS INV_VAT_AMT_OLD, `;
        query += `         T.IVH_EX_RATE_VALUE AS INV_EX_RATE, `;
        query += `         TO_CHAR(T.IVH_TOT_AMT,'FM999,999,990.00') AS INV_TOT_AMT, `;
        query += `         TO_CHAR(T.IVH_VAT_AMT,'FM999,999,990.00') AS INV_VAT_AMT, `;
        query += `         CAST(ROUND(CAST(SUBSTR(T.IVH_REMARK6, INSTR(T.IVH_REMARK6, '=') + 1) AS DECIMAL),2) AS NUMBER(10, 2)) AS TOT_AMT_OLD, `;
        query += `         CAST(ROUND(CAST(SUBSTR(T.IVH_REMARK7, INSTR(T.IVH_REMARK7, '=') + 1) AS DECIMAL),2) AS NUMBER(10, 2)) AS VAT_AMT_OLD, `;
        query += `         T.IVH_TOT_AMT AS TOT_AMT, `;
        query += `         T.IVH_VAT_AMT AS VAT_AMT `;
        query += `    FROM INV_HEADER T `;
        query += `   WHERE 1 = 1 `;
        query += `     AND T.IVH_REQ_STATUS <> 'CANCEL' `;
        query += `     AND (T.IVH_BILL_CODE = '${P_BILL_TO}' OR '${P_BILL_TO}' IS NULL) `;
        query += `     AND (TO_CHAR(T.IVH_INV_DATE,'YYYYMMDD') >= '${P_DATE_FRM}' OR '${P_DATE_FRM}' IS NULL) `;
        query += `     AND (TO_CHAR(T.IVH_INV_DATE,'YYYYMMDD') <= '${P_DATE_TO}' OR '${P_DATE_TO}' IS NULL) `;
        query += `     AND (T.IVH_INV_NO = '${P_INV_NO}' OR '${P_INV_NO}' IS NULL) `;
        query += `   ORDER BY T.IVH_INV_DATE, T.IVH_INV_NO ASC `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            inv_date: row[0],
            inv_no: row[1],
            inv_tot_amt_old: row[2],
            inv_vat_amt_old: row[3],
            inv_ex_rate: row[4],
            inv_tot_amt: row[5],
            inv_vat_amt: row[6],
            tot_amt_old: row[7],
            vat_amt_old: row[8],
            tot_amt: row[9],
            vat_amt: row[10],
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};