import * as express from "express";
import path from "path";

export = (() => {
    let router = express.Router();
          
    router.get('/', (req, res) => {
        res.status(200).json({ message: `Hello World with Typescript` })
    });

    router.get('/favicon.ico', (req, res) => {
        res.status(204).send("");
    });

    // OGPlanet Version
    router.get('/HevaUS.as', (req, res) => {
        res.status(200).sendFile(path.join(__dirname, "../../res/angelScript/HevaUS.as"));
    });

    //"/checkValidToken.og?token=%s&userid=%s&serviceid=%d&servicekey=%s&requesttype=%d&userip=%s"

    //"/refreshToken.og?token=%s&userid=%s&serviceid=%d&userip=%s"

    //"/getUserInfo.og?token=%s&userid=%s&serviceid=%d&servicekey=%s"

    //"/getUserAstro.og?token=%s&userid=%s&serviceid=%d&servicekey=%s&userip=%s"

    //"/buyItem.og?token=%s&userid=%s&serviceid=%d&servicekey=%s&userip=%s"
    //"&itemid=%d&itemname=%s&quantity=%d&duration=%d&usedtype=%d&astro=%d&receiverid=%s&note=%s"

    //"/deductAstro.og?token=%s&userid=%s&serviceid=%d&servicekey=%s&receiverid=%s&userip=%s&recoverid=%d&astro=%d&itemid=%d&itemname=%s&quantity=%d&duration=%d&usedtype=%d&note=%s"

    //"/callbackBuyItem.og?token=%s&userid=%s&serviceid=%d&servicekey=%s&userip=%s&transactionid=%d&status=%d"

    // QEON Version
    router.get('/HevaID.as', (req, res) => {
        res.status(200).sendFile(path.join(__dirname, "../../res/angelScript/HevaID.as"));
    });
    
    return router;
})();