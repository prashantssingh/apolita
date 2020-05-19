const express = require('express');
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const uuid = require('uuid');
const path = require('path');

// const middleware = require("../middlewares/middleware.js");
const logger = require('../logger/logger');
const User = require('../models/user');

const router = express.Router();

const saltRounds = 10;
const emailBody = `
<h3>Hi ##NAME##,
<br><br>
Thank you for signing up with apolita. <br><br>One last step in the process is to verify your email. Please follow below link to activate your account with us:
<br><a href="##LINK##"><b>Click here to verify!</b></a>
<br><br>
If you are unable to open above link, please copy below link and paste it in browser:
<br>##RAWLINK##<br><br>
Please contact us at support@apolita.com for queries.
<br><br>
Thank you 
<br><br>
--
<br>Best Regards,
<br><b>Apolita Team</b></h3>
`

router.post("/signup", async (req, res) => {
    if (!req.body) {
        errMsg = "request body cannot be empty for POST route: /user/signup";
        logger.error(errMsg);
        return res.status(400).json({ error: errMsg });
    }
    
    if (!(req.body.firstname && req.body.lastname && req.body.email && req.body.password && req.body.gender && req.body.phonenumber && req.body.city && req.body.country)) {
        errMsg = "mandatory field missing field in request";
        logger.error(errMsg);
        return res.status(401).json({ error: errMsg });
    } 

    const newUUID = uuid.v4();;
    // const passwordHash = await bcrypt.hash(req.body.password, saltRounds)
    try {
        User.findByEmail(req.body.email, (err, data) => {
            if (err) {
                if (err.kind == "not_found") {
                    const user = new User({
                        uuid : newUUID,
                        firstname : req.body.firstname,
                        lastname : req.body.lastname,
                        email : req.body.email,
                        // password : passwordHash,
                        password : req.body.password,
                        gender : req.body.gender,
                        phonenumber : req.body.phonenumber,
                        city : req.body.city,
                        state : req.body.state,
                        country : req.body.country,
                    });
    
                    User.create(user, (err, data) => {
                        if (err) {
                            logger.error(`/routes/user.js, func: User.create, err: ${err.message}`);
                            res.status(500).json({
                                message: err.message || "encountered error while creating the user."
                            });
                        } 
                        
                        output = sendEmail(req.body.firstname, req.body.email, newUUID)
                        if (output) {
                            logger.info(`Result of sendmail: ${output}`);
                        }

                        return res.status(200).json(data);
                    });
                } else {
                    logger.error(`/routes/user.js, func: findByEmail, err: ${err.message}`);
                    return res.status(500).json({
                        message: err.message || "encountered error while creating the user."
                    });  
                }
            } else {
                errMsg = "email provided already exists";
                logger.error(errMsg);
                return res.status(409).json({ error: errMsg });
            }
        });
    } catch (err) {
        errMsg = "encountered error while creating the user: " + err;
        logger.error(errMsg);
        return res.status(500).json({ error: errMsg });
    } 
});

router.post("/login", async (req, res) => {
    if (!req.body) {
        errMsg = "request body cannot be empty for POST route: /login";
        logger.error(errMsg);
        return res.status(400).json({ error: errMsg });
    }

    if (!(req.body.email && req.body.password)) {
        errMsg = "mandatory field missing field in request";
        logger.error(errMsg);
        return res.status(401).json({ error: errMsg });
    }
    
    try {
        User.findByEmailPassword(req.body.email, req.body.password, (err, data) => {
            if ( err && err.kind == "not_found") {
                errMsg = `user not found with email - ${req.body.email}`;
                logger.error(errMsg);
                return res.status(401).json({ error: errMsg });
            } else if (!(data.is_authenticated)) {
                errMsg = `User is not yet authenticated with email - ${req.body.email}. Please check your inbox for verification email.`;
                logger.error(errMsg);
                return res.status(401).json({ error: errMsg });
            } else {
                logger.info(`user successfully logged-in using email: ${req.body.email}`);
                return res.status(200).json(data)
            }
        });
    } catch(err) {
        errMsg = "encountered error while logging-in user: " + err;
        logger.error(errMsg);
        return res.status(500).json({ error: errMsg });
    }
});

router.post("/reset", async (req, res) => {
    if (!req.body) {
        errMsg = "request body cannot be empty for POST route: /login";
        logger.error(errMsg);
        return res.status(400).json({ error: errMsg });
    }

    if (!(req.body.email && req.body.password)) {
        errMsg = "mandatory field missing field in request";
        logger.error(errMsg);
        return res.status(402).json({ error: errMsg });
    }
    
    try {
        User.resetByEmail(req.body.email, req.body.password, (err, data) => {
            if ( err == "not_found") {
                errMsg = `user not found with email - ${req.body.email}`;
                logger.error(errMsg);
                return res.status(401).json({ error: errMsg });
            } else {
                logger.info(`Password reset successful using email: ${req.body.email}`);
                console.log(data)
                return res.status(200).json(data)
            }
        });
    } catch {
        errMsg = "encountered error while logging-in user: " + err;
        logger.error(errMsg);
        return res.status(500).json({ error: errMsg });
    }
});

router.post("/fetchall", async (req, res) => {
}); 

router.get("/enroll", async (req, res) => {
    const { courseID, userID } = req.body;
    if (!(courseID || userID)) {
        errMsg = "mandatory field missing field in request";
        logger.error(errMsg);
        return res.status(401).json({ error: errMsg });
    }

    try {
        // TODO: code to enroll the user 
    } catch {
        // catch any error
    }
});

router.get("/:id/verify", async (req, res) => {
    const id = req.params.id;
    try {
        User.updateByUUID(id, (err, data) => {
            if ( err && err.kind == "not_found") {
                errMsg = `user not found with uuid - ${id}`;
                logger.error(errMsg);
                return res.status(401).json({ error: errMsg });
            } else {
                logger.info(`user successfully authenticated with uuid: ${id}`);
                return res.sendFile(path.join(__dirname + '/verified.html'));
            }
        });
    } catch (err) {
        errMsg = "encountered error while authenticating user: " + err;
        logger.error(errMsg);
        return res.status(500).json({ error: errMsg });
    }
});

const sendEmail = async (name, toEmail, UUID) => {
    const link = `http://localhost:8080/student/${UUID}/verify`;
    const transporter = nodemailer.createTransport({
        host: 'mail.pxs3374.uta.cloud',
        port: 465, 
        secure: true,
        auth: {
            user: "no-reply@pxs3374.uta.cloud",
            pass: "noreply@utacloud" 
        }
    });

    cookedEmailBody = emailBody.replace("##NAME##", name);
    cookedEmailBody = cookedEmailBody.replace("##LINK##", link);
    cookedEmailBody = cookedEmailBody.replace("##RAWLINK##", link);

    const mailOptions = {
        from: `Apolita Team <no-reply@apolita.com>`,
        // to: mailingList, // Recepient email address. Multiple emails can send separated by commas
        to: toEmail,
        subject: 'Welcome to Apolita!',
        html: cookedEmailBody
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        return "";
    } catch(err) {
        errMsg = `encountered error while logging-in user: ${err}`
        logger.error(errMsg);
        return errMsg
    }
}

module.exports = router;