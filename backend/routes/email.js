const express = require('express');
const nodemailer = require('nodemailer');

const logger = require('../logger/logger');

const router = express.Router();

const noreplyEmailID = 'no-reply@pxs3374.uta.cloud';
const emailPort = 2096;
const mailingList = [ "94.prashantsingh@gmail.com", "megha.vijendra@mavs.uta.edu" ];

router.post("/signupnotif", async (req, res) => {
    if (!req.body) {
        errMsg = "request body cannot be empty for POST route: /email/signupnotif";
        logger.error(errMsg);
        return res.status(400).json({ error: errMsg });
    }

    const { name, toemail } = req.body;  
    if (!(name || toemail)) {
        errMsg = "mandatory field missing for POST route: /email/signupnotif";
        logger.error(errMsg);
        return res.status(400).json({ error: errMsg });
    }
    try {
        let transporter = nodemailer.createTransport({
            host: 'mail.pxs3374.uta.cloud',
            port: 465, 
            secure: true,
            auth: {
                user: noreplyEmailID,
                pass: 'noreply@utacloud' 
            }
        });

        let mailOptions = {
            from: `Apolita Team <no-reply@pxs3374.uta.cloud>`,
            // to: mailingList, // Recepient email address. Multiple emails can send separated by commas
            to: "94.prashantsingh@gmail.com",
            subject: 'Welcome Email',
            html: "<h3>This is just an email body, dont expect much. LOL. Much Love! Signing out. Die Corona!!</h3>"
        };

        let info = await transporter.sendMail(mailOptions);
        console.log("email sent: %s", info.messageId);
        return res.status(200).json({ message: `email sent`});        
    } catch(err) {
        console.log("err encountered while sending the email:", err)
        return res.status(500).json({ err: `failed to send the email`})
    }
});

module.exports = router;