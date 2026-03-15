const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Crear transportador
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Opciones del email
    const mailOptions = {
        from: '"EasyTourney Support" <support@easytourney.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // Enviar email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
