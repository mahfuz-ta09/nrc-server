import nodemailer from "nodemailer"


const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: htmlContent,
        }

        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.error("Error sending email: ", error)
        return { success: false, message: "Failed to send email" }
    }
};

export default sendEmail;
