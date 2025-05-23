import nodemailer from "nodemailer"


const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "mail.privateemail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        })

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: htmlContent,
        }

        const emailRes = await transporter.sendMail(mailOptions)
        
        return emailRes
    } catch (error) {
        console.error("Error sending email: ", error)
        return { success: false, message: "Failed to send email" }
    }
};

export default sendEmail;
