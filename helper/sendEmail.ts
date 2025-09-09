import { Resend } from 'resend'

const resend = new Resend(process.env.EMAIL_API_KEY)

const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'NRC Edu <info@nrcedu-uk.com>',
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            html: htmlContent,
        })

        if (error) {
            console.error("Resend API Error:", error)
            return { success: false, message: error.message || "Failed to send email" }
        }
        console.log(data)
        return { success: true, data }
    } catch (err) {
        console.error("Error sending email:", err)
        return { success: false, message: "Unexpected error sending email" }
    }
}

export default sendEmail
