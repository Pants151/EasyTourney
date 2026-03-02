const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Crear un transportador (transporter)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2. Definir las opciones del email
    const mailOptions = {
        from: '"EasyTourney Support" <support@easytourney.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // 3. Enviar el email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
