import { mailtrapClient,sender } from "./mailtrap.config";
import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplate";


export const sendVerificationEmail = async (email:string,verificationToken:string) =>{
    const recipient = [{email}]
    try {
        const response = await mailtrapClient.send({
            from:sender,
            to:recipient,
            subject:"Verify Your Email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category:"Email Verification"

        })
        console.log("Verification email sent successfully",response);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const sendWelcomeEmail = async (email:string, name:string) => {
    const recipient = [{email}]
    
    try {
        const response = await mailtrapClient.send({
            from : sender,
            to : recipient,
            template_uuid: "ed5b45d3-1ad3-4235-ad3e-48edbfe647ce",
            template_variables:{}
        })
        console.log("Welcome email sent successfully:", response);
    } catch (error) {
        console.error("Error sending welcome email:", error);
        throw new Error(`Failed to send welcome email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
    }
}