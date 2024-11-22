const express = require("express");
const { Client } = require("pg");
const app = express();
const port = 3012;
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const serverCMD = require("./Common/Common.cjs");
const serverReportInv = require("./Report/InvReport.cjs");
const serverShipping = require("./Transaction/ShippingDelTemp.cjs");


function checkBasicAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).send('Authorization header is missing');
    }

    const [type, credentials] = authHeader.split(' ');

    if (type !== 'Basic' || !credentials) {
        return res.status(401).send('Invalid authorization header format');
    }

    const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf8');
    const [username, password] = decodedCredentials.split(':');

    if (username !== process.env.BASIC_AUTHORIZATION_USER || password !== process.env.BASIC_AUTHORIZATION_PASS) {
        return res.status(401).send('Invalid credentials');
    }

    next();
}
app.use(cors());
app.use(checkBasicAuth);
app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.get("/common/getFactory", serverCMD.getFactory);
app.get("/common/getCostCenter", serverCMD.getCostCenter);
app.get("/common/getCostCenterForMail", serverCMD.getCostCenterForMail);
app.get("/common/getCostCenterByFacrory", serverCMD.getCostCenterByFacrory);
app.get("/common/getDomain", serverCMD.getDomain);
app.get("/common/getSite", serverCMD.getSite);
app.get("/common/getItemType", serverCMD.getItemType);
app.get("/common/getChannel", serverCMD.getChannel);
app.get("/common/getPlanner", serverCMD.getPlanner);
app.get("/common/getShipvia", serverCMD.getShipvia);

app.post("/common/SendMail", serverCMD.SendMail);

app.get("/reportinv/getOrderbyInv", serverReportInv.getOrderbyInv);
app.get("/reportinv/getItemNo", serverReportInv.getItemNo);
app.get("/reportinv/getShipToCustomer", serverReportInv.getShipToCustomer);
app.get("/reportinv/getSummaryInv", serverReportInv.getSummaryInv);
app.get("/reportinv/getDataInv", serverReportInv.getDataInv);

app.get("/shipping/getDatatemp", serverShipping.getDatatemp);
app.post("/shipping/delInvTepm", serverShipping.delInvTepm);






app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });