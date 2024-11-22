const express = require("express");
const { Client } = require("pg");
const app = express();
const { ConnectOracleDB, DisconnectOracleDB, ConnectPostgresDB } = require('./DBconnection.cjs');
const { pgCUSR, pgACC } = ConnectPostgresDB();
const nodemailer = require('nodemailer');

module.exports.getFactory = async function (req, res) {
    const client = new Client(pgCUSR);
    try {
        client.connect();
        const query = `select * from "CUSR".get_factory()`;
        const { rows, rowCount } = await client.query(query);
        client.end();
        if (rowCount > 0) {
            res.json(rows);
        } else {
            res.status(404).send('No data found');
        }
    } catch (error) {
        client.end();
        console.error("Error querying PostgreSQL:", error.message);
        res.status(500).send({ error: error.message });
    }
};

module.exports.getCostCenter = async function (req, res) {
    const client = new Client(pgCUSR);
    try {
        client.connect();
        const query = `select * from "CUSR".get_costcenter()`;
        const { rows, rowCount } = await client.query(query);
        client.end();
        if (rowCount > 0) {
            res.json(rows);
        } else {
            res.status(404).send('No data found');
        }
    } catch (error) {
        client.end();
        console.error("Error querying PostgreSQL:", error.message);
        res.status(500).send({ error: error.message });
    }
};

module.exports.SendMail = async function (req, res) {
    // const { name, email, message } = req.body;
    const transporter = nodemailer.createTransport({
        host: '10.17.220.200',  // Replace with your SMTP server IP
        port: 25,              // Replace with your SMTP server port
        secure: false,         // true for 465, false for other ports
        // No auth required
    });
    try {
        const mailOptions = {
            from: req.body.MailFrom,
            to: req.body.MailTo,
            cc: req.body.MailCC,
            subject: req.body.MailSubject,
            html: req.body.MailMessage
        };
        await transporter.sendMail(mailOptions);
        res.status(200).send('');
    } catch (error) {
        console.error("Error sending email:", error.message);
        // res.status(500).send({ error: error.message });
        res.status(200).send('');
    }

};

module.exports.getCostCenterByFacrory = async function (req, res) {
    const P_FACTORY = req.query.P_FACTORY;
    const client = new Client(pgCUSR);
    try {
        client.connect();
        const query = `select * from "CUSR".get_costcenter_by_factory($1)`;
        const { rows, rowCount } = await client.query(query, [P_FACTORY]);
        client.end();
        if (rowCount > 0) {
            res.json(rows);
        } else {
            res.status(404).send('No data found');
        }
    } catch (error) {
        client.end();
        console.error("Error querying PostgreSQL:", error.message);
        res.status(500).send({ error: error.message });
    }
};

module.exports.getCostCenterForMail = async function (req, res) {
    const client = new Client(pgCUSR);
    try {
        client.connect();
        const query = `select * from "CUSR".get_costcenter()`;
        const { rows, rowCount } = await client.query(query);
        client.end();
        if (rowCount > 0) {
            rows.push({ value: 'RQCT', label: 'RQCT' });

            res.json(rows); // ส่งข้อมูลกลับ
        } else {
            res.status(404).send('No data found');
        }
    } catch (error) {
        client.end();
        console.error("Error querying PostgreSQL:", error.message);
        res.status(500).send({ error: error.message });
    }
};

module.exports.getDomain = async function (req, res) {

    try {

        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += `   SELECT QAD.DOM_MSTR.DOM_DOMAIN, `;
        query += `          QAD.DOM_MSTR.DOM_DOMAIN || ':' || QAD.DOM_MSTR.DOM_NAME AS DOM_DESC `;
        query += `     FROM QAD.DOM_MSTR `;
        query += `    WHERE DOM_DOMAIN >= '1000' `;
        query += `      AND DOM_DOMAIN <= '9000' `;
        query += `    ORDER BY QAD.DOM_MSTR.DOM_DOMAIN `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getSite = async function (req, res) {
    const P_DOMAIN = req.query.P_DOMAIN;
    try {

        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += ` SELECT DISTINCT SI_MSTR.SI_SITE, `;
        query += `                 (SI_MSTR.SI_SITE || ':' || SI_MSTR.SI_DESC) SITE_DESC `;
        query += `   FROM SI_MSTR `;
        query += `  WHERE 1 = 1 `;
        query += `    AND (SI_MSTR.SI_DOMAIN = '${P_DOMAIN}' OR '${P_DOMAIN}' IS NULL) `;
        query += `    ORDER BY SI_MSTR.SI_SITE `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getItemType = async function (req, res) {
    const P_DOMAIN = req.query.P_DOMAIN;
    try {

        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += ` SELECT DISTINCT CODE_MSTR.CODE_VALUE ITEM_TYPE_CODE, `;
        query += `                CODE_MSTR.CODE_VALUE || ':' || CODE_MSTR.CODE_CMMT AS ITEM_TYPE_DESC `;
        query += `  FROM CODE_MSTR `;
        query += ` WHERE UPPER(CODE_MSTR.CODE_FLDNAME) = 'PT_PART_TYPE' `;
        query += `   AND CODE_MSTR.CODE_VALUE <> ' ' `;
        query += `   AND (CODE_MSTR.CODE_DOMAIN = '${P_DOMAIN}' OR '${P_DOMAIN}' IS NULL) `;
        query += ` ORDER BY ITEM_TYPE_CODE `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getChannel = async function (req, res) {

    try {

        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += ` SELECT DISTINCT CODE_VALUE `;
        query += `  FROM CODE_MSTR `;
        query += ` WHERE UPPER(CODE_MSTR.CODE_FLDNAME) = 'SO_CHANNEL' `;
        query += ` ORDER BY CODE_MSTR.CODE_VALUE `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[0]
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getPlanner = async function (req, res) {

    try {

        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += `   SELECT DISTINCT CODE_VALUE AS BUYER_CODE, `;
        query += `                   (CODE_VALUE || ' : ' || CODE_CMMT) AS BUYER_NAME `;
        query += `     FROM CODE_MSTR `;
        query += `    WHERE UPPER(CODE_MSTR.CODE_FLDNAME) = 'PT_BUYER' `;
        query += `      AND CODE_VALUE IS NOT NULL `;
        query += `      AND TRIM(CODE_VALUE) <> '  ' `;
        query += `    ORDER BY CODE_MSTR.CODE_VALUE `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getShipvia = async function (req, res) {

    try {

        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += ` SELECT DISTINCT CODE_VALUE AS SHIPVIA_CODE, `;
        query += `                (CODE_VALUE || ' : ' || CODE_CMMT) AS SHIPVIA_NAME `;
        query += `  FROM CODE_MSTR `;
        query += ` WHERE UPPER(CODE_MSTR.CODE_FLDNAME) = 'SO_SHIPVIA' `;
        query += ` ORDER BY CODE_MSTR.CODE_VALUE `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

