const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.getOrderbyInv = async function (req, res) {

    try {
        const data = [
            { value: 'SOLDTO_CODE,ITEM_NO,INVDATE2', label: 'Customer Code,Item Code,Invoice Date' }
            ,
            { value: 'INV_NO,INVDATE2,ITEM_NO', label: 'Invoice,Invoice Date,Item Code' }]

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getItemNo = async function (req, res) {
    const P_DOMAIN = req.query.P_DOMAIN;
    const P_CODE = req.query.P_CODE;
    const P_DESC1 = req.query.P_DESC1;
    const P_DESC2 = req.query.P_DESC2;

    try {

        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += `  SELECT PT_PART  ITEM_NO, `;
        query += `         PT_DESC1 ITEM_DESCRIPTION1, `;
        query += `         PT_DESC2 ITEM_DESCRIPTION2 `;
        query += `    FROM QAD.PT_MSTR `;
        query += `   WHERE 1 = 1 `;
        query += `     AND (UPPER(PT_DOMAIN) = '${P_DOMAIN}' OR '${P_DOMAIN}' IS NULL) `;
        query += `     AND UPPER(PT_PART) LIKE UPPER('${P_CODE}%') `;
        query += `     AND UPPER(PT_DESC1) LIKE UPPER('${P_DESC1}%') `;
        query += `     AND UPPER(PT_DESC2) LIKE UPPER('${P_DESC2}%') `;
        query += ` ORDER BY ITEM_NO ASC  `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            f_code: row[0],
            f_desc1: row[1],
            f_desc2: row[2],
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getShipToCustomer = async function (req, res) {
    const P_DOMAIN = req.query.P_DOMAIN;
    const P_CODE = req.query.P_CODE;
    const P_DESC1 = req.query.P_DESC1;
    const P_TYPE = req.query.P_TYPE;

    try {

        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += `  SELECT DISTINCT AD.AD_ADDR CUST_CODE, AD.AD_NAME CUST_NAME `;
        query += `    FROM QAD.AD_MSTR AD `;
        query += `   WHERE 1 = 1 `;
        query += `     AND (UPPER(AD.AD_DOMAIN) = '${P_DOMAIN}' OR '${P_DOMAIN}' IS NULL) `;
        query += `     AND TRIM(UPPER(AD.AD_TYPE)) = UPPER('${P_TYPE}') `;
        query += `     AND UPPER(AD.AD_ADDR) LIKE UPPER('${P_CODE}%') `;
        query += `     AND UPPER(AD.AD_NAME) LIKE UPPER('${P_DESC1}%') `;
        query += `   ORDER BY AD.AD_ADDR ASC `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            f_code: row[0],
            f_desc1: row[1],
            f_desc2: '',
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


module.exports.getSummaryInv = async function (req, res) {
    const { P_DOMAIN, P_INV_NO_FRM, P_INV_NO_TO, P_INV_DATE_FRM, P_INV_DATE_TO,
        P_SALE_ORD_FRM, P_SALE_ORD_TO, P_ITEM_FRM, P_ITEM_TO, P_DESC1_FRM,
        P_DESC1_TO, P_SHIP_DATE_FRM, P_SHIP_DATE_TO, P_ORDER_DATE_FRM, P_ORDER_DATE_TO,
        P_DUE_DATE_FRM, P_DUE_DATE_TO, P_PRM_DATE_FRM, P_PRM_DATE_TO, P_SHIP_TO_FRM,
        P_SHIP_TO_TO, P_CUS_FRM, P_CUS_TO, P_SITE_FRM, P_SITE_TO,
        P_ITEM_TYPE_FRM, P_ITEM_TYPE_TO, P_CHANNEL_FRM, P_CHANNEL_TO, P_SHIPVA_FRM,
        P_SHIPVA_TO, P_PLAN_FRM, P_PLAN_TO, P_ORDER_BY } = req.query;

    try {
        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += ` 	 SELECT IH2.ITEM_NO,	`;
        query += ` 	        IH2.ITEM_DESC,	`;
        query += ` 	        IH2.ITEM_DESC2,	`;
        query += ` 	        SUM(IH2.ORDQTY) AS ORD_QTY,	`;
        query += ` 	        SUM(IH2.INVQTY) AS INV_QTY,	`;
        query += ` 	        SUM(IH2.AMOUNT_BAHT) AS AMOUNT_BAHT,	`;
        query += ` 	        REPLACE(STRSPLIT(PL_MSTR.PL_DESC, 2, '#'), '?', '') AS PROJECT	`;
        query += ` 	   FROM (SELECT IH.INV_NO,	`;
        query += ` 	                IH.SHIPDATE,	`;
        query += ` 	                IH.INVDATE,	`;
        query += ` 	                IH.INVDATE2,	`;
        query += ` 	                IH.SOLDTO_CODE,	`;
        query += ` 	                CM_MSTR.CM_SORT SOLDTO_NAME,	`;
        query += ` 	                IH.BILLTO_CODE,	`;
        query += ` 	                CM_MSTR.CM_SORT BILLTO_NAME,	`;
        query += ` 	                IH.SHIPTO_CODE,	`;
        query += ` 	                AD_MSTR.AD_NAME SHIPTO_NAME,	`;
        query += ` 	                IH.CUST_PO,	`;
        query += ` 	                IH.SHIPVIA_CODE,	`;
        query += ` 	                IH.TRADETERM_CODE,	`;
        query += ` 	                CODE_MSTR_B.CODE_CMMT SHIPVIA,	`;
        query += ` 	                IH.IH_MODE,	`;
        query += ` 	                CODE_MSTR_C.CODE_CMMT TRADETERM,	`;
        query += ` 	                IH.SO_NO,	`;
        query += ` 	                IH.DETLINE,	`;
        query += ` 	                IH.ITEM_NO,	`;
        query += ` 	                PT_MSTR.PT_DESC1 AS ITEM_DESC,	`;
        query += ` 	                PT_MSTR.PT_DESC2 AS ITEM_DESC2,	`;
        query += ` 	                IH.CUST_PART,	`;
        query += ` 	                IH.ORDQTY,	`;
        query += ` 	                IH.ITEMUNIT,	`;
        query += ` 	                IH.SHIPQTY,	`;
        query += ` 	                IH.INVQTY,	`;
        query += ` 	                IH.CURR,	`;
        query += ` 	                IH.CURR_PRICE,	`;
        query += ` 	                IH.EX_RATE EX_RATE,	`;
        query += ` 	                IH.SITE,	`;
        query += ` 	                IH.AMOUNT_BAHT,	`;
        query += ` 	                IH.CHANNEL,	`;
        query += ` 	                CASE	`;
        query += ` 	                  WHEN PT_MSTR.PT_BUYER <> '' OR PT_MSTR.PT_BUYER IS NOT NULL THEN	`;
        query += ` 	                   (CODE.CODE_CMMT || ' (' || PT_MSTR.PT_BUYER || ')')	`;
        query += ` 	                  ELSE	`;
        query += ` 	                   ' '	`;
        query += ` 	                END AS PLANNER,	`;
        query += ` 	                IH.DOMAIN,	`;
        query += ` 	                PT_MSTR.PT_PART_TYPE ITEM_TYPE,	`;
        query += ` 	                IH.IDH_PRODLINE,	`;
        query += ` 	                IH.IDH_CMTINDX,	`;
        query += ` 	                IH.IDH_ACCT,	`;
        query += ` 	                IH.IDH_SUB	`;
        query += ` 	           FROM (SELECT DISTINCT UPPER(IH_HIST.IH_INV_NBR) AS INV_NO,	`;
        query += ` 	                                 TO_CHAR(IH_HIST.IH_SHIP_DATE, 'dd/mm/yy') AS SHIPDATE,	`;
        query += ` 	                                 TO_CHAR(IH_HIST.IH_INV_DATE, 'dd/mm/yy') AS INVDATE,	`;
        query += ` 	                                 IH_HIST.IH_INV_DATE AS INVDATE2,	`;
        query += ` 	                                 UPPER(IH_HIST.IH_CUST) AS SOLDTO_CODE,	`;
        query += ` 	                                 UPPER(IH_HIST.IH_CUST) AS BILLTO_CODE,	`;
        query += ` 	                                 IH_HIST.IH_SHIP AS SHIPTO_CODE,	`;
        query += ` 	                                 UPPER(IH_HIST.IH_PO) AS CUST_PO,	`;
        query += ` 	                                 IH_HIST.IH_SHIPVIA AS SHIPVIA_CODE,	`;
        query += ` 	                                 IH_HIST.IH_FOB AS TRADETERM_CODE,	`;
        query += ` 	                                 IDH_HIST.IDH__CHR02 IH_MODE,	`;
        query += ` 	                                 IH_HIST.IH_NBR AS SO_NO,	`;
        query += ` 	                                 IDH_HIST.IDH_LINE AS DETLINE,	`;
        query += ` 	                                 UPPER(IDH_HIST.IDH_PART) AS ITEM_NO,	`;
        query += ` 	                                 IDH_HIST.IDH_CUSTPART AS CUST_PART,	`;
        query += ` 	                                 IDH_HIST.IDH_QTY_ORD AS ORDQTY,	`;
        query += ` 	                                 IDH_HIST.IDH_UM AS ITEMUNIT,	`;
        query += ` 	                                 IDH_HIST.IDH_QTY_SHIP AS SHIPQTY,	`;
        query += ` 	                                 IDH_HIST.IDH_QTY_INV AS INVQTY,	`;
        query += ` 	                                 IH_HIST.IH_CURR CURR,	`;
        query += ` 	                                 IDH_HIST.IDH_PRICE AS CURR_PRICE,	`;
        query += ` 	                                 IH_HIST.IH_EX_RATE2 AS EX_RATE,	`;
        query += ` 	                                 IH_HIST.IH_SITE SITE,	`;
        query += ` 	                                 ROUND(IDH_HIST.IDH_QTY_INV *	`;
        query += ` 	                                       IDH_HIST.IDH_PRICE * IH_EX_RATE2,	`;
        query += ` 	                                       2) AS AMOUNT_BAHT,	`;
        query += ` 	                                 IH_HIST.IH_CHANNEL AS CHANNEL,	`;
        query += ` 	                                 IH_HIST.IH_DOMAIN DOMAIN,	`;
        query += ` 	                                 IH_HIST.IH_SHIP,	`;
        query += ` 	                                 IDH_HIST.IDH_PRODLINE,	`;
        query += ` 	                                 IDH_HIST.IDH_CMTINDX,	`;
        query += ` 	                                 IDH_HIST.IDH_ACCT,	`;
        query += ` 	                                 IDH_HIST.IDH_SUB	`;
        query += ` 	                   FROM IH_HIST	`;
        query += ` 	                  INNER JOIN IDH_HIST ON UPPER(IH_HIST.IH_NBR) = UPPER(IDH_HIST.IDH_NBR)	`;
        query += ` 	                    AND UPPER(IH_HIST.IH_INV_NBR) = UPPER(IDH_HIST.IDH_INV_NBR)	`;
        query += ` 	                    AND UPPER(IH_HIST.IH_DOMAIN) = UPPER(IDH_HIST.IDH_DOMAIN)	`;
        query += ` 	                  WHERE 1 = 1	`;
        query += ` 	                    AND (UPPER(IH_HIST.IH_DOMAIN) = '${P_DOMAIN}' OR '${P_DOMAIN}' IS NULL)	`;
        query += ` 	                    AND (UPPER(IH_HIST.IH_INV_NBR) >= '${P_INV_NO_FRM}' OR '${P_INV_NO_FRM}' IS NULL)	`;
        query += ` 	                    AND (UPPER(IH_HIST.IH_INV_NBR) <= '${P_INV_NO_TO}' OR '${P_INV_NO_TO}' IS NULL)	`;
        query += ` 	                    AND (IH_HIST.IH_INV_DATE >= TO_DATE('${P_INV_DATE_FRM}','YYYYMMDD') OR '${P_INV_DATE_FRM}' IS NULL)	`;
        query += ` 	                    AND (IH_HIST.IH_INV_DATE <= TO_DATE('${P_INV_DATE_TO}','YYYYMMDD') OR '${P_INV_DATE_TO}' IS NULL)	`;
        query += ` 	                    AND (UPPER(IH_HIST.IH_NBR) >= '${P_SALE_ORD_FRM}' OR '${P_SALE_ORD_FRM}' IS NULL)	`;
        query += ` 	                    AND (UPPER(IH_HIST.IH_NBR) <= '${P_SALE_ORD_TO}' OR '${P_SALE_ORD_TO}' IS NULL)	`;
        query += ` 	                    AND (UPPER(IDH_HIST.IDH_PART) >= '${P_ITEM_FRM}' OR '${P_ITEM_FRM}' IS NULL)	`;
        query += ` 	                    AND (UPPER(IDH_HIST.IDH_PART) <= '${P_ITEM_TO}' OR '${P_ITEM_TO}' IS NULL)	`;
        query += ` 	                    AND (NVL(UPPER(IH_HIST.IH_SHIP), 'A') >= '${P_SHIP_TO_FRM}' OR '${P_SHIP_TO_FRM}' IS NULL)	`;
        query += ` 	                    AND (NVL(UPPER(IH_HIST.IH_SHIP), 'A') <= '${P_SHIP_TO_TO}' OR '${P_SHIP_TO_TO}' IS NULL)	`;
        query += ` 	                    AND (NVL(UPPER(IH_HIST.IH_CUST), 'A') >= '${P_CUS_FRM}' OR '${P_CUS_FRM}' IS NULL)	`;
        query += ` 	                    AND (NVL(UPPER(IH_HIST.IH_CUST), 'A') <= '${P_CUS_TO}' OR '${P_CUS_TO}' IS NULL)	`;
        query += ` 	                    AND (NVL(UPPER(IH_HIST.IH_SITE), 'A') >= '${P_SITE_FRM}' OR '${P_SITE_FRM}' IS NULL)	`;
        query += ` 	                    AND (NVL(UPPER(IH_HIST.IH_SITE), 'A') <= '${P_SITE_TO}' OR '${P_SITE_TO}' IS NULL)                   	`;
        query += ` 	                    AND (IH_HIST.IH_SHIP_DATE >= TO_DATE('${P_SHIP_DATE_FRM}','YYYYMMDD') OR '${P_SHIP_DATE_FRM}' IS NULL)	`;
        query += ` 	                    AND (IH_HIST.IH_SHIP_DATE <= TO_DATE('${P_SHIP_DATE_TO}','YYYYMMDD') OR '${P_SHIP_DATE_TO}' IS NULL)	`;
        query += ` 	                    AND (IH_HIST.IH_ORD_DATE >= TO_DATE('${P_ORDER_DATE_FRM}','YYYYMMDD') OR '${P_ORDER_DATE_FRM}' IS NULL)	`;
        query += ` 	                    AND (IH_HIST.IH_ORD_DATE <= TO_DATE('${P_ORDER_DATE_TO}','YYYYMMDD') OR '${P_ORDER_DATE_TO}' IS NULL)	`;
        query += ` 	                    AND (IDH_HIST.IDH_DUE_DATE >= TO_DATE('${P_DUE_DATE_FRM}','YYYYMMDD') OR '${P_DUE_DATE_FRM}' IS NULL)	`;
        query += ` 	                    AND (IDH_HIST.IDH_DUE_DATE <= TO_DATE('${P_DUE_DATE_TO}','YYYYMMDD') OR '${P_DUE_DATE_TO}' IS NULL)	`;
        query += ` 	                    AND (IDH_HIST.IDH_PROMISE_DATE >= TO_DATE('${P_PRM_DATE_FRM}','YYYYMMDD') OR '${P_PRM_DATE_FRM}' IS NULL)	`;
        query += ` 	                    AND (IDH_HIST.IDH_PROMISE_DATE <= TO_DATE('${P_PRM_DATE_TO}','YYYYMMDD') OR '${P_PRM_DATE_TO}' IS NULL)	`;
        query += ` 	                    AND (IH_HIST.IH_CHANNEL >= '${P_CHANNEL_FRM}' OR '${P_CHANNEL_FRM}' IS NULL)	`;
        query += ` 	                    AND (IH_HIST.IH_CHANNEL <= '${P_CHANNEL_TO}' OR '${P_CHANNEL_TO}' IS NULL)	`;
        query += ` 	                    AND (IH_HIST.IH_SHIPVIA >= '${P_SHIPVA_FRM}' OR '${P_SHIPVA_FRM}' IS NULL)	`;
        query += ` 	                    AND (IH_HIST.IH_SHIPVIA <= '${P_SHIPVA_TO}' OR '${P_SHIPVA_TO}' IS NULL)) IH	`;
        query += ` 	          INNER JOIN PT_MSTR	`;
        query += ` 	             ON UPPER(IH.ITEM_NO) = UPPER(PT_MSTR.PT_PART)	`;
        query += ` 	            AND UPPER(IH.DOMAIN) = UPPER(PT_MSTR.PT_DOMAIN)	`;
        query += ` 	           LEFT JOIN CM_MSTR	`;
        query += ` 	             ON UPPER(IH.SOLDTO_CODE) = UPPER(CM_MSTR.CM_ADDR)	`;
        query += ` 	            AND UPPER(IH.DOMAIN) = UPPER(CM_MSTR.CM_DOMAIN)	`;
        query += ` 	           LEFT JOIN AD_MSTR	`;
        query += ` 	             ON UPPER(IH.IH_SHIP) = UPPER(AD_MSTR.AD_ADDR)	`;
        query += ` 	            AND UPPER(IH.DOMAIN) = UPPER(AD_MSTR.AD_DOMAIN)	`;
        query += ` 	           LEFT JOIN CODE_MSTR CODE	`;
        query += ` 	             ON UPPER(PT_MSTR.PT_BUYER) = UPPER(CODE.CODE_VALUE)	`;
        query += ` 	            AND UPPER(PT_MSTR.PT_DOMAIN) = UPPER(CODE.CODE_DOMAIN)	`;
        query += ` 	            AND UPPER(CODE.CODE_FLDNAME) = 'PT_BUYER'	`;
        query += ` 	           LEFT JOIN CODE_MSTR CODE_MSTR_B	`;
        query += ` 	             ON UPPER(IH.SHIPVIA_CODE) = UPPER(CODE_MSTR_B.CODE_VALUE)	`;
        query += ` 	            AND UPPER(IH.DOMAIN) = UPPER(CODE_MSTR_B.CODE_DOMAIN)	`;
        query += ` 	            AND UPPER(CODE_MSTR_B.CODE_FLDNAME) = 'SO_SHIPVIA'	`;
        query += ` 	           LEFT JOIN CODE_MSTR CODE_MSTR_C	`;
        query += ` 	             ON UPPER(IH.TRADETERM_CODE) = UPPER(CODE_MSTR_C.CODE_VALUE)	`;
        query += ` 	            AND UPPER(IH.DOMAIN) = UPPER(CODE_MSTR_C.CODE_DOMAIN)	`;
        query += ` 	            AND UPPER(CODE_MSTR_C.CODE_FLDNAME) = 'SO_FOB'	`;
        query += ` 	          WHERE UPPER(PT_MSTR.PT_DOMAIN) = UPPER('${P_DOMAIN}')	`;
        query += ` 	            AND (UPPER(PT_MSTR.PT_DESC1) >= '${P_DESC1_FRM}' OR '${P_DESC1_FRM}' IS NULL)	`;
        query += ` 	            AND (UPPER(PT_MSTR.PT_DESC1) <= '${P_DESC1_TO}' OR '${P_DESC1_TO}' IS NULL)	`;
        query += ` 	            AND (PT_MSTR.PT_PART_TYPE >= '${P_ITEM_TYPE_FRM}' OR '${P_ITEM_TYPE_FRM}' IS NULL)	`;
        query += ` 	            AND (PT_MSTR.PT_PART_TYPE <= '${P_ITEM_TYPE_TO}' OR '${P_ITEM_TYPE_TO}' IS NULL)	`;
        query += ` 	            AND (PT_MSTR.PT_BUYER >= '${P_PLAN_FRM}' OR '${P_PLAN_FRM}' IS NULL)	`;
        query += ` 	            AND (PT_MSTR.PT_BUYER <= '${P_PLAN_TO}' OR '${P_PLAN_TO}' IS NULL)) IH2	`;
        query += ` 	   LEFT JOIN PL_MSTR	`;
        query += ` 	     ON UPPER(IH2.IDH_PRODLINE) = UPPER(PL_MSTR.PL_PROD_LINE)	`;
        query += ` 	    AND UPPER(IH2.DOMAIN) = UPPER(PL_MSTR.PL_DOMAIN)	`;
        query += ` 	   LEFT JOIN CMT_DET	`;
        query += ` 	     ON UPPER(IH2.DOMAIN) = UPPER(CMT_DET.CMT_DOMAIN)	`;
        query += ` 	    AND IH2.IDH_CMTINDX = CMT_DET.CMT_INDX	`;
        query += ` 	    AND UPPER(CMT_DET.CMT_REF) = DECODE('9000',UPPER(CMT_DET.CMT_REF),'FETL_SOD_CMMT')	`;
        query += ` 	  WHERE UPPER(IH2.DOMAIN) = UPPER('${P_DOMAIN}')	`;
        query += ` 	  GROUP BY IH2.ITEM_NO, IH2.ITEM_DESC, IH2.ITEM_DESC2, PL_MSTR.PL_DESC	`;
        query += ` 	  ORDER BY ITEM_NO	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            item_no: row[0],
            item_desc: row[1],
            item_desc2: row[2],
            ord_qty: row[3],
            inv_qty: row[4],
            amt_baht: row[5],
            project: row[6]
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getDataInv = async function (req, res) {
    const { P_DOMAIN, P_INV_NO_FRM, P_INV_NO_TO, P_INV_DATE_FRM, P_INV_DATE_TO,
        P_SALE_ORD_FRM, P_SALE_ORD_TO, P_ITEM_FRM, P_ITEM_TO, P_DESC1_FRM,
        P_DESC1_TO, P_SHIP_DATE_FRM, P_SHIP_DATE_TO, P_ORDER_DATE_FRM, P_ORDER_DATE_TO,
        P_DUE_DATE_FRM, P_DUE_DATE_TO, P_PRM_DATE_FRM, P_PRM_DATE_TO, P_SHIP_TO_FRM,
        P_SHIP_TO_TO, P_CUS_FRM, P_CUS_TO, P_SITE_FRM, P_SITE_TO,
        P_ITEM_TYPE_FRM, P_ITEM_TYPE_TO, P_CHANNEL_FRM, P_CHANNEL_TO, P_SHIPVA_FRM,
        P_SHIPVA_TO, P_PLAN_FRM, P_PLAN_TO, P_ORDER_BY } = req.query;

    try {
        const connect = await ConnectOracleDB("QAD");
        let query = "";
        query += ` 	SELECT IH2.INV_NO,	`;
        query += ` 	       IH2.SHIPDATE,	`;
        query += ` 	       IH2.INVDATE,	`;
        query += ` 	       IH2.INVDATE2,	`;
        query += ` 	       IH2.SOLDTO_CODE,	`;
        query += ` 	       IH2.SOLDTO_NAME,	`;
        query += ` 	       IH2.BILLTO_CODE,	`;
        query += ` 	       IH2.BILLTO_NAME,	`;
        query += ` 	       IH2.SHIPTO_CODE,	`;
        query += ` 	       IH2.SHIPTO_NAME,	`;
        query += ` 	       IH2.CUST_PO,	`;
        query += ` 	       IH2.SHIPVIA_CODE,	`;
        query += ` 	       IH2.TRADETERM_CODE,	`;
        query += ` 	       IH2.SHIPVIA,	`;
        query += ` 	       IH2.IH_MODE,	`;
        query += ` 	       IH2.TRADETERM,	`;
        query += ` 	       IH2.SO_NO,	`;
        query += ` 	       IH2.DETLINE,	`;
        query += ` 	       IH2.ITEM_NO,	`;
        query += ` 	       IH2.ITEM_DESC,	`;
        query += ` 	       IH2.CUST_PART,	`;
        query += ` 	       IH2.ORDQTY,	`;
        query += ` 	       IH2.ITEMUNIT,	`;
        query += ` 	       IH2.SHIPQTY,	`;
        query += ` 	       IH2.INVQTY,	`;
        query += ` 	       IH2.CURR,	`;
        query += ` 	       IH2.CURR_PRICE,	`;
        query += ` 	       ROUND(IH2.CURR_PRICE * IH2.INVQTY, 2) AMOUNT,	`;
        query += ` 	       IH2.EX_RATE,	`;
        query += ` 	       IH2.SITE,	`;
        query += ` 	       IH2.AMOUNT_BAHT,	`;
        query += ` 	       IH2.CHANNEL,	`;
        query += ` 	       IH2.PLANNER,	`;
        query += ` 	       IH2.DOMAIN,	`;
        query += ` 	       REPLACE(STRSPLIT(CMT_DET.CMT_CMMT##5, 2, '='), '?', '') AS COMMENTS,	`;
        query += ` 	       IH2.ITEM_TYPE,	`;
        query += ` 	       REPLACE(STRSPLIT(PL_MSTR.PL_DESC, 2, '#'), '?', '') PROJECT,	`;
        query += ` 	       IH2.IDH_CMTINDX,	`;
        query += ` 	       IH2.IDH_ACCT,	`;
        query += ` 	       IH2.IDH_SUB	`;
        query += ` 	  FROM (SELECT IH.INV_NO,	`;
        query += ` 	               IH.SHIPDATE,	`;
        query += ` 	               IH.INVDATE,	`;
        query += ` 	               IH.INVDATE2,	`;
        query += ` 	               IH.SOLDTO_CODE,	`;
        query += ` 	               CM_MSTR.CM_SORT SOLDTO_NAME,	`;
        query += ` 	               IH.BILLTO_CODE,	`;
        query += ` 	               CM_MSTR.CM_SORT BILLTO_NAME,	`;
        query += ` 	               IH.SHIPTO_CODE,	`;
        query += ` 	               AD_MSTR.AD_NAME SHIPTO_NAME,	`;
        query += ` 	               IH.CUST_PO,	`;
        query += ` 	               IH.SHIPVIA_CODE,	`;
        query += ` 	               IH.TRADETERM_CODE,	`;
        query += ` 	               CODE_MSTR_B.CODE_CMMT SHIPVIA,	`;
        query += ` 	               IH.IH_MODE,	`;
        query += ` 	               CODE_MSTR_C.CODE_CMMT TRADETERM,	`;
        query += ` 	               IH.SO_NO,	`;
        query += ` 	               IH.DETLINE,	`;
        query += ` 	               IH.ITEM_NO,	`;
        query += ` 	               PT_MSTR.PT_DESC1 AS ITEM_DESC,	`;
        query += ` 	               IH.CUST_PART,	`;
        query += ` 	               IH.ORDQTY,	`;
        query += ` 	               IH.ITEMUNIT,	`;
        query += ` 	               IH.SHIPQTY,	`;
        query += ` 	               IH.INVQTY,	`;
        query += ` 	               IH.CURR,	`;
        query += ` 	               IH.CURR_PRICE,	`;
        query += ` 	               IH.EX_RATE EX_RATE,	`;
        query += ` 	               IH.SITE,	`;
        query += ` 	               IH.AMOUNT_BAHT,	`;
        query += ` 	               IH.CHANNEL,	`;
        query += ` 	               CASE	`;
        query += ` 	                 WHEN PT_MSTR.PT_BUYER <> '' OR PT_MSTR.PT_BUYER IS NOT NULL THEN	`;
        query += ` 	                  (CODE.CODE_CMMT || ' (' || PT_MSTR.PT_BUYER || ')')	`;
        query += ` 	                 ELSE	`;
        query += ` 	                  ' '	`;
        query += ` 	               END AS PLANNER,	`;
        query += ` 	               IH.DOMAIN,	`;
        query += ` 	               PT_MSTR.PT_PART_TYPE ITEM_TYPE,	`;
        query += ` 	               IH.IDH_PRODLINE,	`;
        query += ` 	               IH.IDH_CMTINDX,	`;
        query += ` 	               IH.IDH_ACCT,	`;
        query += ` 	               IH.IDH_SUB	`;
        query += ` 	          FROM (SELECT DISTINCT UPPER(IH_HIST.IH_INV_NBR) AS INV_NO,	`;
        query += ` 	                                TO_CHAR(IH_HIST.IH_SHIP_DATE, 'dd/mm/yy') AS SHIPDATE,	`;
        query += ` 	                                TO_CHAR(IH_HIST.IH_INV_DATE, 'dd/mm/yy') AS INVDATE,	`;
        query += ` 	                                IH_HIST.IH_INV_DATE AS INVDATE2,	`;
        query += ` 	                                UPPER(IH_HIST.IH_CUST) AS SOLDTO_CODE,	`;
        query += ` 	                                UPPER(IH_HIST.IH_CUST) AS BILLTO_CODE,	`;
        query += ` 	                                IH_HIST.IH_SHIP AS SHIPTO_CODE,	`;
        query += ` 	                                UPPER(IH_HIST.IH_PO) AS CUST_PO,	`;
        query += ` 	                                IH_HIST.IH_SHIPVIA AS SHIPVIA_CODE,	`;
        query += ` 	                                IH_HIST.IH_FOB AS TRADETERM_CODE,	`;
        query += ` 	                                IDH_HIST.IDH__CHR02 IH_MODE,	`;
        query += ` 	                                IH_HIST.IH_NBR AS SO_NO,	`;
        query += ` 	                                IDH_HIST.IDH_LINE AS DETLINE,	`;
        query += ` 	                                UPPER(IDH_HIST.IDH_PART) AS ITEM_NO,	`;
        query += ` 	                                IDH_HIST.IDH_CUSTPART AS CUST_PART,	`;
        query += ` 	                                IDH_HIST.IDH_QTY_ORD AS ORDQTY,	`;
        query += ` 	                                IDH_HIST.IDH_UM AS ITEMUNIT,	`;
        query += ` 	                                IDH_HIST.IDH_QTY_SHIP AS SHIPQTY,	`;
        query += ` 	                                IDH_HIST.IDH_QTY_INV AS INVQTY,	`;
        query += ` 	                                IH_HIST.IH_CURR CURR,	`;
        query += ` 	                                IDH_HIST.IDH_PRICE AS CURR_PRICE,	`;
        query += ` 	                                IH_HIST.IH_EX_RATE2 AS EX_RATE,	`;
        query += ` 	                                IH_HIST.IH_SITE SITE,	`;
        query += ` 	                                ROUND(IDH_HIST.IDH_QTY_INV *	`;
        query += ` 	                                      IDH_HIST.IDH_PRICE * IH_EX_RATE2,	`;
        query += ` 	                                      2) AS AMOUNT_BAHT,	`;
        query += ` 	                                IH_HIST.IH_CHANNEL AS CHANNEL,	`;
        query += ` 	                                IH_HIST.IH_DOMAIN DOMAIN,	`;
        query += ` 	                                IH_HIST.IH_SHIP,	`;
        query += ` 	                                IDH_HIST.IDH_PRODLINE,	`;
        query += ` 	                                IDH_HIST.IDH_CMTINDX,	`;
        query += ` 	                                IDH_HIST.IDH_ACCT,	`;
        query += ` 	                                IDH_HIST.IDH_SUB	`;
        query += ` 	                  FROM IH_HIST	`;
        query += ` 	                 INNER JOIN IDH_HIST	`;
        query += ` 	                    ON UPPER(IH_HIST.IH_NBR) = UPPER(IDH_HIST.IDH_NBR)	`;
        query += ` 	                   AND UPPER(IH_HIST.IH_INV_NBR) =	`;
        query += ` 	                       UPPER(IDH_HIST.IDH_INV_NBR)	`;
        query += ` 	                   AND UPPER(IH_HIST.IH_DOMAIN) = UPPER(IDH_HIST.IDH_DOMAIN)	`;
        query += ` 	                 WHERE 1 = 1	`;
        query += ` 	                   AND (UPPER(IH_HIST.IH_DOMAIN) = '${P_DOMAIN}' OR '${P_DOMAIN}' IS NULL)	`;
        query += ` 	                   AND (UPPER(IH_HIST.IH_INV_NBR) >= '${P_INV_NO_FRM}' OR '${P_INV_NO_FRM}' IS NULL)	`;
        query += ` 	                   AND (UPPER(IH_HIST.IH_INV_NBR) <= '${P_INV_NO_TO}' OR '${P_INV_NO_TO}' IS NULL)	`;
        query += ` 	                   AND (IH_HIST.IH_INV_DATE >= TO_DATE('${P_INV_DATE_FRM}','YYYYMMDD') OR '${P_INV_DATE_FRM}' IS NULL)	`;
        query += ` 	                   AND (IH_HIST.IH_INV_DATE <= TO_DATE('${P_INV_DATE_TO}','YYYYMMDD') OR '${P_INV_DATE_TO}' IS NULL)	`;
        query += ` 	                   AND (UPPER(IH_HIST.IH_NBR) >= '${P_SALE_ORD_FRM}' OR '${P_SALE_ORD_FRM}' IS NULL)	`;
        query += ` 	                   AND (UPPER(IH_HIST.IH_NBR) <= '${P_SALE_ORD_TO}' OR '${P_SALE_ORD_TO}' IS NULL)	`;
        query += ` 	                   AND (UPPER(IDH_HIST.IDH_PART) >= '${P_ITEM_FRM}' OR '${P_ITEM_FRM}' IS NULL)	`;
        query += ` 	                   AND (UPPER(IDH_HIST.IDH_PART) <= '${P_ITEM_TO}' OR '${P_ITEM_TO}' IS NULL)	`;
        query += ` 	                   AND (NVL(UPPER(IH_HIST.IH_SHIP), 'A') >= '${P_SHIP_TO_FRM}' OR '${P_SHIP_TO_FRM}' IS NULL)	`;
        query += ` 	                   AND (NVL(UPPER(IH_HIST.IH_SHIP), 'A') <= '${P_SHIP_TO_TO}' OR '${P_SHIP_TO_TO}' IS NULL)	`;
        query += ` 	                   AND (NVL(UPPER(IH_HIST.IH_CUST), 'A') >= '${P_CUS_FRM}' OR '${P_CUS_FRM}' IS NULL)	`;
        query += ` 	                   AND (NVL(UPPER(IH_HIST.IH_CUST), 'A') <= '${P_CUS_TO}' OR '${P_CUS_TO}' IS NULL)	`;
        query += ` 	                   AND (NVL(UPPER(IH_HIST.IH_SITE), 'A') >= '${P_SITE_FRM}' OR '${P_SITE_FRM}' IS NULL)	`;
        query += ` 	                   AND (NVL(UPPER(IH_HIST.IH_SITE), 'A') <= '${P_SITE_TO}' OR '${P_SITE_TO}' IS NULL)                   	`;
        query += ` 	                   AND (IH_HIST.IH_SHIP_DATE >= TO_DATE('${P_SHIP_DATE_FRM}','YYYYMMDD') OR '${P_SHIP_DATE_FRM}' IS NULL)	`;
        query += ` 	                   AND (IH_HIST.IH_SHIP_DATE <= TO_DATE('${P_SHIP_DATE_TO}','YYYYMMDD') OR '${P_SHIP_DATE_TO}' IS NULL)	`;
        query += ` 	                   AND (IH_HIST.IH_ORD_DATE >= TO_DATE('${P_ORDER_DATE_FRM}','YYYYMMDD') OR '${P_ORDER_DATE_FRM}' IS NULL)	`;
        query += ` 	                   AND (IH_HIST.IH_ORD_DATE <= TO_DATE('${P_ORDER_DATE_TO}','YYYYMMDD') OR '${P_ORDER_DATE_TO}' IS NULL)	`;
        query += ` 	                   AND (IDH_HIST.IDH_DUE_DATE >= TO_DATE('${P_DUE_DATE_FRM}','YYYYMMDD') OR '${P_DUE_DATE_FRM}' IS NULL)	`;
        query += ` 	                   AND (IDH_HIST.IDH_DUE_DATE <= TO_DATE('${P_DUE_DATE_TO}','YYYYMMDD') OR '${P_DUE_DATE_TO}' IS NULL)	`;
        query += ` 	                   AND (IDH_HIST.IDH_PROMISE_DATE >= TO_DATE('${P_PRM_DATE_FRM}','YYYYMMDD') OR '${P_PRM_DATE_FRM}' IS NULL)	`;
        query += ` 	                   AND (IDH_HIST.IDH_PROMISE_DATE <= TO_DATE('${P_PRM_DATE_TO}','YYYYMMDD') OR '${P_PRM_DATE_TO}' IS NULL)	`;
        query += ` 	                   AND (IH_HIST.IH_CHANNEL >= '${P_CHANNEL_FRM}' OR '${P_CHANNEL_FRM}' IS NULL)	`;
        query += ` 	                   AND (IH_HIST.IH_CHANNEL <= '${P_CHANNEL_TO}' OR '${P_CHANNEL_TO}' IS NULL)	`;
        query += ` 	                   AND (IH_HIST.IH_SHIPVIA >= '${P_SHIPVA_FRM}' OR '${P_SHIPVA_FRM}' IS NULL)	`;
        query += ` 	                   AND (IH_HIST.IH_SHIPVIA <= '${P_SHIPVA_TO}' OR '${P_SHIPVA_TO}' IS NULL)) IH	`;
        query += ` 	         INNER JOIN PT_MSTR	`;
        query += ` 	            ON UPPER(IH.ITEM_NO) = UPPER(PT_MSTR.PT_PART)	`;
        query += ` 	           AND UPPER(IH.DOMAIN) = UPPER(PT_MSTR.PT_DOMAIN)	`;
        query += ` 	          LEFT JOIN CM_MSTR	`;
        query += ` 	            ON UPPER(IH.SOLDTO_CODE) = UPPER(CM_MSTR.CM_ADDR)	`;
        query += ` 	           AND UPPER(IH.DOMAIN) = UPPER(CM_MSTR.CM_DOMAIN)	`;
        query += ` 	          LEFT JOIN AD_MSTR	`;
        query += ` 	            ON UPPER(IH.IH_SHIP) = UPPER(AD_MSTR.AD_ADDR)	`;
        query += ` 	           AND UPPER(IH.DOMAIN) = UPPER(AD_MSTR.AD_DOMAIN)	`;
        query += ` 	          LEFT JOIN CODE_MSTR CODE	`;
        query += ` 	            ON UPPER(PT_MSTR.PT_BUYER) = UPPER(CODE.CODE_VALUE)	`;
        query += ` 	           AND UPPER(PT_MSTR.PT_DOMAIN) = UPPER(CODE.CODE_DOMAIN)	`;
        query += ` 	           AND UPPER(CODE.CODE_FLDNAME) = 'PT_BUYER'	`;
        query += ` 	          LEFT JOIN CODE_MSTR CODE_MSTR_B	`;
        query += ` 	            ON UPPER(IH.SHIPVIA_CODE) = UPPER(CODE_MSTR_B.CODE_VALUE)	`;
        query += ` 	           AND UPPER(IH.DOMAIN) = UPPER(CODE_MSTR_B.CODE_DOMAIN)	`;
        query += ` 	           AND UPPER(CODE_MSTR_B.CODE_FLDNAME) = 'SO_SHIPVIA'	`;
        query += ` 	          LEFT JOIN CODE_MSTR CODE_MSTR_C	`;
        query += ` 	            ON UPPER(IH.TRADETERM_CODE) = UPPER(CODE_MSTR_C.CODE_VALUE)	`;
        query += ` 	           AND UPPER(IH.DOMAIN) = UPPER(CODE_MSTR_C.CODE_DOMAIN)	`;
        query += ` 	           AND UPPER(CODE_MSTR_C.CODE_FLDNAME) = 'SO_FOB'	`;
        query += ` 	         WHERE UPPER(PT_MSTR.PT_DOMAIN) = UPPER('${P_DOMAIN}')	`;
        query += ` 	           AND (UPPER(PT_MSTR.PT_DESC1) >= '${P_DESC1_FRM}' OR '${P_DESC1_FRM}' IS NULL)	`;
        query += ` 	           AND (UPPER(PT_MSTR.PT_DESC1) <= '${P_DESC1_TO}' OR '${P_DESC1_TO}' IS NULL)	`;
        query += ` 	           AND (PT_MSTR.PT_PART_TYPE >= '${P_ITEM_TYPE_FRM}' OR '${P_ITEM_TYPE_FRM}' IS NULL)	`;
        query += ` 	           AND (PT_MSTR.PT_PART_TYPE <= '${P_ITEM_TYPE_TO}' OR '${P_ITEM_TYPE_TO}' IS NULL)	`;
        query += ` 	           AND (PT_MSTR.PT_BUYER >= '${P_PLAN_FRM}' OR '${P_PLAN_FRM}' IS NULL)	`;
        query += ` 	           AND (PT_MSTR.PT_BUYER <= '${P_PLAN_TO}' OR '${P_PLAN_TO}' IS NULL)) IH2	`;
        query += ` 	  LEFT JOIN PL_MSTR	`;
        query += ` 	    ON UPPER(IH2.IDH_PRODLINE) = UPPER(PL_MSTR.PL_PROD_LINE)	`;
        query += ` 	   AND UPPER(IH2.DOMAIN) = UPPER(PL_MSTR.PL_DOMAIN)	`;
        query += ` 	  LEFT JOIN CMT_DET	`;
        query += ` 	    ON UPPER(IH2.DOMAIN) = UPPER(CMT_DET.CMT_DOMAIN)	`;
        query += ` 	   AND IH2.IDH_CMTINDX = CMT_DET.CMT_INDX	`;
        query += ` 	   AND UPPER(CMT_DET.CMT_REF) =	`;
        query += ` 	       DECODE('9000', UPPER(CMT_DET.CMT_REF), 'FETL_SOD_CMMT')	`;
        query += ` 	 WHERE UPPER(IH2.DOMAIN) = UPPER('${P_DOMAIN}')	`;
        query += ` 	 ORDER BY ${P_ORDER_BY}	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            inv_no: row[0],
            ship_date: row[1],
            inv_date: row[2],
            inv_date2: row[3],
            soldto_code: row[4],
            soldto_name: row[5],
            billto_code: row[6],
            billto_name: row[7],
            shipto_code: row[8],
            shipto_name: row[9],
            cust_po: row[10],
            shipvia_code: row[11],
            tradeterm_code: row[12],
            shipvia: row[13],
            ih_mode: row[14],
            tradeterm: row[15],
            so_no: row[16],
            detline: row[17],
            item_no: row[18],
            item_desc: row[19],
            cust_part: row[20],
            ord_qty: row[21],
            item_unit: row[22],
            ship_qty: row[23],
            inv_qty: row[24],
            curr: row[25],
            curr_price: row[26],
            amount: row[27],
            ex_rate: row[28],
            site: row[29],
            amount_baht: row[30],
            channel: row[31],
            planner: row[32],
            domain: row[33],
            comments: row[34],
            item_type: row[35],
            project: row[36],
            idh_cmtindx: row[37],
            idh_acct: row[38],
            idh_sub: row[39]
        }));

        res.json(data);

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};